require('dotenv').config();
const db = require('./db-config');

const bcrypt = require('bcrypt');
const saltRounds = parseInt(process.env.SALT_ROUNDS || '10', 10);

module.exports = {

  getUser: async (email, password) => {
    const query = `
      SELECT * FROM users WHERE email = $1;
    `;
    const result = await db.pool.query(query, [email.toLowerCase()]);
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
    return await db.pool.query(query, [email.toLowerCase(), passwordHash, createdBy, role]);
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
    return await db.pool.query(query, [email.toLowerCase()]);
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
