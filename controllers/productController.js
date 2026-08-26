const ProductModel = require('../models/productModel');

const productController = {
  // GET: /api/products
  getProducts: async (req, res, next) => {
    try {
      const { page, limit, search, sort, minPrice, maxPrice, categoryId, tagId, variants } = req.query;

      const result = await ProductModel.findAll({
        page,
        limit,
        search,
        sort,
        minPrice,
        maxPrice,
        categoryId,
        tagId,
        variants
      });

      // console.log(undefinedVariable.something);
      res.status(200).json({
        success: true,
        data: result.products,
        pagination: result.pagination
      })
    } catch (error) {
      next(error);
    }
  },

  // GET: /api/products/:id
  getProductById: async (req, res, next) => {
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
      next(error);
    }
  },

  // POST: /api/products
  createProduct: async (req, res, next) => {
    try {
      const { name, price, stock, categoryId, tagIds, variants } = req.body;

      if (!name || price === undefined || stock === undefined) {
        return res.status(400).json({
          success: false,
          message: 'กรุณากรอกข้อมูล name, price และ stock ให้ครบถ้วน'
        });
      }

      const newProduct = await ProductModel.create({
        name,
        price: parseFloat(price),
      stock: parseInt(stock, 10),
      categoryId: categoryId ? parseInt(categoryId, 10) : null,
      tagIds: tagIds || [],
      variants: variants || [] 
      });
      
      res.status(201).json({
        success: true,
        message: 'เพิ่มสินค้าสำเร็จ',
        data: newProduct
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT: /api/products/:id
  updateProduct: async (req, res, next) => {
    const { id } = req.params;
    const { name, price, stock, categoryId, tagIds } = req.body;

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
      const updatedCategoryId = categoryId !== undefined ? categoryId : existingProduct.category_id;

      // ถ้าไม่มีการส่ง tagIds มา ให้ใช้ tagIds เดิมของสินค้านั้น
      const existingTagIds = existingProduct.tags ? existingProduct.tags.map(t => t.id) : [];
      const updatedTagIds = tagIds !== undefined ? tagIds : existingTagIds;

      const updatedProduct = await ProductModel.update(id, {
        name: updatedName,
        price: updatedPrice,
        stock: updatedStock,
        categoryId: updatedCategoryId,
        tagIds: updatedTagIds
      });

      res.status(200).json({
        success: true,
        message: 'แก้ไขข้อมูลสินค้าสำเร็จ',
        data: updatedProduct
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE: /api/products/:id
  deleteProduct: async (req, res, next) => {
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
      next(error);
    }
  }
};

module.exports = productController;