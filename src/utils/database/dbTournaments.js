require('dotenv').config();
const db = require('./db-config');
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

module.exports = {

  count: async () => {
    const query = `
      SELECT COUNT(*) FROM tournaments;
    `;
    return await db.pool.query(query);
  },

  countActive: async () => {
    const query = `
      SELECT COUNT(*) FROM tournaments WHERE is_closed = false;
    `;
    return await db.pool.query(query);
  },

  getCurrentTournamentId: async () => {
    const query = `
      SELECT id FROM tournaments WHERE is_closed = false ORDER BY time_start DESC LIMIT 1;
    `;
    return await db.pool.query(query);
  },

  getCurrentTournament: async () => {
    const query = `
      SELECT * FROM tournaments WHERE is_closed = false ORDER BY time_start DESC LIMIT 1;
    `;
    return await db.pool.query(query);
  },

  getTournamentById: async (id) => {
    const query = `
      SELECT * FROM tournaments WHERE id = $1 LIMIT 1;
    `;
    return await db.pool.query(query, [id]);
  },

  getAllActiveTournaments: async () => {
    const query = `
      SELECT *
      FROM tournaments
      WHERE is_closed = false
      ORDER BY time_start DESC, id DESC;
    `;
    return await db.pool.query(query);
  },

  getActiveTournamentsByOrganizer: async (organizerId) => {
    const query = `
      SELECT *
      FROM tournaments
      WHERE organizer_id = $1
        AND is_closed = false
      ORDER BY time_start DESC, id DESC;
    `;
    return await db.pool.query(query, [organizerId]);
  },

  ensureOrganizerIdBackfill: async (seedAdminEmail) => {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const schemaInfo = await client.query(`
        SELECT
          to_regclass('public.tournaments') IS NOT NULL AS has_tournaments_table,
          to_regclass('public.users') IS NOT NULL AS has_users_table,
          to_regclass('public.roles') IS NOT NULL AS has_roles_table,
          EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'tournaments'
              AND column_name = 'organizer_id'
          ) AS has_organizer_id,
          EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
              AND column_name = 'email'
          ) AS has_user_email,
          EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
              AND column_name = 'role_id'
          ) AS has_user_role_id,
          EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
              AND column_name = 'privilege'
          ) AS has_user_privilege;
      `);
      const {
        has_tournaments_table: hasTournamentsTable,
        has_users_table: hasUsersTable,
        has_roles_table: hasRolesTable,
        has_organizer_id: hasOrganizerId,
        has_user_email: hasUserEmail,
        has_user_role_id: hasUserRoleId,
        has_user_privilege: hasUserPrivilege,
      } = schemaInfo.rows[0];

      if (!hasTournamentsTable) {
        throw new Error('Table "tournaments" does not exist; cannot bootstrap organizer_id.');
      }
      if (!hasUsersTable) {
        throw new Error('Table "users" does not exist; cannot bootstrap organizer_id.');
      }

      let createdColumn = false;
      if (!hasOrganizerId) {
        await client.query(`
          ALTER TABLE public.tournaments
          ADD COLUMN organizer_id integer;
        `);
        createdColumn = true;
      }

      let safeOwnerId = null;
      const normalizedSeedEmail = normalizeEmail(seedAdminEmail);
      if (normalizedSeedEmail && hasUserEmail) {
        const seedAdminOwner = await client.query(`
          SELECT id
          FROM public.users
          WHERE lower(btrim(email)) = $1
          ORDER BY id ASC
          LIMIT 1;
        `, [normalizedSeedEmail]);
        if (seedAdminOwner.rowCount > 0) {
          safeOwnerId = seedAdminOwner.rows[0].id;
        }
      }

      if (!safeOwnerId && hasRolesTable && hasUserRoleId) {
        const adminByRole = await client.query(`
          SELECT u.id
          FROM public.users u
          INNER JOIN public.roles r
            ON r.id = u.role_id
          WHERE r.code = 'admin'
          ORDER BY u.id ASC
          LIMIT 1;
        `);
        if (adminByRole.rowCount > 0) {
          safeOwnerId = adminByRole.rows[0].id;
        }
      }

      if (!safeOwnerId && hasUserPrivilege) {
        const adminByPrivilege = await client.query(`
          SELECT id
          FROM public.users
          WHERE privilege = 1
          ORDER BY id ASC
          LIMIT 1;
        `);
        if (adminByPrivilege.rowCount > 0) {
          safeOwnerId = adminByPrivilege.rows[0].id;
        }
      }

      let updatedRows = 0;
      let setDefault = false;
      let setNotNull = false;
      if (safeOwnerId !== null) {
        const safeOwnerIdAsNumber = Number.parseInt(safeOwnerId, 10);
        if (!Number.isInteger(safeOwnerIdAsNumber)) {
          throw new Error('Resolved organizer_id owner is not a valid integer.');
        }
        await client.query(`
          ALTER TABLE public.tournaments
          ALTER COLUMN organizer_id SET DEFAULT ${safeOwnerIdAsNumber};
        `);
        setDefault = true;

        const updateResult = await client.query(`
          UPDATE public.tournaments
          SET organizer_id = $1
          WHERE organizer_id IS NULL;
        `, [safeOwnerIdAsNumber]);
        updatedRows = updateResult.rowCount;

        const nullCountResult = await client.query(`
          SELECT COUNT(*)::integer AS count
          FROM public.tournaments
          WHERE organizer_id IS NULL;
        `);
        if (nullCountResult.rows[0].count === 0) {
          await client.query(`
            ALTER TABLE public.tournaments
            ALTER COLUMN organizer_id SET NOT NULL;
          `);
          setNotNull = true;
        }
      }

      await client.query('COMMIT');
      return {
        createdColumn,
        safeOwnerId,
        updatedRows,
        setDefault,
        setNotNull,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  create: async (tournament) => {
    const organizerId = Number.parseInt(tournament.organizerId, 10);
    if (!Number.isInteger(organizerId)) {
      throw new Error('Invalid organizer id for tournament creation.');
    }

    const query = `
      INSERT INTO tournaments (name, time_start, time_end, place, map_url, rules_url, n_of_followers, format_id, organizer_id, max_teams, n_of_players)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    const values = [
      tournament.name,
      tournament.timeStart,
      tournament.timeEnd,
      tournament.place,
      tournament.mapURL,
      tournament.rulesURL,
      tournament.nOfFollowers,
      tournament.formatId,
      organizerId,
      tournament.maxTeams,
      tournament.nOfPlayers,
    ];
    const result = await db.pool.query(query, values);
    const id = result.rows[0].id;

    if (tournament.formatId == 1) {
      // insert to matches(tournamet_id, date, time, round)
      // number of matches: tournament.maxTeams * (tournament.maxTeams - 1) / 2
      // date is between tournament.timeStart and tournament.timeEnd
      // time is between 10:00 and 20:00, 3 hours between each match
      // round is from 1 to tournament.maxTeams - 1
      const matches = [];
      const date = new Date(tournament.timeStart);
      const time = new Date(tournament.timeStart);
      time.setHours(10);
      time.setMinutes(0);
      time.setSeconds(0);
      time.setMilliseconds(0);

      for (let i = 0; i < tournament.maxTeams - 1; i++) {
        const round = i + 1;
        for (let j = 0; j < tournament.maxTeams / 2; j++) {
          const timeStr = time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds();
          const dateStr = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
          matches.push({ tournament_id: id, date: dateStr, time: timeStr, round: round });
          time.setHours(time.getHours() + 3);
        }
        date.setDate(date.getDate() + 1);
        time.setHours(10);
      }

      const query = `
        INSERT INTO matches (tournament_id, date, time, round)
        VALUES ($1, $2, $3, $4);
      `;

      for (let i = 0; i < matches.length; i++) {
        const values = [
          matches[i].tournament_id,
          matches[i].date,
          matches[i].time,
          matches[i].round,
        ];
        await db.pool.query(query, values);
      }
    }

    return result;
  },

  countActiveTeamsInTournament: async (id) => {
    const query = `
      SELECT COUNT(*) FROM teams WHERE tournament_id = $1 AND status = true;
    `;
    const res = await db.pool.query(query, [id]);
    return res.rows[0].count;
  },

  getActiveTeamsInTournament: async (id) => {
    const query = `
      SELECT * FROM teams WHERE tournament_id = $1 AND status = true;
    `;
    const res = await db.pool.query(query, [id]);
    return res.rows;
  },

  countPlayersInTournament: async (id) => {
    const query = `
      SELECT COALESCE(SUM(count), 0) AS total_count
      FROM teams t
      LEFT JOIN (
          SELECT team_id, COUNT(*) AS count
          FROM public.players
          WHERE team_id IN (
              SELECT id 
              FROM teams
              WHERE status = true AND tournament_id = $1
           )
           GROUP BY team_id
      ) p ON t.id = p.team_id
      WHERE t.status = true AND t.tournament_id = $1;
    `;
    const res = await db.pool.query(query, [id]);
    return res.rows[0].total_count;
  },

  updateInfo: async (id, tournament) => {
    const query = `
      UPDATE tournaments
      SET name = $1, time_start = $2, time_end = $3, place = $4, map_url = $5, rules_url = $6, format_id = $7, max_teams = $8, n_of_players = $9
      WHERE id = $10
      RETURNING *;
    `;
    const values = [
      tournament.name,
      tournament.timeStart,
      tournament.timeEnd,
      tournament.place,
      tournament.mapURL,
      tournament.rulesURL,
      tournament.formatId,
      tournament.maxTeams,
      tournament.nOfPlayers,
      id,
    ];
    return await db.pool.query(query, values);
  },

};
