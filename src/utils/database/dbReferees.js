require('dotenv').config();
const db = require('./db-config');

const MATCH_REFEREE_ROLES = new Set([
  'main',
  'assistant_1',
  'assistant_2',
  'fourth_official',
  'var',
  'avar',
]);

const MATCH_REFEREE_ROLE_ORDER_SQL = `
  CASE mr.role
    WHEN 'main' THEN 1
    WHEN 'assistant_1' THEN 2
    WHEN 'assistant_2' THEN 3
    WHEN 'fourth_official' THEN 4
    WHEN 'var' THEN 5
    WHEN 'avar' THEN 6
    ELSE 99
  END
`;

function normalizeRefereeAssignment(rawAssignment) {
  const refereeId = Number.parseInt(rawAssignment?.refereeId ?? rawAssignment?.referee_id, 10);
  const role = String(rawAssignment?.role || '').trim().toLowerCase();

  if (!Number.isInteger(refereeId)) {
    throw new Error('Invalid referee id in match assignment.');
  }
  if (!MATCH_REFEREE_ROLES.has(role)) {
    throw new Error('Invalid referee role in match assignment.');
  }

  return { refereeId, role };
}

function normalizeMatchIds(matchIds) {
  if (!Array.isArray(matchIds)) {
    return [];
  }

  return [...new Set(
    matchIds
      .map((matchId) => Number.parseInt(matchId, 10))
      .filter((matchId) => Number.isInteger(matchId))
  )];
}

module.exports = {
  getRefereesInTournament: async (tournamentId) => {
    const parsedTournamentId = Number.parseInt(tournamentId, 10);
    if (!Number.isInteger(parsedTournamentId)) {
      return [];
    }

    const query = `
      SELECT id, tournament_id, full_name, phone, email, notes, created_at
      FROM referees
      WHERE tournament_id = $1
      ORDER BY full_name ASC, id ASC;
    `;
    const res = await db.pool.query(query, [parsedTournamentId]);
    return res.rows;
  },

  getMatchReferees: async (matchId) => {
    const parsedMatchId = Number.parseInt(matchId, 10);
    if (!Number.isInteger(parsedMatchId)) {
      return [];
    }

    const query = `
      SELECT
        mr.match_id,
        mr.tournament_id,
        mr.role,
        mr.created_at,
        r.id AS referee_id,
        r.full_name,
        r.phone,
        r.email,
        r.notes
      FROM match_referees mr
      INNER JOIN referees r
        ON r.id = mr.referee_id
        AND r.tournament_id = mr.tournament_id
      WHERE mr.match_id = $1
      ORDER BY ${MATCH_REFEREE_ROLE_ORDER_SQL}, r.full_name ASC, r.id ASC;
    `;
    const res = await db.pool.query(query, [parsedMatchId]);
    return res.rows;
  },

  getMatchRefereesByMatchIds: async (matchIds) => {
    const parsedMatchIds = normalizeMatchIds(matchIds);
    if (parsedMatchIds.length === 0) {
      return [];
    }

    const query = `
      SELECT
        mr.match_id,
        mr.tournament_id,
        mr.role,
        mr.created_at,
        r.id AS referee_id,
        r.full_name,
        r.phone,
        r.email,
        r.notes
      FROM match_referees mr
      INNER JOIN referees r
        ON r.id = mr.referee_id
        AND r.tournament_id = mr.tournament_id
      WHERE mr.match_id = ANY($1::int[])
      ORDER BY mr.match_id ASC, ${MATCH_REFEREE_ROLE_ORDER_SQL}, r.full_name ASC, r.id ASC;
    `;
    const res = await db.pool.query(query, [parsedMatchIds]);
    return res.rows;
  },

  replaceMatchReferees: async (matchId, tournamentId, assignments) => {
    const parsedMatchId = Number.parseInt(matchId, 10);
    const parsedTournamentId = Number.parseInt(tournamentId, 10);
    if (!Number.isInteger(parsedMatchId) || !Number.isInteger(parsedTournamentId)) {
      throw new Error('Invalid match or tournament id when updating match referees.');
    }

    if (!Array.isArray(assignments)) {
      throw new Error('Referee assignments must be an array.');
    }

    const normalizedAssignments = assignments.map(normalizeRefereeAssignment);
    const assignedRoles = new Set();
    const assignedRefereeIds = new Set();
    normalizedAssignments.forEach((assignment) => {
      if (assignedRoles.has(assignment.role)) {
        throw new Error(`Duplicate referee role "${assignment.role}" for match ${parsedMatchId}.`);
      }
      assignedRoles.add(assignment.role);
      if (assignedRefereeIds.has(assignment.refereeId)) {
        throw new Error(`Referee ${assignment.refereeId} has multiple roles in match ${parsedMatchId}.`);
      }
      assignedRefereeIds.add(assignment.refereeId);
    });

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `
          DELETE FROM match_referees
          WHERE match_id = $1
            AND tournament_id = $2;
        `,
        [parsedMatchId, parsedTournamentId]
      );

      for (const assignment of normalizedAssignments) {
        await client.query(
          `
            INSERT INTO match_referees (match_id, referee_id, tournament_id, role)
            VALUES ($1, $2, $3, $4);
          `,
          [parsedMatchId, assignment.refereeId, parsedTournamentId, assignment.role]
        );
      }

      await client.query('COMMIT');
      return normalizedAssignments;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};
