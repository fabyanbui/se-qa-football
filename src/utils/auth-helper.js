const TeamModel = require('../models/team.m');

function denyTeamAccess(req, res, message = 'Bạn không có quyền quản lý đội bóng này.') {
  if (req.method === 'GET') {
    return res.redirect('/');
  }
  return res.status(403).json({ status: 'error', message });
}

module.exports = {

  checkAuthenticated: function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login');
  },

  checkNotAuthenticated: function (req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('/');
    }
    next();
  },

  checkAdmin: function (req, res, next) {
    if (req.isAuthenticated() && req.user.isAdmin) {
      return next();
    }
    res.redirect('/');
  },

  checkTournamentStaff: function (req, res, next) {
    if (req.isAuthenticated() && req.user.canManageTournament) {
      return next();
    }
    res.redirect('/');
  },

  checkTeamStaff: function (req, res, next) {
    if (
      req.isAuthenticated() &&
      (req.user.isAdmin || req.user.isTeamManager || req.user.isTournamentOrganizer)
    ) {
      return next();
    }
    return denyTeamAccess(req, res, 'Bạn không có quyền cấu hình đội bóng.');
  },

  checkTournamentOwnership: function (req, res, next) {
    if (!req.isAuthenticated()) {
      if (req.method === 'GET') {
        return res.redirect('/');
      }
      return res.status(403).json({ status: 'error', message: 'Bạn không có quyền quản lý giải đấu.' });
    }

    if (req.user.isAdmin) {
      return next();
    }

    if (!req.user.canManageTournament) {
      if (req.method === 'GET') {
        return res.redirect('/');
      }
      return res.status(403).json({ status: 'error', message: 'Bạn không có quyền quản lý giải đấu.' });
    }

    const tournamentOrganizerId = Number.parseInt(
      req.tournament?.organizerId ?? req.tournament?.organizer_id,
      10
    );
    const userId = Number.parseInt(req.user.id, 10);
    if (Number.isInteger(tournamentOrganizerId) && Number.isInteger(userId) && tournamentOrganizerId === userId) {
      return next();
    }

    if (req.method === 'GET') {
      return res.redirect('/');
    }
    return res.status(403).json({ status: 'error', message: 'Bạn không phải chủ sở hữu giải đấu này.' });
  },

  checkOwnTeam: async function (req, res, next) {
    if (!req.isAuthenticated()) {
      return denyTeamAccess(req, res);
    }

    if (!req.user.isAdmin && !req.user.isTeamManager && !req.user.isTournamentOrganizer) {
      return denyTeamAccess(req, res, 'Bạn không có vai trò để cấu hình đội bóng.');
    }

    const teamId = Number.parseInt(req.params.teamId, 10);
    if (!Number.isInteger(teamId)) {
      if (req.method === 'GET') {
        return next();
      }
      return res.status(404).json({ status: 'error', message: 'Mã đội bóng không hợp lệ.' });
    }

    try {
      const team = await TeamModel.getTeam(teamId);
      if (!team) {
        if (req.method === 'GET') {
          return next();
        }
        return res.status(404).json({ status: 'error', message: 'Không tìm thấy đội bóng.' });
      }

      req.team = team;
      if (req.user.isAdmin) {
        return next();
      }

      const ownerId = Number.parseInt(team.ownerId ?? team.owner_id, 10);
      const userId = Number.parseInt(req.user.id, 10);
      if (Number.isInteger(ownerId) && Number.isInteger(userId) && ownerId === userId) {
        return next();
      }

      return denyTeamAccess(req, res);
    } catch (err) {
      return next(err);
    }
  },

};
