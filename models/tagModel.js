const db = require('../config/db');

const TagModel = {
    findAll: async () => {
        const result = await db.query(
            'SELECT * FROM tags ORDER BY id ASC'
        );
        return result.rows;
    },

    findById: async (id) => {
        const result = await db.query(
            'SELECT * FROM tags WHERE id = $1',
            [id]
        );
        return result.rows[0]
    },

    create: async (name) => {
        const result = await db.query(
            'INSERT INTO tags (name) VALUES ($1) RETURNING *',
            [name]
        );
        return result.rows[0]
    },

    update: async (id, name) => {
        const result = await db.query(
            'UPDATE tags SET name = $1 WHERE id = $2 RETURNING *',
            [name, id]
        );
        return result.rows[0];
    },

    delete: async (id) => {
        const result = await db.query(

            'DELETE FROM tags WHERE id = $1 RETURNING *',
            [id]
        );
        return result.rows[0];
    },

    // ผูก Tags หลายตัวเข้ากับ Product เดียว
    attachTagsToProduct: async (client, productId, tagIds) => {
        if (!tagIds || tagIds.length === 0) return;

        // ลบการผูกเดิมก่อน
        await client.query(
            'DELETE FROM product_tags WHERE product_id = $1',
            [productId]
        );

        // Insert ความสัมพันธ์ใหม่
        const values = tagIds.map((tagId, index) => `($1, $${index + 2})`).join(', ');
        const query = `INSERT INTO product_tags (product_id, tag_id) VALUES ${values}`;
        await client.query(query, [productId, ...tagIds]);
    }
};

module.exports = TagModel;