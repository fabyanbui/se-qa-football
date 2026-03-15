const TeamModel = require('../models/team.m');
const PlayerModel = require('../models/player.m');
const TournamentModel = require('../models/tournament.m');

function canManageTeams(user) {
  return Boolean(user && (user.isAdmin || user.isTeamManager || user.isTournamentOrganizer));
}

function canConfigureTeam(user, team) {
  if (!canManageTeams(user) || !team) {
    return false;
  }
  if (user.isAdmin) {
    return true;
  }
  return Number.parseInt(team.ownerId, 10) === Number.parseInt(user.id, 10);
}

module.exports = {

  // GET /teams
  getTeams: async function (req, res, next) {
    const user = req.isAuthenticated() ? req.user : null;
    const allTeams = await TeamModel.getAllTeams();
    const nPerPage = 9;
    const page = Number.parseInt(req.query.page, 10) || 1;
    const nOfPages = Math.ceil(allTeams.length / nPerPage);
    const maxPage = nOfPages === 0 ? 1 : nOfPages;
    if (page < 1 || page > maxPage) return next();
    const teams = allTeams
      .slice((page - 1) * nPerPage, page * nPerPage)
      .map((team) => ({
        ...team,
        canConfigure: canConfigureTeam(user, team),
      }));
    res.render('teams/teams', {
      title: "Tất cả đội bóng",
      useTransHeader: false,
      user: user,
      canManageTeams: canManageTeams(user),
      nOfPages: nOfPages,
      page: page,
      teams: teams,
    });
  },

  // GET /teams/my
  getMyTeams: async function (req, res) {
    const user = req.isAuthenticated() ? req.user : null;
    const ownTeams = user.isAdmin
      ? await TeamModel.getAllTeams()
      : await TeamModel.getTeamsByOwner(user.id);
    const activeTournaments = await TournamentModel.getAllActiveTournaments();
    res.render('teams/my-teams', {
      title: "Đội bóng của tôi",
      useTransHeader: false,
      user: user,
      teams: ownTeams || [],
      hasActiveTournament: activeTournaments.length > 0,
      activeTournaments: activeTournaments,
    });
  },

  // GET /teams/:teamId
  getTeam: async function (req, res, next) {
    const user = req.isAuthenticated() ? req.user : null;
    const teamId = req.params.teamId;
    const team = await TeamModel.getTeam(teamId);
    if (!team) return next();
    res.render('teams/team-info', {
      title: team.name,
      useTransHeader: true,
      subNavigation: 0,
      user: user,
      team: team,
      canConfigureTeam: canConfigureTeam(user, team),
    });
  },

  // GET /teams/:teamId/members
  getTeamMembers: async function (req, res, next) {
    const user = req.isAuthenticated() ? req.user : null;
    const teamId = req.params.teamId;
    const team = await TeamModel.getTeam(teamId);
    if (!team) return next();
    res.render('teams/team-members', {
      title: team.name,
      useTransHeader: true,
      subNavigation: 1,
      user: user,
      team: team,
      canConfigureTeam: canConfigureTeam(user, team),
    });
  },

  // GET /teams/:teamId/edit
  getEditTeam: async function (req, res, next) {
    const user = req.isAuthenticated() ? req.user : null;
    const teamId = req.params.teamId;
    const team = req.team || await TeamModel.getTeam(teamId);
    if (!team) return next();
    res.render('teams/team-edit', {
      title: team.name,
      useTransHeader: true,
      subNavigation: 3,
      subSubNavigation: 0,
      user: user,
      team: team,
      canConfigureTeam: canConfigureTeam(user, team),
    });
  },

  // POST /teams/:teamId/edit
  postEditTeam: async function (req, res, next) {
    const teamId = req.params.teamId;
    const team = req.team || await TeamModel.getTeam(teamId);
    if (!team) return next();
    try {
      await TeamModel.updateTeam(teamId, req.body);
    } catch (err) {
      console.log(err);
      return res.redirect(`/teams/${teamId}/edit`);
    }
    return res.redirect(`/teams/${teamId}`);
  },

  // GET /teams/:teamId/edit/members
  getEditTeamMembers: async function (req, res, next) {
    const user = req.isAuthenticated() ? req.user : null;
    const teamId = req.params.teamId;
    const team = req.team || await TeamModel.getTeam(teamId);
    if (!team) return next();
    res.render('teams/team-edit-members', {
      title: team.name,
      useTransHeader: true,
      subNavigation: 3,
      subSubNavigation: 1,
      user: user,
      team: team,
      canConfigureTeam: canConfigureTeam(user, team),
    });
  },

  // POST /teams/:teamId/edit/members - to add new member
  postEditTeamMembers: async function (req, res, next) {
    const teamId = req.params.teamId;
    const team = req.team || await TeamModel.getTeam(teamId);
    if (!team) return next();
    try {
      const playerId = await PlayerModel.addNewPlayer(req.body, teamId);
      res.json({ status: 'success', playerId: playerId });
    } catch (err) {
      console.log(err);
      return res.json({ status: 'error' });
    }
  },

  // POST /teams/:teamId/edit/members/:playerId/avatar
  postUpdatePlayerAvatar: async function (req, res, next) {
    const playerId = req.params.playerId;
    const player = await PlayerModel.getPlayer(playerId);
    if (!player) return next();
    res.status(200).json({ status: 'success', playerId: playerId });
  },

  // DELETE /teams/:teamId/edit/members/:playerId
  deleteTeamMember: async function (req, res, next) {
    const teamId = req.params.teamId;
    const team = req.team || await TeamModel.getTeam(teamId);
    if (!team) return next();
    const playerId = req.params.playerId;
    try {
      await TeamModel.removePlayer(teamId, playerId);
    } catch (err) {
      console.log(err);
      return res.status(400).json({ status: 'error', msg: 'Không thể xóa cầu thủ này' });
    }
    res.status(200).json({ status: 'success' });
  },

  // GET /teams/create
  getCreateTeam: async function (req, res, next) {
    const user = req.isAuthenticated() ? req.user : null;
    res.render('teams/team-create', {
      title: "Tạo đội bóng",
      useTransHeader: true,
      user: user,
    });
  },

  // POST /teams/create-info
  postCreateTeam: async function (req, res, next) {
    const user = req.isAuthenticated() ? req.user : null;
    try {
      console.log(JSON.stringify({ ...req.body, ownerId: user.id }));
      const id = await TeamModel.createTeam({ ...req.body, ownerId: user.id });
      console.log(id);
      res.status(200).json({ status: 'success', teamId: id });
    } catch (err) {
      console.log(err);
      res.status(400).json({ status: 'error' });
    }
  },

  // POST /teams/:teamId/enroll-current-tournament
  // POST /teams/:teamId/enroll-tournament
  postEnrollCurrentTournament: async function (req, res, next) {
    const teamId = req.params.teamId;
    const team = req.team || await TeamModel.getTeam(teamId);
    if (!team) return next();
    if (team.tournamentId) {
      return res.status(400).json({ status: 'error', msg: 'Đội bóng đã thuộc một giải đấu.' });
    }
    try {
      let targetTournamentId = Number.parseInt(req.body?.tournamentId, 10);
      if (!Number.isInteger(targetTournamentId)) {
        targetTournamentId = await TournamentModel.getCurrentTournamentId();
      }
      if (!Number.isInteger(targetTournamentId)) {
        return res.status(400).json({ status: 'error', msg: 'Vui lòng chọn một giải đấu đang hoạt động.' });
      }

      const targetTournament = await TournamentModel.getTournamentById(targetTournamentId);
      if (!targetTournament || targetTournament.isClosed) {
        return res.status(400).json({ status: 'error', msg: 'Giải đấu không hợp lệ hoặc đã đóng.' });
      }

      const updatedCount = await TeamModel.enrollTeamToTournament(teamId, targetTournamentId);
      if (updatedCount === 0) {
        return res.status(400).json({ status: 'error', msg: 'Không thể đăng ký đội bóng vào giải đấu đã chọn.' });
      }
      return res.status(200).json({ status: 'success' });
    } catch (err) {
      console.log(err);
      return res.status(400).json({ status: 'error', msg: 'Không thể đăng ký đội bóng vào giải đấu đã chọn.' });
    }
  },

  // POST /teams/:id/update-logo
  postUpdateLogo: async function (req, res, next) {
    const teamId = req.params.teamId;
    const team = req.team || await TeamModel.getTeam(teamId);
    if (!team) return next();
    res.status(200).json({ status: 'success', teamId: teamId });
  },

  // DELETE /teams/:teamId/delete
  deleteTeam: async function (req, res, next) {
    const teamId = req.params.teamId;
    const team = req.team || await TeamModel.getTeam(teamId);
    if (!team) return next();
    try {
      await TeamModel.deleteTeam(teamId);
    } catch (err) {
      console.log(err);
      return res.json({ status: 'error' });
    }
    return res.json({ status: 'success' });
  },

  // GET /teams/:teamId/statistics => not implemented yet
  getTeamStatistics: async function (req, res, next) {
    const user = req.isAuthenticated() ? req.user : null;
    const teamId = req.params.teamId;
    const team = await TeamModel.getTeam(teamId);
    if (!team) return next();
    res.render('teams/team-statistics', {
      title: team.name,
      useTransHeader: true,
      subNavigation: 2,
      user: user,
      team: team,
      canConfigureTeam: canConfigureTeam(user, team),
    });
  },



}
