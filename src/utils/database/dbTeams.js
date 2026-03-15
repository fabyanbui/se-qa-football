require('dotenv').config();
const db = require('./db-config');
const TournamentModel = require('../../models/tournament.m');

async function resolveTournamentId(tournamentId) {
  if (tournamentId) {
    return tournamentId;
  }
  return await TournamentModel.getCurrentTournamentId();
}

module.exports = {

  ensureNullableTournamentId: async () => {
    const schemaInfo = await db.pool.query(`
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'teams'
        AND column_name = 'tournament_id';
    `);
    if (schemaInfo.rowCount === 0) {
      return false;
    }
    if (schemaInfo.rows[0].is_nullable === 'YES') {
      return false;
    }
    await db.pool.query(`
      ALTER TABLE teams
      ALTER COLUMN tournament_id DROP NOT NULL;
    `);
    return true;
  },

  countAllTeams: async () => {
    const query = `
      SELECT COUNT(*) FROM teams;
    `;
    const res = await db.pool.query(query);
    return res.rows[0].count;
  },

  countTeamsInTournament: async (id) => {
    const query = `
      SELECT COUNT(*) FROM teams WHERE tournament_id = $1;
    `;
    const res = await db.pool.query(query, [id]);
    return res.rows[0].count;
  },

  createTeam: async (team) => {
    const query = `
      INSERT INTO teams (name, contact_name, contact_email, contact_phone, level, introduction, has_uniform, profile, tournament_id, owner_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id;
    `;
    const res = await db.pool.query(query, [team.name, team.contactName, team.contactEmail, team.contactPhone, team.level, team.introduction, false, team.profile, null, team.ownerId]);
    return res.rows[0].id;
  },

  getAllTeams: async () => {
    const query = `
      SELECT * FROM teams ORDER BY id ASC;
    `;
    const res = await db.pool.query(query);
    return res.rows;
  },

  getAllCurrentTeams: async (tournamentId) => {
    const scopedTournamentId = await resolveTournamentId(tournamentId);
    if (!scopedTournamentId) {
      return [];
    }
    const query = `
      SELECT * FROM teams WHERE tournament_id = $1 ORDER BY id ASC;
    `;
    const res = await db.pool.query(query, [scopedTournamentId]);
    return res.rows;
  },

  getAllActiveTeams: async (tournamentId) => {
    const scopedTournamentId = await resolveTournamentId(tournamentId);
    if (!scopedTournamentId) {
      return [];
    }
    const query = `
      SELECT * FROM teams WHERE tournament_id = $1 AND status = true ORDER BY id ASC;
    `;
    const res = await db.pool.query(query, [scopedTournamentId]);
    return res.rows;
  },

  getTeam: async (id) => {
    const query = `
      SELECT * FROM teams WHERE id = $1;
    `;
    const res = await db.pool.query(query, [id]);
    return res.rows[0];
  },

  countPlayers: async (id) => {
    const query = `
      SELECT COUNT(*) FROM players WHERE team_id = $1;
    `;
    const res = await db.pool.query(query, [id]);
    return res.rows[0].count;
  },

  getPlayers: async (id) => {
    const query = `
      SELECT * FROM players WHERE team_id = $1 ORDER BY id ASC;
    `;
    const res = await db.pool.query(query, [id]);
    return res.rows;
  },

  getTeamsByOwner: async (ownerId) => {
    const query = `
      SELECT * FROM teams WHERE owner_id = $1 ORDER BY id ASC;
    `;
    const res = await db.pool.query(query, [ownerId]);
    return res.rows;
  },

  enrollTeamToTournament: async (id, tournamentId) => {
    const parsedTournamentId = Number.parseInt(tournamentId, 10);
    if (!Number.isInteger(parsedTournamentId)) {
      return 0;
    }
    const query = `
      UPDATE teams
      SET tournament_id = $1, status = false
      WHERE id = $2 AND tournament_id IS NULL
      RETURNING id;
    `;
    const res = await db.pool.query(query, [parsedTournamentId, id]);
    return res.rowCount;
  },

  enrollTeamToCurrentTournament: async (id) => {
    const currentTournamentId = await TournamentModel.getCurrentTournamentId();
    if (!currentTournamentId) {
      return 0;
    }
    return module.exports.enrollTeamToTournament(id, currentTournamentId);
  },

  updateTeam: async (id, team) => {
    console.log(team);
    const query = `
      UPDATE teams SET name = $1, contact_name = $2, contact_email = $3, contact_phone = $4, level = $5, introduction = $6, has_uniform = $7, profile = $8 WHERE id = $9;
    `;
    const res = await db.pool.query(query, [team.name, team.contactName, team.contactEmail, team.contactPhone, team.level, team.introduction, false, team.profile, id]);
    return res.rowCount;
  },

  removePlayer: async (teamId, playerId) => {
    const query = `
      UPDATE players SET team_id = NULL WHERE id = $1;
    `;
    const res = await db.pool.query(query, [playerId]);
    return res.rowCount;
  },

  updateTeamStatus: async (id, status, tournamentId) => {
    const scopedTournamentId = await resolveTournamentId(tournamentId);
    if (!scopedTournamentId) {
      return 0;
    }

    if (status) {
      const scopedTournament = await TournamentModel.getTournamentById(scopedTournamentId);
      if (!scopedTournament) {
        return 0;
      }

      // count (status = true) teams in scoped tournament
      const query = `
        SELECT COUNT(*) FROM teams WHERE tournament_id = $1 AND status = true;
      `;
      const res = await db.pool.query(query, [scopedTournament.id]);
      const count = Number(res.rows[0].count);
      if (count >= Number(scopedTournament.maxTeams)) {
        return 0;
      }
    }
    const query = `
      UPDATE teams SET status = $1 WHERE id = $2 AND tournament_id = $3;
    `;
    const res = await db.pool.query(query, [status, id, scopedTournamentId]);
    return res.rowCount;
  },

  getTeamsStatistics: async (tournamentId) => {
    const scopedTournamentId = await resolveTournamentId(tournamentId);
    if (!scopedTournamentId) {
      return [];
    }
    const query = `
      SELECT teams_statistics.*
      FROM teams_statistics
      JOIN teams ON teams.id = teams_statistics.team_id
      WHERE teams.tournament_id = $1
      ORDER BY teams_statistics.score ASC, teams_statistics.team_id ASC;
    `;
    const res = await db.pool.query(query, [scopedTournamentId]);
    return res.rows;
  },

  deleteTeam: async (id) => {
    const query = `
      DELETE FROM teams WHERE id = $1;
    `;
    const res = await db.pool.query(query, [id]);
    return res.rowCount;
  },

};
