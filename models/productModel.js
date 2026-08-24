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
  // ดึงรายการสินค้าตามเงื่อนไข พร้อมระบบ Pagination & Filter หมวดหมู่ และ Tags
  findAll: async ({
    page = 1,
    limit = 10,
    search = '',
    sort = 'latest',
    minPrice,
    maxPrice,
    categoryId,
    tagId
  }) => {
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

    // กรองตาม Category 
    if (categoryId) {
      queryConditions.push(`p.category_id = $${paramIndex}`);
      queryParams.push(parseInt(categoryId, 10)); // แปลงเป็น Int
      paramIndex++;
    }

    // กรองตาม Tag
    if (tagId) {
      queryConditions.push(`pt.tag_id = $${paramIndex}`);
      queryParams.push(parseInt(categoryId, 10)); // แปลงเป็น Int
      paramIndex++
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

    //JOIN ตาราง categories, product_tags, tags และใช้ json_agg เพื่อรวบรวม tags เป็น Array
    const dataQuery = `
      SELECT 
        p.id, p.name, p.price, p.stock, p.category_id,
        c.name AS category_name,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', t.id, 'name', t.name)
          ) FILTER (WHERE t.id IS NOT NULL), '[]'
        ) AS tags
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_tags pt ON p.id = pt.product_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      ${whereClause}
      GROUP BY p.id, c.name
      ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT p.id) FROM products p
      LEFT JOIN product_tags pt ON p.id = pt.product_id
      ${whereClause}
    `;

    const [dataResult, countResult] = await Promise.all([
      db.query(dataQuery, [...queryParams, limitNum, offset]),
      db.query(countQuery, queryParams)
    ]);

    const totalItems = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limitNum);

    return {
      products: dataResult.rows,
      pagination: { totalItems, totalPages, currentPage: pageNum, limit: limitNum }
    };
  },

  // 2. ดึงสินค้าตาม ID พร้อม Category และ Tags (เขียนเพิ่ม/ปรับปรุง)
  findById: async (id) => {
    const queryText = `
      SELECT 
        p.id, p.name, p.price, p.stock, p.category_id,
        c.name AS category_name,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', t.id, 'name', t.name)
          ) FILTER (WHERE t.id IS NOT NULL), '[]'
        ) AS tags
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_tags pt ON p.id = pt.product_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.id = $1
      GROUP BY p.id, c.name
    `;
    const result = await db.query(queryText, [id]);
    return result.rows[0];
  },

  // 3. เพิ่มสินค้าใหม่ + ใส่ category_id และผูก tagIds (ใช้ Transaction)
  create: async ({ name, price, stock, categoryId = null, tagIds = [] }) => {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Insert product
      const productRes = await client.query(
        `INSERT INTO products (name, price, stock, category_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [name, price, stock, categoryId]
      );
      const product = productRes.rows[0];

      // Insert product_tags
      if (tagIds && tagIds.length > 0) {
        for (const tagId of tagIds) {
          await client.query(
            'INSERT INTO product_tags (product_id, tag_id) VALUES ($1, $2)',
            [product.id, tagId]
          );
        }
      }

      await client.query('COMMIT');
      return product;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // 4. แก้ไขข้อมูลสินค้า
  update: async (id, { name, price, stock, categoryId = null, tagIds = [] }) => {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Update product
      const productRes = await client.query(
        `UPDATE products
         SET name = $1, price = $2, stock = $3, category_id = $4
         WHERE id = $5
         RETURNING *`,
        [name, price, stock, categoryId, id]
      );
      const product = productRes.rows[0];

      // ลบ Tags เดิมออกแล้วผูก Tags ชุดใหม่
      if (tagIds !== undefined) {
        await client.query('DELETE FROM product_tags WHERE product_id = $1', [id]);
        if (tagIds.length > 0) {
          for (const tagId of tagIds) {
            await client.query(
              'INSERT INTO product_tags (product_id, tag_id) VALUES ($1, $2)',
              [id, tagId]
            );
          }
        }
      }

      await client.query('COMMIT');
      return product;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // 5. ลบสินค้า
  delete: async (id) => {
    const queryText = 'DELETE FROM products WHERE id = $1 RETURNING *';
    const result = await db.query(queryText, [id]);
    return result.rows[0];
  }
};

module.exports = ProductModel;