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

  checkOwnTeam: function (req, res, next) {
    if (req.isAuthenticated()) {
      const teamId = req.params.teamId;
      const team = teamDb.getTeams().find(team => team.teamId == teamId);
      if (team && team.ownerId == req.user.id) {
        return next();
      }
    }
    res.redirect('/');
  }

}
