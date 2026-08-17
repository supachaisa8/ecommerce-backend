const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // อนุญาตให้เชื่อมต่อ SSL Cloud DB ได้
  }
});

// ทดสอบการเชื่อมต่อ
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Database Connection Error:', err);
  }
  console.log('✅ Connected to Neon PostgreSQL Database successfully!');
  release();
});

module.exports = pool;