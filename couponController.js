const { db } = require('../models/index');

exports.validateCoupon = async (req, res, next) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }

    const coupon = await db.Coupon.findOne({
      where: {
        code: code.toUpperCase(),
        active: true
      }
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code.' });
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      coupon.active = false;
      await coupon.save();
      return res.status(400).json({ success: false, message: 'This coupon code has expired.' });
    }

    res.json({
      success: true,
      message: 'Coupon code applied successfully.',
      discountPercent: coupon.discountPercent
    });
  } catch (error) {
    next(error);
  }
};
