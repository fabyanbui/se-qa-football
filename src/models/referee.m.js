const dbReferees = require('../utils/database/dbReferees');

const MATCH_REFEREE_ROLE_LABELS = Object.freeze({
  main: 'Trọng tài chính',
  assistant_1: 'Trợ lý 1',
  assistant_2: 'Trợ lý 2',
  fourth_official: 'Trọng tài thứ tư',
  var: 'VAR',
  avar: 'AVAR',
});

const MATCH_REFEREE_ROLES = Object.keys(MATCH_REFEREE_ROLE_LABELS);
const MATCH_REFEREE_ROLE_SET = new Set(MATCH_REFEREE_ROLES);

function normalizeRole(rawRole) {
  return String(rawRole || '').trim().toLowerCase();
}

class RefereeModel {
  constructor(referee) {
    this.id = referee.referee_id ?? referee.id;
    this.tournamentId = referee.tournament_id;
    this.fullName = referee.full_name;
    this.phone = referee.phone;
    this.email = referee.email;
    this.notes = referee.notes;
    this.createdAt = referee.created_at;

    this.role = referee.role ? normalizeRole(referee.role) : null;
    this.roleLabel = this.role ? (MATCH_REFEREE_ROLE_LABELS[this.role] || this.role) : null;
  }

  static getMatchRefereeRoles() {
    return [...MATCH_REFEREE_ROLES];
  }

  static isValidMatchRefereeRole(role) {
    return MATCH_REFEREE_ROLE_SET.has(normalizeRole(role));
  }

  static normalizeMatchRefereeRole(role) {
    return normalizeRole(role);
  }

  static async getRefereesInTournament(tournamentId) {
    const referees = await dbReferees.getRefereesInTournament(tournamentId);
    return referees.map((referee) => new RefereeModel(referee));
  }

  static async getMatchReferees(matchId) {
    const assignments = await dbReferees.getMatchReferees(matchId);
    return assignments.map((assignment) => new RefereeModel(assignment));
  }

  static async getMatchRefereesByMatchIds(matchIds) {
    const assignments = await dbReferees.getMatchRefereesByMatchIds(matchIds);
    const groupedAssignments = new Map();

    assignments.forEach((assignment) => {
      const parsedMatchId = Number.parseInt(assignment.match_id, 10);
      if (!Number.isInteger(parsedMatchId)) {
        return;
      }
      if (!groupedAssignments.has(parsedMatchId)) {
        groupedAssignments.set(parsedMatchId, []);
      }
      groupedAssignments.get(parsedMatchId).push(new RefereeModel(assignment));
    });

    return groupedAssignments;
  }

  static async replaceMatchReferees(matchId, tournamentId, assignments) {
    const normalizedAssignments = (assignments || []).map((assignment) => ({
      refereeId: Number.parseInt(assignment.refereeId ?? assignment.referee_id, 10),
      role: RefereeModel.normalizeMatchRefereeRole(assignment.role),
    }));

    return dbReferees.replaceMatchReferees(matchId, tournamentId, normalizedAssignments);
  }
}

module.exports = RefereeModel;
