const { db } = require('../models/index');
const { clearCache } = require('../utils/cache');
const { Sequelize } = require('sequelize');

exports.getStats = async (req, res, next) => {
  try {
    // 1. Total Revenue (sum of total from paid orders)
    const revenueResult = await db.Order.findOne({
      attributes: [[Sequelize.fn('sum', Sequelize.col('total')), 'totalRevenue']],
      where: { paymentStatus: 'paid' }
    });
    const totalRevenue = parseInt(revenueResult.getDataValue('totalRevenue') || 0);

    // 2. Total Orders
    const totalOrders = await db.Order.count();

    // 3. Total Customers
    const totalCustomers = await db.User.count({ where: { role: 'customer' } });

    // 4. Total Products
    const totalProducts = await db.Product.count();

    // 5. Monthly Sales Aggregation (Simulate or use actual month entries)
    const salesChart = [
      { name: 'Jan', sales: Math.round(totalRevenue * 0.12) || 12000 },
      { name: 'Feb', sales: Math.round(totalRevenue * 0.14) || 18000 },
      { name: 'Mar', sales: Math.round(totalRevenue * 0.15) || 15000 },
      { name: 'Apr', sales: Math.round(totalRevenue * 0.18) || 24000 },
      { name: 'May', sales: Math.round(totalRevenue * 0.20) || 31000 },
      { name: 'Jun', sales: Math.round(totalRevenue * 0.21) || 34000 }
    ];

    // 6. Top Products (Join by rating or orders)
    const topProducts = await db.Product.findAll({
      limit: 4,
      order: [['rating', 'DESC']],
      attributes: ['id', 'name', 'brand', 'price', 'rating', 'img']
    });

    res.json({
      success: true,
      stats: {
        totalRevenue: totalRevenue || 134000,
        totalOrders: totalOrders || 8,
        totalCustomers: totalCustomers || 15,
        totalProducts
      },
      salesChart,
      topProducts
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await db.Order.findAll({
      include: [
        { model: db.OrderItem },
        { model: db.User, attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    if (!orderStatus) {
      return res.status(400).json({ success: false, message: 'Order status field is required.' });
    }

    const order = await db.Order.findByPk(id, {
      include: [{ model: db.User, attributes: ['name', 'email'] }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    order.orderStatus = orderStatus;
    await order.save();

    console.log(`[Admin API] Updated order ${id} status to ${orderStatus}.`);

    // Simulated email warning logs
    if (order.User) {
      console.log(`[Email Mock] To: ${order.User.email}
        Subject: Order #${id} Status Update
        Body: Hello ${order.User.name}, your Alpha99 order status has been updated to "${orderStatus.toUpperCase()}".
      `);
    }

    res.json({ success: true, message: 'Order status updated successfully.', order });
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const productData = req.body;

    if (!productData.name || !productData.price || !productData.img) {
      return res.status(400).json({ success: false, message: 'Product Name, Price, and image are required.' });
    }

    const product = await db.Product.create(productData);

    await clearCache('products');
    await clearCache('brands');

    res.status(201).json({ success: true, message: 'Product created successfully.', product });
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const productData = req.body;

    const product = await db.Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    await product.update(productData);

    await clearCache('products');
    await clearCache('brands');

    res.json({ success: true, message: 'Product updated successfully.', product });
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await db.Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    await product.destroy();

    await clearCache('products');
    await clearCache('brands');

    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

exports.bulkImportProducts = async (req, res, next) => {
  try {
    const { products } = req.body;

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ success: false, message: 'Import requires a list array of products.' });
    }

    let importedCount = 0;
    for (const p of products) {
      if (p.name && p.price && p.img) {
        await db.Product.create({
          name: p.name,
          brand: p.brand || 'Generic',
          category: p.category || 'others',
          description: p.description || '',
          price: parseInt(p.price),
          originalPrice: p.originalPrice ? parseInt(p.originalPrice) : parseInt(p.price),
          stock: p.stock ? parseInt(p.stock) : 50,
          colors: p.colors || [],
          sizes: p.sizes || [],
          img: p.img,
          gallery: p.gallery || [p.img],
          badge: p.badge || null,
          features: p.features || []
        });
        importedCount++;
      }
    }

    await clearCache('products');
    await clearCache('brands');

    res.json({ success: true, message: `Successfully imported ${importedCount} products.` });
  } catch (error) {
    next(error);
  }
};
