const db = require('../config/db');

const OrderModel = {
  // สร้างออเดอร์พร้อมตัดสต็อกโดยใช้ Transaction
  createOrder: async (items) => {
    // 1. ดึง Client จาก Pool เพื่อเปิด Transaction Session
    const client = await db.connect();

    try {
      // 2. เริ่ม Transaction
      await client.query('BEGIN');

      let totalAmount = 0;
      const orderItemsToInsert = [];

      // 3. ตรวจสอบสินค้าและสต็อกทีละรายการ
      for (const item of items) {
        const { productId, quantity } = item;

        // ดึงข้อมูลสินค้าล่าสุด และ Lock Row ไว้ชั่วคราว (FOR UPDATE) ป้องกัน Race Condition
        const productRes = await client.query(
          'SELECT price, stock FROM products WHERE id = $1 FOR UPDATE',
          [productId]
        );

        if (productRes.rows.length === 0) {
          throw new Error(`ไม่พบสินค้ารหัส ${productId}`);
        }

        const product = productRes.rows[0];

        if (product.stock < quantity) {
          throw new Error(`สินค้า รหัส ${productId} มีจำนวนไม่พอในสต็อก (เหลือเพียง ${product.stock} ชิ้น)`);
        }

        const itemTotal = parseFloat(product.price) * quantity;
        totalAmount += itemTotal;

        orderItemsToInsert.push({
          productId,
          quantity,
          price: product.price
        });

        // 4. ตัดสต็อกสินค้า
        await client.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2',
          [quantity, productId]
        );
      }

      // 5. บันทึกข้อมูลลงตาราง orders
      const orderRes = await client.query(
        'INSERT INTO orders (total_amount) VALUES ($1) RETURNING id, total_amount, created_at',
        [totalAmount]
      );
      const orderId = orderRes.rows[0].id;

      // 6. บันทึกรายการสินค้าใน order_items
      for (const item of orderItemsToInsert) {
        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [orderId, item.productId, item.quantity, item.price]
        );
      }

      // 7. ยืนยันการทำงานทั้งหมดลง Database
      await client.query('COMMIT');

      return {
        orderId,
        totalAmount,
        status: 'SUCCESS'
      };

    } catch (error) {
      // 8. หากเกิด Error จุดใดก็ตาม ให้ยกเลิกคำสั่งทั้งหมด ย้อนข้อมูลกลับเหมือนไม่มีอะไรเกิดขึ้น
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // 9. คืน Client กลับเข้า Pool
      client.release();
    }
  }
};

module.exports = OrderModel;