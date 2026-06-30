const { db } = require('../models/index');

exports.getCart = async (req, res, next) => {
  try {
    const cartItems = await db.CartItem.findAll({
      where: { userId: req.user.id },
      include: [{ model: db.Product, attributes: ['id', 'name', 'brand', 'price', 'originalPrice', 'img', 'stock'] }]
    });

    res.json({ success: true, count: cartItems.length, cart: cartItems });
  } catch (error) {
    next(error);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity, selectedColor, selectedSize } = req.body;
    const userId = req.user.id;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const product = await db.Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    let cartItem = await db.CartItem.findOne({
      where: {
        userId,
        productId,
        selectedColor: selectedColor || null,
        selectedSize: selectedSize || null
      }
    });

    if (cartItem) {
      cartItem.quantity += parseInt(quantity || 1);
      await cartItem.save();
    } else {
      cartItem = await db.CartItem.create({
        userId,
        productId,
        quantity: parseInt(quantity || 1),
        selectedColor: selectedColor || null,
        selectedSize: selectedSize || null
      });
    }

    res.json({
      success: true,
      message: 'Item added to bag.',
      cartItem
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    const cartItem = await db.CartItem.findOne({ where: { id, userId } });

    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Item not found in your bag.' });
    }

    const qty = parseInt(quantity);
    if (qty <= 0) {
      await cartItem.destroy();
      return res.json({ success: true, message: 'Item removed from bag.' });
    }

    cartItem.quantity = qty;
    await cartItem.save();

    res.json({ success: true, message: 'Bag updated.', cartItem });
  } catch (error) {
    next(error);
  }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const cartItem = await db.CartItem.findOne({ where: { id, userId } });

    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Item not found in your bag.' });
    }

    await cartItem.destroy();

    res.json({ success: true, message: 'Item removed from bag.' });
  } catch (error) {
    next(error);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    await db.CartItem.destroy({ where: { userId: req.user.id } });
    res.json({ success: true, message: 'Bag cleared.' });
  } catch (error) {
    next(error);
  }
};
