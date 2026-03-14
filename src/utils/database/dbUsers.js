require('dotenv').config();
const db = require('./db-config');

const bcrypt = require('bcrypt');
const saltRounds = parseInt(process.env.SALT_ROUNDS || '10', 10);
const normalizeEmail = (email) => email.trim().toLowerCase();

module.exports = {

  getUser: async (email, password) => {
    const query = `
      SELECT * FROM users WHERE email = $1;
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
    const role = (options.role || 'team_manager').toLowerCase();
    const createdBy = options.createdBy ?? null;
    const query = `
      WITH selected_role AS (
        SELECT id, code
        FROM roles
        WHERE code = $4
      )
      INSERT INTO users (email, password, role_id, privilege, created_by)
      SELECT
        $1,
        $2,
        selected_role.id,
        CASE WHEN selected_role.code = 'admin' THEN 1 ELSE 0 END,
        $3
      FROM selected_role
      RETURNING *;
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

  getAllUsers: async () => {
    const query = `
      SELECT * FROM users;
    `;
    return await db.pool.query(query);
  },

  getUserById: async (id) => {
    const query = `
      SELECT * FROM users WHERE id = $1;
    `;
    return await db.pool.query(query, [id]);
  },

  getUserByEmail: async (email) => {
    const query = `
      SELECT * FROM users WHERE email = $1;
    `;
    return await db.pool.query(query, [normalizeEmail(email)]);
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
