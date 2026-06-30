const stripe = require('stripe');
const crypto = require('crypto');
const { db } = require('../models/index');
require('dotenv').config();

let stripeClient;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder') {
  stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
}

exports.createCheckoutSession = async (req, res, next) => {
  try {
    const { items, address, couponCode } = req.body;
    const userId = req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided for checkout.' });
    }

    if (!stripeClient) {
      console.log('[Stripe Mock] Creating simulated checkout session.');
      const sessionId = `mock_sess_${crypto.randomBytes(8).toString('hex')}`;
      return res.json({
        success: true,
        mode: 'mock',
        sessionId,
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order-success?session_id=${sessionId}`
      });
    }

    const lineItems = items.map(item => ({
      price_data: {
        currency: 'inr',
        product_data: {
          name: item.productName,
          images: item.productImg ? [item.productImg] : []
        },
        unit_amount: item.price * 100 // Stripe expects paise
      },
      quantity: item.quantity
    }));

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cart`,
      metadata: {
        userId: userId.toString(),
        address: JSON.stringify(address),
        couponCode: couponCode || ''
      }
    });

    res.json({
      success: true,
      mode: 'stripe',
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    next(error);
  }
};

exports.handleWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  if (!stripeClient) {
    return res.status(400).send('Stripe is inactive');
  }

  try {
    event = stripeClient.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook verification error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('[Stripe Webhook] Checkout session completed:', session.id);

    const userId = parseInt(session.metadata.userId);
    const address = JSON.parse(session.metadata.address);
    const couponCode = session.metadata.couponCode;

    const transaction = await db.sequelize.transaction();
    try {
      const cartItems = await db.CartItem.findAll({
        where: { userId },
        include: [{ model: db.Product }],
        transaction
      });

      if (cartItems.length > 0) {
        let subtotal = 0;
        cartItems.forEach(item => {
          subtotal += item.Product.price * item.quantity;
        });

        let discount = 0;
        if (couponCode) {
          const coupon = await db.Coupon.findOne({
            where: { code: couponCode.toUpperCase(), active: true },
            transaction
          });
          if (coupon) {
            discount = Math.round(subtotal * (coupon.discountPercent / 100));
          }
        }

        const deliveryCharge = (subtotal - discount) >= 999 ? 0 : 99;
        const total = subtotal - discount + deliveryCharge;

        const randomId = crypto.randomInt(100000, 999999);
        const orderId = `AL99${randomId}`;

        await db.Order.create({
          id: orderId,
          userId,
          orderStatus: 'pending',
          subtotal,
          deliveryCharge,
          discount,
          total,
          address,
          paymentMethod: 'card',
          paymentStatus: 'paid',
          stripeSessionId: session.id
        }, { transaction });

        for (const item of cartItems) {
          await db.OrderItem.create({
            orderId,
            productId: item.productId,
            quantity: item.quantity,
            price: item.Product.price,
            selectedColor: item.selectedColor,
            selectedSize: item.selectedSize,
            productName: item.Product.name,
            productImg: item.Product.img
          }, { transaction });

          const product = item.Product;
          product.stock -= item.quantity;
          await product.save({ transaction });
        }

        await db.CartItem.destroy({
          where: { userId },
          transaction
        });

        await transaction.commit();
        console.log(`[Stripe Webhook] Order ${orderId} created successfully.`);
      } else {
        await transaction.rollback();
      }
    } catch (e) {
      console.error('[Stripe Webhook] Transaction failed:', e.message);
      await transaction.rollback();
    }
  }

  res.json({ received: true });
};
