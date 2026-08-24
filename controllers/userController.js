const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');

const userController = {
    // GET /api/users/me - ดูโปรไฟล์ตัวเอง
    getProfile: async (req, res, next) => {
        try {
            const user = await UserModel.findById(req.user.id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบผู้ใช้ในระบบ'
                });
            }
            res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            next(error);
        }
    },

    // PUT /api/users/me - แก้ไขโปรไฟล์
    updateProfile: async (req, res, next) => {
        try {
            const { name, email } = req.body;
            if (!name || !email) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณากรอก name และ email'
                });
            }

            const updatedUser = await UserModel.updateProfile(req.user.id, { name, email });
            res.status(200).json({
                success: true,
                message: 'อัปเดตข้อมูลโปรไฟล์เรียบร้อย',
                data: updatedUser
            });
        } catch (error) {
            next(error);
        }
    },

    // PATCH /api/users/me/password - เปลี่ยนรหัสผ่าน
    changePassword: async (req, res, next) => {
        try {
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณากรอกรหัสผ่านเดิมและรหัสผ่านใหม่'
                });
            }

            // Validation user,ps และดึงข้อมูล Password เดิมมาเทียบ
            const user = await UserModel.findByIdWithPassword(req.user.id);
            if (!user) {
                return res.status(404).json({
                    success:false,
                    message:'ไม่พบผู้ใช้งานนี้ในระบบ'
                })
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'รหัสผ่านเดิมไม่ถูกต้อง'
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            await UserModel.updatePassword(req.user.id, hashedPassword);

            res.status(200).json({ 
                success: true,
                message: 'เปลี่ยนรหัสผ่านสำเร็จ'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = userController;