const db = require('../config/db');

const CartModel = {
  getCartByUserId: async (userId) => {
    const query = `
      SELECT ci.id, ci.product_id, p.name, p.price, ci.quantity, (p.price * ci.quantity) AS total_price
      FROM carts c
      JOIN cart_items ci ON c.id = ci.cart_id
      JOIN products p ON ci.product_id = p.id
      WHERE c.user_id = $1
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  },

  addItem: async (userId, productId, quantity) => {
    // 1. Get or Create Cart
    let cartRes = await db.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
    let cartId = cartRes.rows[0]?.id;

    if (!cartId) {
      const newCart = await db.query('INSERT INTO carts (user_id) VALUES ($1) RETURNING id', [userId]);
      cartId = newCart.rows[0].id;
    }

    // 2. Upsert Item in Cart
    const upsertQuery = `
      INSERT INTO cart_items (cart_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (cart_id, product_id)
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
      RETURNING *
    `;
    const result = await db.query(upsertQuery, [cartId, productId, quantity]);
    return result.rows[0];
  },

  updateItemQuantity: async (userId, cartItemId, quantity) => {
    const query = `
    UPDATE cart_items
    SET quantity = $1
    FROM carts
    WHERE cart_items.cart_id = carts.id
      AND carts.user_id = $2
      AND cart_items.id = $3
    RETURNING cart_items.*
    `;
    const result = await db.query(query, [quantity, userId, cartItemId]);
    return result.rows[0];
  },

  deleteItem: async (userId, cartItemId) => {
    const query = `
    DELETE FROM cart_items
    USING carts
    WHERE cart_items.cart_id = carts.id
      AND carts.user_id = $1
      AND cart_items.id = $2
    RETURNING cart_items.id;
    `;
    const result = await db.query(query, [userId, cartItemId]);
    return result.rows[0];
  }
};

module.exports = CartModel;