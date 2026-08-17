const db = require('../config/db');

const UserModel = {
  // สร้างผู้ใช้ใหม่
  create: async ({ name, email, password, role = 'customer' }) => {
    const queryText = `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at
    `;
    const result = await db.query(queryText, [name, email, password, role]);
    return result.rows[0];
  },

  // ค้นหาผู้ใช้จาก Email
  findByEmail: async (email) => {
    const queryText = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(queryText, [email]);
    return result.rows[0];
  },

  // ค้นหาผู้ใช้จาก ID (สำหรับเช็ค Token)
  findById: async (id) => {
    const queryText = 'SELECT id, name, email, role, created_at FROM users WHERE id = $1';
    const result = await db.query(queryText, [id]);
    return result.rows[0];
  }
};

module.exports = UserModel;