require('dotenv').config();
const db = require('./db-config');

const bcrypt = require('bcrypt');
const saltRounds = parseInt(process.env.SALT_ROUNDS || '10', 10);
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const ROLE_CODES = Object.freeze({
  ADMIN: 'admin',
  TOURNAMENT_ORGANIZER: 'tournament_organizer',
  TEAM_MANAGER: 'team_manager',
});
const MUTABLE_ROLE_CODES = [
  ROLE_CODES.TOURNAMENT_ORGANIZER,
  ROLE_CODES.TEAM_MANAGER,
];
const EMPTY_QUERY_RESULT = { rowCount: 0, rows: [] };

const USER_WITH_ROLES_QUERY = `
  SELECT
    u.*,
    COALESCE(role_payload.roles, ARRAY[]::text[]) AS roles
  FROM users u
  LEFT JOIN LATERAL (
    SELECT ARRAY_AGG(role_rows.code ORDER BY role_rows.priority) AS roles
    FROM (
      SELECT DISTINCT
        r.code,
        CASE r.code
          WHEN 'admin' THEN 1
          WHEN 'tournament_organizer' THEN 2
          WHEN 'team_manager' THEN 3
          ELSE 4
        END AS priority
      FROM user_roles ur
      INNER JOIN roles r
        ON r.id = ur.role_id
      WHERE ur.user_id = u.id
    ) AS role_rows
  ) AS role_payload ON TRUE
`;

const getRoleIdByCode = async (client, roleCode) => {
  const result = await client.query(
    `SELECT id FROM roles WHERE code = $1 LIMIT 1;`,
    [roleCode]
  );
  if (result.rowCount === 0) {
    return null;
  }
  return result.rows[0].id;
};

const isAdminProtectedUser = async (client, userId) => {
  const result = await client.query(
    `
      SELECT (
        EXISTS (
          SELECT 1
          FROM user_roles ur
          INNER JOIN roles r
            ON r.id = ur.role_id
          WHERE ur.user_id = $1
            AND r.code = $2
        )
        OR EXISTS (
          SELECT 1
          FROM users u
          WHERE u.id = $1
            AND u.privilege = 1
        )
      ) AS is_admin;
    `,
    [userId, ROLE_CODES.ADMIN]
  );
  return Boolean(result.rows[0]?.is_admin);
};

const syncLegacyUserRoleColumns = async (client, userId) => {
  return client.query(
    `
      UPDATE users u
      SET role_id = COALESCE(
            (
              SELECT r.id
              FROM user_roles ur
              INNER JOIN roles r
                ON r.id = ur.role_id
              WHERE ur.user_id = u.id
              ORDER BY
                CASE r.code
                  WHEN 'admin' THEN 1
                  WHEN 'tournament_organizer' THEN 2
                  WHEN 'team_manager' THEN 3
                  ELSE 4
                END
              LIMIT 1
            ),
            u.role_id
          ),
          privilege = CASE
            WHEN EXISTS (
              SELECT 1
              FROM user_roles ur
              INNER JOIN roles r
                ON r.id = ur.role_id
              WHERE ur.user_id = u.id
                AND r.code = $2
            ) THEN 1
            ELSE 0
          END
      WHERE u.id = $1
      RETURNING u.id;
    `,
    [userId, ROLE_CODES.ADMIN]
  );
};

const getHydratedUserById = async (client, userId) => {
  return client.query(
    `
      ${USER_WITH_ROLES_QUERY}
      WHERE u.id = $1
      LIMIT 1;
    `,
    [userId]
  );
};

const addUserRoleTx = async (client, userId, roleCode, assignedBy = null) => {
  const userResult = await client.query(
    `SELECT id FROM users WHERE id = $1 FOR UPDATE;`,
    [userId]
  );
  if (userResult.rowCount === 0) {
    return EMPTY_QUERY_RESULT;
  }

  const isAdminProtected = await isAdminProtectedUser(client, userId);
  if (isAdminProtected) {
    return EMPTY_QUERY_RESULT;
  }

  const roleId = await getRoleIdByCode(client, roleCode);
  if (!roleId) {
    return EMPTY_QUERY_RESULT;
  }

  await client.query(
    `
      INSERT INTO user_roles (user_id, role_id, assigned_by)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, role_id)
      DO UPDATE
      SET assigned_by = COALESCE(EXCLUDED.assigned_by, user_roles.assigned_by),
          assigned_at = CASE
            WHEN EXCLUDED.assigned_by IS NOT NULL THEN CURRENT_TIMESTAMP
            ELSE user_roles.assigned_at
          END;
    `,
    [userId, roleId, assignedBy]
  );

  await syncLegacyUserRoleColumns(client, userId);
  return getHydratedUserById(client, userId);
};

const removeUserRoleTx = async (client, userId, roleCode) => {
  const userResult = await client.query(
    `SELECT id FROM users WHERE id = $1 FOR UPDATE;`,
    [userId]
  );
  if (userResult.rowCount === 0) {
    return EMPTY_QUERY_RESULT;
  }

  const isAdminProtected = await isAdminProtectedUser(client, userId);
  if (isAdminProtected) {
    return EMPTY_QUERY_RESULT;
  }

  const roleId = await getRoleIdByCode(client, roleCode);
  if (!roleId) {
    return EMPTY_QUERY_RESULT;
  }

  const hasRoleResult = await client.query(
    `
      SELECT 1
      FROM user_roles
      WHERE user_id = $1
        AND role_id = $2
      LIMIT 1;
    `,
    [userId, roleId]
  );
  if (hasRoleResult.rowCount === 0) {
    return EMPTY_QUERY_RESULT;
  }

  const nonAdminRoleCountResult = await client.query(
    `
      SELECT COUNT(*)::integer AS count
      FROM user_roles ur
      INNER JOIN roles r
        ON r.id = ur.role_id
      WHERE ur.user_id = $1
        AND r.code <> $2;
    `,
    [userId, ROLE_CODES.ADMIN]
  );
  const nonAdminRoleCount = nonAdminRoleCountResult.rows[0].count;
  if (nonAdminRoleCount <= 1) {
    return EMPTY_QUERY_RESULT;
  }

  const deleteResult = await client.query(
    `
      DELETE FROM user_roles
      WHERE user_id = $1
        AND role_id = $2
      RETURNING role_id;
    `,
    [userId, roleId]
  );
  if (deleteResult.rowCount === 0) {
    return EMPTY_QUERY_RESULT;
  }

  await syncLegacyUserRoleColumns(client, userId);
  return getHydratedUserById(client, userId);
};

module.exports = {

  getUser: async (email, password) => {
    const query = `
      ${USER_WITH_ROLES_QUERY}
      WHERE u.email = $1
      LIMIT 1;
    `;
    const result = await db.pool.query(query, [normalizeEmail(email)]);
    if (!result.rows[0]) {
      return null;
    }
    const match = await bcrypt.compare(password, result.rows[0].password);
    if (!match) {
      return null;
    }
    // return the result of the query
    return result;
  },

  createUser: async (email, password, options = {}) => {
    const role = (options.role || 'tournament_organizer').toLowerCase();
    const createdBy = options.createdBy ?? null;
    const query = `
      WITH selected_role AS (
        SELECT id, code
        FROM roles
        WHERE code = $4
      ),
      inserted_user AS (
        INSERT INTO users (email, password, role_id, privilege, created_by)
        SELECT
          $1,
          $2,
          selected_role.id,
          CASE WHEN selected_role.code = 'admin' THEN 1 ELSE 0 END,
          $3
        FROM selected_role
        RETURNING *
      ),
      inserted_role AS (
        INSERT INTO user_roles (user_id, role_id, assigned_by)
        SELECT inserted_user.id, selected_role.id, $3
        FROM inserted_user
        INNER JOIN selected_role ON TRUE
        ON CONFLICT (user_id, role_id) DO NOTHING
      )
      SELECT
        inserted_user.*,
        ARRAY[selected_role.code]::text[] AS roles
      FROM inserted_user
      INNER JOIN selected_role ON TRUE;
    `;

    const passwordHash = await bcrypt.hash(password, saltRounds);
    return await db.pool.query(query, [normalizeEmail(email), passwordHash, createdBy, role]);
  },

  ensureSeedAdmin: async (email, password) => {
    if (!email || !password) {
      throw new Error('Missing ADMIN_SEED_EMAIL or ADMIN_SEED_PASSWORD for admin bootstrap.');
    }
    const normalizedEmail = normalizeEmail(email);
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const schemaInfoQuery = `
        SELECT
          to_regclass('public.roles') IS NOT NULL AS has_roles_table,
          EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
              AND column_name = 'role_id'
          ) AS has_role_id,
          EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
              AND column_name = 'created_by'
          ) AS has_created_by;
      `;
      const schemaInfo = await client.query(schemaInfoQuery);
      const hasRolesTable = schemaInfo.rows[0].has_roles_table;
      const hasRoleId = schemaInfo.rows[0].has_role_id;
      const hasCreatedBy = schemaInfo.rows[0].has_created_by;

      if (hasRolesTable && hasRoleId) {
        const roleResult = await client.query(
          `SELECT id FROM roles WHERE code = 'admin' LIMIT 1;`
        );
        if (roleResult.rowCount === 0) {
          throw new Error('Role "admin" does not exist in roles table.');
        }
        const adminRoleId = roleResult.rows[0].id;

        const existingByEmail = await client.query(
          `SELECT id FROM users WHERE email = $1 LIMIT 1;`,
          [normalizedEmail]
        );
        if (existingByEmail.rowCount > 0) {
          await client.query(
            `UPDATE users
             SET role_id = $1, privilege = 1
             WHERE id = $2;`,
            [adminRoleId, existingByEmail.rows[0].id]
          );
          await client.query('COMMIT');
          return { action: 'existing', id: existingByEmail.rows[0].id };
        }

        const repairedBlankAdmin = await client.query(
          `UPDATE users
           SET email = $1,
               password = $2,
               role_id = $3,
               privilege = 1
           WHERE id = (
             SELECT id
             FROM users
             WHERE privilege = 1
               AND (email IS NULL OR btrim(email) = '')
             ORDER BY id
             LIMIT 1
           )
           RETURNING id;`,
          [normalizedEmail, passwordHash, adminRoleId]
        );
        if (repairedBlankAdmin.rowCount > 0) {
          await client.query('COMMIT');
          return { action: 'repaired', id: repairedBlankAdmin.rows[0].id };
        }

        let insertAdminQuery = `
          INSERT INTO users (email, password, fullname, avatar, introduction, role_id, privilege)
          VALUES ($1, $2, 'System Administrator', 'avt-default.png', 'Seeded administrator account', $3, 1)
          RETURNING id;
        `;
        let insertParams = [normalizedEmail, passwordHash, adminRoleId];
        if (hasCreatedBy) {
          insertAdminQuery = `
            INSERT INTO users (email, password, fullname, avatar, introduction, role_id, privilege, created_by)
            VALUES ($1, $2, 'System Administrator', 'avt-default.png', 'Seeded administrator account', $3, 1, NULL)
            RETURNING id;
          `;
        }
        const inserted = await client.query(insertAdminQuery, insertParams);
        await client.query('COMMIT');
        return { action: 'inserted', id: inserted.rows[0].id };
      }

      const existingLegacy = await client.query(
        `SELECT id FROM users WHERE email = $1 LIMIT 1;`,
        [normalizedEmail]
      );
      if (existingLegacy.rowCount > 0) {
        await client.query(
          `UPDATE users SET privilege = 1 WHERE id = $1;`,
          [existingLegacy.rows[0].id]
        );
        await client.query('COMMIT');
        return { action: 'existing_legacy', id: existingLegacy.rows[0].id };
      }

      const repairedBlankLegacy = await client.query(
        `UPDATE users
         SET email = $1,
             password = $2,
             privilege = 1
         WHERE id = (
           SELECT id
           FROM users
           WHERE privilege = 1
             AND (email IS NULL OR btrim(email) = '')
           ORDER BY id
           LIMIT 1
         )
         RETURNING id;`,
        [normalizedEmail, passwordHash]
      );
      if (repairedBlankLegacy.rowCount > 0) {
        await client.query('COMMIT');
        return { action: 'repaired_legacy', id: repairedBlankLegacy.rows[0].id };
      }

      const insertedLegacy = await client.query(
        `INSERT INTO users (email, password, privilege)
         VALUES ($1, $2, 1)
         RETURNING id;`,
        [normalizedEmail, passwordHash]
      );
      await client.query('COMMIT');
      return { action: 'inserted_legacy', id: insertedLegacy.rows[0].id };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  ensureRegistrationRoleDefault: async () => {
    const schemaInfo = await db.pool.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'role_id'
      ) AS has_role_id;
    `);
    if (!schemaInfo.rows[0].has_role_id) {
      return false;
    }
    await db.pool.query(`
      ALTER TABLE users
      ALTER COLUMN role_id SET DEFAULT 2;
    `);
    return true;
  },

  ensureUserRolesBackfill: async () => {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const schemaInfo = await client.query(`
        SELECT
          to_regclass('public.users') IS NOT NULL AS has_users_table,
          to_regclass('public.roles') IS NOT NULL AS has_roles_table,
          to_regclass('public.user_roles') IS NOT NULL AS has_user_roles_table,
          EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
              AND column_name = 'role_id'
          ) AS has_users_role_id,
          EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
              AND column_name = 'created_by'
          ) AS has_users_created_by,
          EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'user_roles'
              AND column_name = 'assigned_by'
          ) AS has_user_roles_assigned_by,
          EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'user_roles'
              AND column_name = 'assigned_at'
          ) AS has_user_roles_assigned_at;
      `);
      const {
        has_users_table: hasUsersTable,
        has_roles_table: hasRolesTable,
        has_user_roles_table: hasUserRolesTable,
        has_users_role_id: hasUsersRoleId,
        has_users_created_by: hasUsersCreatedBy,
        has_user_roles_assigned_by: hasUserRolesAssignedBy,
        has_user_roles_assigned_at: hasUserRolesAssignedAt,
      } = schemaInfo.rows[0];

      if (!hasUsersTable) {
        throw new Error('Table "users" does not exist; cannot bootstrap user_roles.');
      }
      if (!hasUsersRoleId) {
        throw new Error('Column "users.role_id" does not exist; cannot backfill user_roles.');
      }
      if (!hasRolesTable) {
        throw new Error('Table "roles" does not exist; cannot bootstrap user_roles.');
      }

      let createdTable = false;
      if (!hasUserRolesTable) {
        await client.query(`
          CREATE TABLE public.user_roles (
              user_id integer NOT NULL,
              role_id integer NOT NULL,
              assigned_by integer,
              assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
              CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id),
              CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON DELETE SET NULL,
              CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
              CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
          );
        `);
        createdTable = true;
      } else {
        if (!hasUserRolesAssignedBy) {
          await client.query(`
            ALTER TABLE public.user_roles
            ADD COLUMN assigned_by integer;
          `);
        }
        if (!hasUserRolesAssignedAt) {
          await client.query(`
            ALTER TABLE public.user_roles
            ADD COLUMN assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;
          `);
        }
      }

      let insertedUserRoles;
      if (hasUsersCreatedBy) {
        insertedUserRoles = await client.query(`
          INSERT INTO public.user_roles (user_id, role_id, assigned_by)
          SELECT u.id, u.role_id, u.created_by
          FROM public.users u
          WHERE u.role_id IS NOT NULL
            AND NOT EXISTS (
              SELECT 1
              FROM public.user_roles ur
              WHERE ur.user_id = u.id
                AND ur.role_id = u.role_id
            );
        `);
        await client.query(`
          UPDATE public.user_roles ur
          SET assigned_by = u.created_by
          FROM public.users u
          WHERE ur.user_id = u.id
            AND ur.role_id = u.role_id
            AND ur.assigned_by IS NULL
            AND u.created_by IS NOT NULL;
        `);
      } else {
        insertedUserRoles = await client.query(`
          INSERT INTO public.user_roles (user_id, role_id)
          SELECT u.id, u.role_id
          FROM public.users u
          WHERE u.role_id IS NOT NULL
            AND NOT EXISTS (
              SELECT 1
              FROM public.user_roles ur
              WHERE ur.user_id = u.id
                AND ur.role_id = u.role_id
            );
        `);
      }

      await client.query('COMMIT');
      return {
        createdTable,
        insertedRows: insertedUserRoles.rowCount,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  getAllUsers: async () => {
    const query = `
      ${USER_WITH_ROLES_QUERY}
      ORDER BY u.id;
    `;
    return await db.pool.query(query);
  },

  getUserById: async (id) => {
    const query = `
      ${USER_WITH_ROLES_QUERY}
      WHERE u.id = $1
      LIMIT 1;
    `;
    return await db.pool.query(query, [id]);
  },

  getUserByEmail: async (email) => {
    const query = `
      ${USER_WITH_ROLES_QUERY}
      WHERE u.email = $1
      LIMIT 1;
    `;
    return await db.pool.query(query, [normalizeEmail(email)]);
  },

  addUserRole: async (id, role, assignedBy = null) => {
    const normalizedRole = String(role || '').trim().toLowerCase();
    if (!id || !MUTABLE_ROLE_CODES.includes(normalizedRole)) {
      return EMPTY_QUERY_RESULT;
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await addUserRoleTx(client, id, normalizedRole, assignedBy);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  removeUserRole: async (id, role) => {
    const normalizedRole = String(role || '').trim().toLowerCase();
    if (!id || !MUTABLE_ROLE_CODES.includes(normalizedRole)) {
      return EMPTY_QUERY_RESULT;
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await removeUserRoleTx(client, id, normalizedRole);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  updateUserRole: async (id, role, assignedBy = null) => {
    const normalizedRole = String(role || '').trim().toLowerCase();
    if (!id || !MUTABLE_ROLE_CODES.includes(normalizedRole)) {
      return EMPTY_QUERY_RESULT;
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      let result = await addUserRoleTx(client, id, normalizedRole, assignedBy);
      if (result.rowCount === 0) {
        await client.query('COMMIT');
        return EMPTY_QUERY_RESULT;
      }

      let roles = Array.isArray(result.rows[0].roles) ? result.rows[0].roles : [];
      const removableRoles = MUTABLE_ROLE_CODES.filter(roleCode => roleCode !== normalizedRole);
      for (const roleCode of removableRoles) {
        if (!roles.includes(roleCode)) {
          continue;
        }
        result = await removeUserRoleTx(client, id, roleCode);
        if (result.rowCount === 0) {
          await client.query('ROLLBACK');
          return EMPTY_QUERY_RESULT;
        }
        roles = Array.isArray(result.rows[0].roles) ? result.rows[0].roles : [];
      }

      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  updateUserInfo: async (id, fullname, birthday, phone, introduction) => {
    if (birthday.length == 0) { birthday = null; }
    if (phone.length == 0) { phone = null; }
    if (introduction.length == 0) { introduction = null; }
    const query = `
      UPDATE users SET fullname = $1, birthday = $2, phone = $3, introduction = $4 WHERE id = $5;
    `;
    return await db.pool.query(query, [fullname, birthday, phone, introduction, id]);
  },

  updateUserAvatar: async (id, avatar) => {
    const query = `
        UPDATE users SET avatar = $1 WHERE id = $2;
      `;
    console.log(avatar);

    return await db.pool.query(query, [avatar, id]);
  },

  updateUserPassword: async (id, newPassword) => {
    const query = `
      UPDATE users SET password = $1 WHERE id = $2;
    `;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    return await db.pool.query(query, [passwordHash, id]);
  },


};
