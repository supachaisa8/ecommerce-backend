const CartModel = require('../models/cartModel');

const CartController = {
    // GET /api/cart - ดึงตะกร้าสินค้าของผู้ใช้ที่ Login อยู่
    getCart: async (req, res, next) => {
        try {
            const userId = req.user.id; // ได้มาจาก authMiddleware
            const cart = await CartModel.getCartByUserId(userId);
            
            res.status(200).json({
                success: true,
                data: cart
            });
        } catch (error) {
            next(error);
        }
    },

    // POST /api/cart - เพิ่มสินค้าลงตะกร้า
    addToCart: async (req, res, next) => {
        try { 
            const userId = req.user.id;
            const { productId, quantity } = req.body;

            if (!productId || !quantity || quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณาระบุ productId และ quantity ให้ถูกต้อง'
                });
            }

            const item = await CartModel.addItem(userId, productId, quantity);

            res.status(201).json({
                success: true,
                message: 'เพิ่มสินค้าลงตะกร้าเรียบร้อย',
                data: item
            });
        } catch (error) {
            next(error);
        }
    },

    // PATCH /api/cart/items/:id
    updateItemQuantity: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const cartItemId = req.params.id;
            const { quantity } = req.body;

            if (!quantity || quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'จำนวนสินค้าต้องมากกว่า 0'
                });
            }

            const updatedItem = await CartModel.updateItemQuantity(userId, cartItemId, quantity);
            
            if (!updatedItem) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบรายการสินค้านี้ในตะกร้าของคุณ'
                })
            }

            res.status(200).json({
                success: true,
                message: 'อัปเดตจำนวนสินค้าเรียบร้อย',
                data: updatedItem
            });
        } catch (error) {
            next(error);
        }
    },

    // DELETE /api/cart/items/:id
    deleteItem: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const cartItemId = req.params.id;
            
            const deletedItem = await CartModel.deleteItem(userId, cartItemId);

            if (!deletedItem) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบรายการสินค้านี้ในตะกร้าของคุณ'
                });
            }

            res.status(200).json({
                success: true,
                message: 'ลบรายการสินค้าออกจากตะกร้าเรียบร้อย',
                data: deletedItem
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = CartController;

