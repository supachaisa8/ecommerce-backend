const db = require('../config/db');

const CategoryModel = {
    findAll: async () => {
        const result = await db.query('SELECT * FROM categories ORDER BY id ASC');
        return result.rows;
    },
    findById: async (id) => {
        const result = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
        return result.rows[0];
    },
    create: async (name) => {
        const result = await db.query(
            'INSERT INTO categories (name) VALUES ($1) RETURNING *',
            [name]
        );
        return result.rows[0];
    },
    update: async (id, name) => {
        const result = await db.query(
            'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
            [name, id]
        );
        return result.rows[0];
    },
    delete: async (id) => {
        const result = await db.query(
            'DELETE FROM categories WHERE id = $1 RETURNING *',
            [id]
        );
        return result.rows[0]
    }
};

module.exports = CategoryModel;