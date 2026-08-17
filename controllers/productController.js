const ProductModel = require('../models/productModel');

const productController = {
  // GET: /api/products
  getProducts: async (req, res, next) => {
    try {
      const { page, limit, search, sort, minPrice, maxPrice } = req.query;

      const result = await ProductModel.findAll({
        page,
        limit,
        search,
        sort,
        minPrice,
        maxPrice
      });

      // console.log(undefinedVariable.something);
      res.status(200).json({
        success: true,
        data: result.products,
        pagination: result.pagination
      })
    } catch (error) {
      next(error);
      console.error('Error fetching products:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า'
      });
    }
  },

  // GET: /api/products/:id
  getProductById: async (req, res) => {
    const { id } = req.params;
    try {
      const product = await ProductModel.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบสินค้านี้ในระบบ'
        });
      }

      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า'
      });
    }
  },

  // POST: /api/products
  createProduct: async (req, res) => {
    const { name, price, stock } = req.body;

    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูล name, price และ stock ให้ครบถ้วน'
      });
    }

    try {
      const newProduct = await ProductModel.create({ name, price, stock });
      res.status(201).json({
        success: true,
        message: 'เพิ่มสินค้าสำเร็จ',
        data: newProduct
      });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเพิ่มสินค้า'
      });
    }
  },

  // PUT: /api/products/:id
  updateProduct: async (req, res) => {
    const { id } = req.params;
    const { name, price, stock } = req.body;

    try {
      const existingProduct = await ProductModel.findById(id);

      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบสินค้านี้ในระบบ'
        });
      }

      const updatedName = name !== undefined ? name : existingProduct.name;
      const updatedPrice = price !== undefined ? price : existingProduct.price;
      const updatedStock = stock !== undefined ? stock : existingProduct.stock;

      const updatedProduct = await ProductModel.update(id, {
        name: updatedName,
        price: updatedPrice,
        stock: updatedStock
      });

      res.status(200).json({
        success: true,
        message: 'แก้ไขข้อมูลสินค้าสำเร็จ',
        data: updatedProduct
      });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลสินค้า'
      });
    }
  },

  // DELETE: /api/products/:id
  deleteProduct: async (req, res) => {
    const { id } = req.params;

    try {
      const deletedProduct = await ProductModel.delete(id);

      if (!deletedProduct) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบสินค้านี้ในระบบ'
        });
      }

      res.status(200).json({
        success: true,
        message: 'ลบสินค้าสำเร็จ'
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการลบสินค้า'
      });
    }
  }
};

module.exports = productController;