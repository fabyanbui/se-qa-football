const TeamModel = require('../models/team.m');
const TournamentModel = require('../models/tournament.m');
const UserModel = require('../models/user.m');

module.exports = {

  // GET /management
  getTeamManagement: async function (req, res) {
    const user = (req.isAuthenticated() ? req.user : null);
    const ownTeams = user.isAdmin
      ? await TeamModel.getAllTeams()
      : await TeamModel.getTeamsByOwner(user.id);
    const activeTournaments = await TournamentModel.getAllActiveTournaments();
    res.render('management/teams', {
      title: "Quản lý đội bóng",
      useTransHeader: true,
      user: user,
      subNavigation: 0,
      teams: ownTeams || [],
      hasActiveTournament: activeTournaments.length > 0,
      activeTournaments: activeTournaments,
    });
  },

  // GET /management/tickets
  getTicketManagement: function (req, res) {
    const user = (req.isAuthenticated() ? req.user : null);
    res.render('management/tickets', {
      title: "Quản lý vé",
      useTransHeader: true,
      user: user,
      subNavigation: 1,
    });
  },

  // GET /management/accounts
  getAccountManagement: async function (req, res) {
    const user = (req.isAuthenticated() ? req.user : null);
    const allUsers = await UserModel.getAllUsers();
    const accounts = allUsers.filter(account => !account.isAdmin);

    res.render('management/accounts', {
      title: "Quản lý tài khoản",
      useTransHeader: true,
      user: user,
      subNavigation: 2,
      accounts: accounts,
    });
  },

  // GET /management/tournaments
  getTournamentManagement: async function (req, res, next) {
    const user = (req.isAuthenticated() ? req.user : null);

    try {
      const tournaments = user.isAdmin
        ? await TournamentModel.getAllActiveTournaments()
        : await TournamentModel.getActiveTournamentsByOrganizer(user.id);

      res.render('management/tournaments', {
        title: "Quản lý giải đấu",
        useTransHeader: true,
        user: user,
        subNavigation: 3,
        tournaments: tournaments || [],
      });
    } catch (err) {
      return next(err);
    }
  },

  // PUT /management/accounts/:userId/role
  putAccountRole: async function (req, res, next) {
    const user = (req.isAuthenticated() ? req.user : null);
    const targetUserId = Number.parseInt(req.params.userId, 10);
    const role = String(req.body.role || '').toLowerCase();
    const enabled = req.body.enabled;
    const allowedRoles = ['team_manager', 'tournament_organizer'];

    if (!Number.isInteger(targetUserId)) {
      return res.status(400).json({ status: 'error', message: 'ID người dùng không hợp lệ.' });
    }
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ status: 'error', message: 'Vai trò không hợp lệ.' });
    }
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ status: 'error', message: 'Trạng thái bật/tắt vai trò không hợp lệ.' });
    }
    if (!user.isAdmin && role !== 'team_manager') {
      return res.status(403).json({ status: 'error', message: 'Bạn không có quyền thay đổi vai trò này.' });
    }

    try {
      const targetUser = await UserModel.getUserById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ status: 'error', message: 'Không tìm thấy người dùng.' });
      }
      if (targetUser.isAdmin) {
        return res.status(403).json({ status: 'error', message: 'Không thể thay đổi vai trò admin.' });
      }

      let updatedUser = targetUser;
      const hasRole = targetUser.roles.includes(role);
      if (enabled && !hasRole) {
        updatedUser = await UserModel.addUserRole(targetUser.id, role, user.id);
      } else if (!enabled && hasRole) {
        updatedUser = await UserModel.removeUserRole(targetUser.id, role);
      }

      if (!updatedUser) {
        if (!enabled) {
          return res.status(400).json({ status: 'error', message: 'Mỗi tài khoản phải có ít nhất một vai trò.' });
        }
        return res.status(400).json({ status: 'error', message: 'Cập nhật vai trò thất bại.' });
      }

      return res.json({
        status: 'success',
        user: {
          id: updatedUser.id,
          role: updatedUser.role,
          roles: updatedUser.roles,
          isTeamManager: updatedUser.isTeamManager,
          isTournamentOrganizer: updatedUser.isTournamentOrganizer,
        },
      });
    } catch (err) {
      return next(err);
    }
  },


};
