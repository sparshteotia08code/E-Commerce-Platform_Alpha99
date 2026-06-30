const { Op } = require('sequelize');
const { db } = require('../models/index');
const { getCache, setCache, clearCache } = require('../utils/cache');

exports.getProducts = async (req, res, next) => {
  try {
    const { category, brand, search, minPrice, maxPrice, rating, sort } = req.query;

    const cacheKey = `products:${category || 'all'}:${brand || 'all'}:${search || 'none'}:${minPrice || 0}:${maxPrice || 0}:${rating || 0}:${sort || 'default'}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      return res.json({ success: true, count: cachedData.length, products: cachedData, fromCache: true });
    }

    const where = {};

    if (category && category !== 'all') {
      where.category = category;
    }

    if (brand) {
      where.brand = brand;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseInt(minPrice);
      if (maxPrice) where.price[Op.lte] = parseInt(maxPrice);
    }

    if (rating) {
      where.rating = { [Op.gte]: parseFloat(rating) };
    }

    if (search) {
      const searchOp = process.env.DB_DIALECT === 'postgres' ? Op.iLike : Op.like;
      where[Op.or] = [
        { name: { [searchOp]: `%${search}%` } },
        { brand: { [searchOp]: `%${search}%` } },
        { description: { [searchOp]: `%${search}%` } }
      ];
    }

    let order = [['id', 'ASC']];
    if (sort === 'price-asc') {
      order = [['price', 'ASC']];
    } else if (sort === 'price-desc') {
      order = [['price', 'DESC']];
    } else if (sort === 'rating') {
      order = [['rating', 'DESC']];
    } else if (sort === 'newest') {
      order = [['createdAt', 'DESC']];
    }

    const products = await db.Product.findAll({
      where,
      order
    });

    await setCache(cacheKey, products, 300); // Cache for 5 mins

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

exports.getBrands = async (req, res, next) => {
  try {
    const cachedBrands = await getCache('brands');
    if (cachedBrands) {
      return res.json({ success: true, brands: cachedBrands, fromCache: true });
    }

    const products = await db.Product.findAll({
      attributes: ['brand'],
      group: ['brand']
    });

    const brands = products.map(p => p.brand).filter(Boolean);
    await setCache('brands', brands, 600); // Cache for 10 mins

    res.json({ success: true, brands });
  } catch (error) {
    next(error);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await db.Product.findByPk(id, {
      include: [{
        model: db.Review,
        order: [['createdAt', 'DESC']]
      }]
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

exports.addProductReview = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const { rating, comment, title } = req.body;
    const userId = req.user.id;
    const userName = req.user.name;

    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: 'Rating and comment fields are required.' });
    }

    const product = await db.Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const existingReview = await db.Review.findOne({
      where: { userId, productId }
    });

    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product.' });
    }

    const review = await db.Review.create({
      rating: parseInt(rating),
      comment,
      title,
      userName,
      userId,
      productId
    });

    // Recalculate avg rating
    const reviews = await db.Review.findAll({ where: { productId } });
    const count = reviews.length;
    const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    const avgRating = parseFloat((sum / count).toFixed(1));

    product.reviewsCount = count;
    product.rating = avgRating;
    await product.save();

    // Clear caches
    await clearCache('products');

    res.status(201).json({
      success: true,
      message: 'Review created successfully.',
      review
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductRecommendations = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await db.Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const recommendations = await db.Product.findAll({
      where: {
        category: product.category,
        id: { [Op.ne]: product.id }
      },
      limit: 4,
      order: [['rating', 'DESC']]
    });

    res.json({ success: true, recommendations });
  } catch (error) {
    next(error);
  }
};
