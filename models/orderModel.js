const db = require('../config/db');
const OrderModel = {
  // Transaction | สร้างออเดอร์ + Hold สต็อกชั่วคราว 
  createOrderWithHold: async (userId, items) => {
    // 1. ดึง Client จาก Pool เพื่อเปิด Transaction Session
    const client = await db.connect();

    try {
      // 2. เริ่ม Transaction
      await client.query('BEGIN');

      let totalAmount = 0;
      const orderItemsToInsert = [];
      const holdMinutes = 1 //(กำหนดหมดอายุใน 15 นาที)

      // 3. ตรวจสอบสินค้าและสต็อกทีละรายการ
      for (const item of items) {
        const { productId, quantity } = item;

        // ดึงข้อมูลสินค้าล่าสุด และ Lock Row ไว้ชั่วคราว (FOR UPDATE) ป้องกัน Race Condition
        const productRes = await client.query(
          'SELECT price, stock, locked_stock FROM products WHERE id = $1 FOR UPDATE',
          [productId]
        );

        if (productRes.rows.length === 0) {
          throw new Error(`ไม่พบสินค้ารหัส ${productId}`);
        }

        const product = productRes.rows[0];
        const currentLocked = product.locked_stock || 0;
        const availableStock = product.stock - currentLocked; // สต็อกที่ขายได้จริง

        if (availableStock < quantity) {
          throw new Error(`สินค้า รหัส ${productId} ไม่เพียงพอ (คงเหลือพร้อมขาย ${availableStock} ชิ้น)`);
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
          'UPDATE products SET locked_stock = locked_stock + $1 WHERE id = $2',
          [quantity, productId]
        );
      }

      // 5. บันทึกข้อมูลลงตาราง orders
      const orderRes = await client.query(
        ` INSERT INTO orders (user_id, total_amount, status, expires_at) 
          VALUES ($1, $2, 'PENDING', NOW() + ($3 || ' minutes')::INTERVAL) 
          RETURNING id, user_id, total_amount, status, expires_at, created_at
        `,
        [userId, totalAmount, holdMinutes]
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
      return orderRes.rows[0];

    } catch (error) {
      // 8. หากเกิด Error จุดใดก็ตาม ให้ยกเลิกคำสั่งทั้งหมด ย้อนข้อมูลกลับเหมือนไม่มีอะไรเกิดขึ้น
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // 9. คืน Client กลับเข้า Pool
      client.release();
    }
  },

  // 2. เมื่อชำระเงินสำเร็จ (Confirm Payment -> ตัดสต็อกจริง ถาวร)
  confirmPayment: async (orderId) => {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const orderRes = await client.query(
        'SELECT status FROM orders WHERE id = $1 FOR UPDATE', 
        [orderId]);
      if (!orderRes.rows[0] || orderRes.rows[0].status !== 'PENDING') {
        throw new Error('ออเดอร์นี้ไม่สามารถชำระเงินได้ (อาจถูกยกเลิกหรือจ่ายแล้ว)');
      }

      const itemsRes = await client.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [orderId]);
    
      for (const item of itemsRes.rows) {
        // ตัด stock จริงออก และลด locked_stock ลง
        await client.query(
          ` UPDATE products
            SET stock = stock - $1,
              locked_stock = GREATEST(0, locked_stock - $1)
            WHERE id = $2
          `,
          [item.quantity, item.product_id]
        );
      }

      // อัปเดตสถานะเป็น PAID
      const updatedOrder = await client.query(
        "UPDATE orders SET status = 'PAID' WHERE id = $1 RETURNING *",
        [orderId]
      );

      await client.query('COMMIT');
      return updatedOrder.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  //3. Auto-Release: คืนสต็อกของออเดอร์ที่หมดอายุ (สแกนทำความสะอาดคลัง)
  releaseExpiredOrders: async () => {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // ดึง ออเดอร์ ที่ PENDING และเกินเวลา expires_at
      const expiredOrders = await client.query(
        "SELECT id FROM orders WHERE status = 'PENDING' AND expires_at < NOW() FOR UPDATE"
      );

      for (const order of expiredOrders.rows) {
        const items = await client.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [order.id]);

        for (const item of items.rows) {
          // คืนสต็อกที่ล็อกไว้
          await client.query(
'UPDATE products SET locked_stock = GREATEST(0, locked_stock - $1) WHERE id = $2',            [item.quantity, item.product_id]
          );
        }

        // ปรับสถานะเป็น EXPIRED
        await client.query("UPDATE orders SET status = 'EXPIRED' WHERE id = $1", [order.id]);
      }

      await client.query('COMMIT');
      if (expiredOrders.rows.length > 0) {
        console.log(`[Auto-Release] คืนสต็อกเรียบร้อยแล้วจำนวน ${expiredOrders.rows.length} ออเดอร์`);
      }
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[Auto-Release Error]:', error);
    } finally {
      client.release();
    }
  },

  // ดึงประวัติคำสั่งซื้อของ User รายบุคคล
  findByUserId: async (userId) => {
    const query = `
      SELECT o.id AS order_id, o.total_amount, o.status, o.created_at,
             json_agg(
               json_build_object(
                 'product_id', oi.product_id,
                 'product_name', p.name,
                 'quantity', oi.quantity,
                 'price', oi.price
               )
             ) AS items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  },

  // ดึงรายละเอียดออเดอร์ตาม ID
  findById: async (orderId) => {
    const query = `
      SELECT o.id AS order_id, o.user_id, o.total_amount, o.status, o.created_at,
             json_agg(
               json_build_object(
                 'product_id', oi.product_id,
                 'product_name', p.name,
                 'quantity', oi.quantity,
                 'price', oi.price
               )
             ) AS items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.id = $1
      GROUP BY o.id
    `;
    const result = await db.query(query, [orderId]);
    return result.rows[0];
  },

  // Admin อัปเดตสถานะ เช่น PENDING -> PAID -> SHIPPED
  updateStatus: async (orderId, status) => {
    const query = `
      UPDATE orders 
      SET status = $1 
      WHERE id = $2 
      RETURNING id, status, total_amount, created_at
    `;
    const result = await db.query(query, [status, orderId]);
    return result.rows[0];
  },

};

module.exports = OrderModel;