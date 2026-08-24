const CategoryModel = require('../models/categoryModel');

const categoryController = {
    getCategories: async (req, res, next) => {
        try {
            const categories = await CategoryModel.findAll();
            res.status(200).json({
                success: true,
                data: categories
            });
        } catch (error) {
            next(error)
        }
    },

    createCategory: async (req, res, next) => {
        try {
            const { name } = req.body;
            if (!name) {
                return restatus(400).json({
                    success: false,
                    message: 'กรุณากรอกชื่อหมวดหมู่'
                });
            }

            const newCategory = await CategoryModel.create(name);
            res.status(201).json({
                success: true,
                data: newCategory
            });
        } catch (error) {
            next(error);
        }
    },

    updateCategory: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { name } = req.body;
            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณากรอกชื่อหมวดหมู่'
                })

            }
            const updated = await CategoryModel.update(id, name);
            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบหมวดหมู่นี้'
                })
            }

            res.status(200).json({
                success: true,
                data: updated
            });
        } catch (error) {
            next(error);
        }
    },

    deleteCategory: async (req, res, next) => {
        try {
            const { id } = req.params;
            const deleted = await CategoryModel.delete(id);
            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบหมวดหมู่นี้'
                });
            }

            res.status(200).json({ success: true, message: 'ลบหมวดหมู่สำเร็จ' });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = categoryController;