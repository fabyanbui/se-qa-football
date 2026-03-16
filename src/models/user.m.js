const dbUsers = require("../utils/database/dbUsers");

const ROLE_BY_ID = {
  1: 'admin',
  2: 'tournament_organizer',
  3: 'team_manager',
};
const ROLE_ID_BY_CODE = Object.fromEntries(
  Object.entries(ROLE_BY_ID).map(([id, code]) => [code, Number(id)])
);
const VALID_ROLE_CODES = new Set(Object.values(ROLE_BY_ID));
const ROLE_PRIORITY = ['admin', 'tournament_organizer', 'team_manager'];
const MUTABLE_ROLE_CODES = ['tournament_organizer', 'team_manager'];
const parseRoleCodes = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return trimmed
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    if (trimmed.length > 0) {
      return [trimmed];
    }
  }
  return [];
};
const normalizeRoleCode = (roleCode) => String(roleCode || '').trim().toLowerCase();
const uniqueRoleCodes = (roleCodes) => [...new Set(roleCodes)];
const pickPrimaryRoleCode = (roleCodes) => {
  return ROLE_PRIORITY.find((roleCode) => roleCodes.includes(roleCode)) || null;
};

module.exports = class UserModel {

  // constructor(id, email, fullname, avatar, birthday, phone, introduction) {
  //   this.id = id;
  //   this.email = email;
  //   this.fullname = fullname;
  //   this.avatar = avatar;
  //   this.birthday = birthday;
  //   this.phone = phone;
  //   this.introduction = introduction;
  // }

  constructor(user) {
    this.id = user.id;
    this.email = user.email;
    this.fullname = user.fullname;
    this.avatar = user.avatar;
    if (user.birthday) {
      const date = new Date(user.birthday);
      this.birthday = {};
      this.birthday.dd = date.getDate();
      if (this.birthday.dd < 10) {
        this.birthday.dd = '0' + this.birthday.dd;
      }
      this.birthday.mm = date.getMonth() + 1;
      if (this.birthday.mm < 10) {
        this.birthday.mm = '0' + this.birthday.mm;
      }
      this.birthday.yyyy = date.getFullYear();
    }
    this.phone = user.phone;
    this.introduction = user.introduction;

    const roleCodes = parseRoleCodes(user.roles)
      .map(normalizeRoleCode)
      .filter((roleCode) => VALID_ROLE_CODES.has(roleCode));
    const legacyRoleCode = normalizeRoleCode(user.role || ROLE_BY_ID[user.role_id]);
    if (VALID_ROLE_CODES.has(legacyRoleCode)) {
      roleCodes.push(legacyRoleCode);
    }
    if (Number(user.privilege) === 1) {
      roleCodes.push('admin');
    }

    this.roles = uniqueRoleCodes(roleCodes);
    if (this.roles.length === 0) {
      this.roles.push('team_manager');
    }

    this.role = pickPrimaryRoleCode(this.roles) || 'team_manager';
    this.roleId = ROLE_ID_BY_CODE[this.role] || user.role_id;
    this.privilege = this.roles.includes('admin') ? 1 : Number(user.privilege || 0);
    this.createdBy = user.created_by;
    this.isAdmin = this.roles.includes('admin');
    this.isTournamentOrganizer = this.roles.includes('tournament_organizer');
    this.isTeamManager = this.roles.includes('team_manager');
    this.canManageTeam = this.isAdmin || this.isTournamentOrganizer || this.isTeamManager;
    this.canManageTournament = this.isAdmin || this.isTournamentOrganizer;
  }

  // CREATE a new user
  static async createUser(email, password, options = {}) {
    if (!email || !password) {
      return null;
    }
    const result = await dbUsers.createUser(email, password, options);
    if (!result || result.rowCount === 0) {
      return null;
    }
    return new UserModel(result.rows[0]);
  }

  // DELETE a user
  static async deleteUser(id) {
    if (!id) {
      return null;
    }
    const result = dbUsers.deleteUser(id);
    return result;
  }

  // READ a user
  static async getUserById(id) {
    if (!id) {
      return null;
    }
    const result = await dbUsers.getUserById(id);
    if (!result || result.rowCount === 0) {
      return null;
    }
    return new UserModel(result.rows[0]);
  }

  // READ a user
  static async getUserByEmail(email) {
    if (!email) {
      return null;
    }
    const result = await dbUsers.getUserByEmail(email);
    if (!result || result.rowCount === 0) {
      return null;
    }
    return new UserModel(result.rows[0]);
  }

  // READ all users
  static async getAllUsers() {
    const result = await dbUsers.getAllUsers();
    // return an array of User objects
    const users = [];
    result.rows.forEach(row => {
      users.push(new UserModel(row));
    });
    return users;
  }

  // READ / AUTHENTICATE a user
  static async getUser(email, password) {
    if (!email || !password) {
      return null;
    }
    const result = await dbUsers.getUser(email, password);
    if (!result) {
      return null;
    }
    return new UserModel(result.rows[0]);
  }

  // UPDATE a user
  static async updateUser(id, fullname, birthday, phone, introduction, avatar) {
    if (!id) {
      return null;
    }
    let result = await dbUsers.updateUserInfo(id, fullname, birthday, phone, introduction);
    if (!result) {
      return null;
    }
    await dbUsers.updateUserAvatar(id, avatar);
    return true;
  }

  // UPDATE a user's password
  static async changePassword(id, password, newPassword) {
    if (!id) {
      return null;
    }

    const result = await dbUsers.updateUserPassword(id, newPassword);
    if (!result) {
      return null;
    }
    return true;
  }

  // ADD a role for a user (non-admin roles only)
  static async addUserRole(id, role, assignedBy = null) {
    const normalizedRole = normalizeRoleCode(role);
    if (!id || !MUTABLE_ROLE_CODES.includes(normalizedRole)) {
      return null;
    }
    const result = await dbUsers.addUserRole(id, normalizedRole, assignedBy);
    if (!result || result.rowCount === 0) {
      return null;
    }
    return new UserModel(result.rows[0]);
  }

  // REMOVE a role for a user (non-admin roles only)
  static async removeUserRole(id, role) {
    const normalizedRole = normalizeRoleCode(role);
    if (!id || !MUTABLE_ROLE_CODES.includes(normalizedRole)) {
      return null;
    }
    const result = await dbUsers.removeUserRole(id, normalizedRole);
    if (!result || result.rowCount === 0) {
      return null;
    }
    return new UserModel(result.rows[0]);
  }

  // UPDATE a user's role (non-admin roles only)
  static async updateUserRole(id, role, assignedBy = null) {
    const normalizedRole = normalizeRoleCode(role);
    if (!id || !MUTABLE_ROLE_CODES.includes(normalizedRole)) {
      return null;
    }
    const result = await dbUsers.updateUserRole(id, normalizedRole, assignedBy);
    if (!result || result.rowCount === 0) {
      return null;
    }
    return new UserModel(result.rows[0]);
  }



}
