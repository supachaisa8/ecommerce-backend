const TagModel = require('../models/tagModel');

const tagController = {
    getTags: async (req, res, next) => {
        try {
            const tags = await TagModel.findAll();
            res.status(200).json({
                success: true,
                data: tags
            })
        } catch (error) {
            next(error);
        }
    },

    createTag: async (req, res, next) => {
        try {
            const { name } = req.body;
            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณาระบุชื่อ Tag'
                });
            }

            const tag = await TagModel.create(name);
            res.status(201).json({
                success: true,
                message: 'สร้าง Tag สำเร็จ',
                data: tag
            })
        } catch (error) {
            next(error);
        }
    },

    updateTag: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { name } = req.body;
            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณาระบุชื่อ Tag'
                });
            }

            const tag = await TagModel.update(id, name);
            if (!tag) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบ Tag นี้'
                });
            }

            res.status(200).json({
                success: true,
                message: 'แก้ไข Tag สำเร็จ',
                data: tag
            })
        } catch (error) {
            next(error);
        }
    },

    deleteTag: async (req, res, next) => {
        try {
            const { id } = req.params;
            const tag = await TagModel.delete(id);
            if (!tag) {
                return res.status(404).json({ success: false, message: 'ไม่พบ Tag นี้' });
            }

            res.status(200).json({ success: true, message: 'ลบ Tag สำเร็จ' });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = tagController;