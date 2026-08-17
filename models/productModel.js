const db = require('../config/db');

const ProductModel = {
  // ดึงรายการสินค้าทั้งหมด พร้อมชื่อหมวดหมู่ (LEFT JOIN)
  findAllWithCategory: async () => {
    const queryText = `
      SELECT 
        p.id,
        p.name,
        p.price,
        p.stock,
        p.category_id,
        c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id ASC
    `;
    const result = await db.query(queryText);
    return result.rows;
  },

  // 1. ดึงรายการสินค้าทั้งหมด
  // ดึงรายการสินค้าตามเงื่อนไข พร้อมระบบ Pagination & Filter
  findAll: async ({ page = 1, limit = 10, search = '', sort = 'latest', minPrice, maxPrice }) => {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    // ตัวแปรสำหรับสร้าง Dynamic Query
    let queryConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // 1. ค้นหาชื่อสินค้า (Case-Insensitive ด้วย ILIKE)
    if (search) {
      queryConditions.push(`name ILIKE $${paramIndex}`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // 2. กรองช่วงราคาต่ำสุด
    if (minPrice !== undefined && minPrice !== '') {
      queryConditions.push(`price >= $${paramIndex}`);
      queryParams.push(parseFloat(minPrice));
      paramIndex++;
    }

    // 3. กรองช่วงราคาสูงสุด
    if (maxPrice !== undefined && maxPrice !== '') {
      queryConditions.push(`price <= $${paramIndex}`);
      queryParams.push(parseFloat(maxPrice));
      paramIndex++;
    }

    // รวมเงื่อนไข WHERE (ถ้า)
    const whereClause = queryConditions.length > 0
      ? `WHERE ${queryConditions.join(' AND ')}`
      : '';

    // 4. จัดการ Sorting
    let orderByClause = 'ORDER BY id DESC'; // Default: สั่งซื้อเรียงตาม ID ใหม่ล่าสุด
    if (sort === 'price_asc') orderByClause = 'ORDER BY price ASC';
    if (sort === 'price_desc') orderByClause = 'ORDER BY price DESC';
    if (sort === 'oldest') orderByClause = 'ORDER BY id ASC';

    //5. Query ดึงข้อมูลสินค้าเฉพาะหน้านั้น
    const dataQuery = `
      SELECT * FROM products
      ${whereClause}
      ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    //6. Query นับจำนวนสินค้าทั้งหมดที่ตรงตามเงื่อนไข (คำนวณ totalPages)
    const countQuery = `
      SELECT COUNT(*) FROM products
      ${whereClause}
    `;

    // รันทั้งสอง Query พร้อมกัน
    const [dataResult, countResult] = await Promise.all([
      db.query(dataQuery, [...queryParams, limitNum, offset]),
      db.query(countQuery, queryParams)
    ]);

    const totalItems = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limitNum);

    return {
      products: dataResult.rows,
      pagination: {
        totalItems,
        totalPages,
        currentPage: pageNum,
        limit: limitNum
      }
    }
  },

  // 2. ดึงสินค้าตาม ID
  findById: async (id) => {
    const queryText = 'SELECT * FROM products WHERE id = $1';
    const result = await db.query(queryText, [id]);
    return result.rows[0];
  },

  // 3. เพิ่มสินค้าใหม่
  create: async ({ name, price, stock }) => {
    const queryText = `
      INSERT INTO products (name, price, stock)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await db.query(queryText, [name, price, stock]);
    return result.rows[0];
  },

  // 4. แก้ไขข้อมูลสินค้า
  update: async (id, { name, price, stock }) => {
    const queryText = `
      UPDATE products
      SET name = $1, price = $2, stock = $3
      WHERE id = $4
      RETURNING *
    `;
    const result = await db.query(queryText, [name, price, stock, id]);
    return result.rows[0];
  },

  // 5. ลบสินค้า
  delete: async (id) => {
    const queryText = 'DELETE FROM products WHERE id = $1 RETURNING *';
    const result = await db.query(queryText, [id]);
    return result.rows[0];
  }
};

module.exports = ProductModel;