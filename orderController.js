const { db } = require('../models/index');
const crypto = require('crypto');

exports.createOrder = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { address, paymentMethod, couponCode } = req.body;
    const userId = req.user.id;

    if (!address || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Address and payment method are required.' });
    }

    const cartItems = await db.CartItem.findAll({
      where: { userId },
      include: [{ model: db.Product }],
      transaction
    });

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Your shopping bag is empty.' });
    }

    // Check stock for all items
    for (const item of cartItems) {
      if (item.Product.stock < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${item.Product.name}". Only ${item.Product.stock} left.`
        });
      }
    }

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

    const order = await db.Order.create({
      id: orderId,
      userId,
      orderStatus: 'pending',
      subtotal,
      deliveryCharge,
      discount,
      total,
      address,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid' // cod starts pending, cards auto-paid in mock
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

      // Deduct inventory stock
      const product = item.Product;
      product.stock -= item.quantity;
      await product.save({ transaction });
    }

    // Clear cart
    await db.CartItem.destroy({
      where: { userId },
      transaction
    });

    await transaction.commit();

    console.log(`[Order API] Order ${orderId} placed by user ${userId}.`);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      orderId,
      order
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    next(error);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await db.Order.findAll({
      where: { userId: req.user.id },
      include: [db.OrderItem],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const order = await db.Order.findByPk(id, {
      include: [db.OrderItem]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.userId !== userId && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this order.' });
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

exports.downloadInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const order = await db.Order.findByPk(id, {
      include: [db.OrderItem]
    });

    if (!order) {
      return res.status(404).send('<h1>Order not found</h1>');
    }

    if (order.userId !== userId && role !== 'admin') {
      return res.status(403).send('<h1>Access Denied</h1>');
    }

    const addr = order.address;
    const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const itemsRows = order.OrderItems.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.productName} ${item.selectedColor ? `(${item.selectedColor})` : ''} ${item.selectedSize ? `[${item.selectedSize}]` : ''}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">₹${item.price}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.price * item.quantity}</td>
      </tr>
    `).join('');

    const htmlInvoice = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order.id}</title>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; }
          .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, .15); font-size: 14px; line-height: 24px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 20px; }
          .company-name { font-size: 26px; font-weight: bold; color: #0ea5e9; }
          .invoice-title { font-size: 22px; font-weight: bold; text-align: right; }
          .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .bill-to, .bill-details { width: 45%; }
          .bill-to h3, .bill-details h3 { margin-top: 0; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background-color: #f8fafc; padding: 10px; border-bottom: 2px solid #ddd; font-weight: bold; text-align: left; }
          .totals { margin-top: 20px; text-align: right; font-size: 15px; }
          .totals table { width: 300px; margin-left: auto; }
          .totals td { padding: 5px 10px; }
          .totals .grand-total { font-size: 18px; font-weight: bold; color: #0ea5e9; border-top: 2px solid #0ea5e9; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <div>
              <div class="company-name">ALPHA99</div>
              <div>India's Premium Multi-Brand Store</div>
              <div>support@alpha99.com</div>
            </div>
            <div>
              <div class="invoice-title">TAX INVOICE</div>
              <div>Invoice No: <strong>INV-${order.id}</strong></div>
              <div>Date: ${dateStr}</div>
              <div>Status: <span style="color: ${order.paymentStatus === 'paid' ? '#16a34a' : '#d97706'}">${order.paymentStatus.toUpperCase()}</span></div>
            </div>
          </div>

          <div class="details">
            <div class="bill-to">
              <h3>Bill To:</h3>
              <strong>${addr.fullName || 'Valued Customer'}</strong><br>
              ${addr.addressLine || ''}<br>
              ${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}<br>
              Phone: ${addr.phone || ''}
            </div>
            <div class="bill-details">
              <h3>Order Details:</h3>
              Order Reference: #${order.id}<br>
              Payment Method: ${order.paymentMethod.toUpperCase()}<br>
              Shipping Method: Standard Delivery
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product Description</th>
                <th style="text-align: center; width: 100px;">Unit Price</th>
                <th style="text-align: center; width: 80px;">Qty</th>
                <th style="text-align: right; width: 120px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="totals">
            <table>
              <tr>
                <td>Subtotal:</td>
                <td>₹${order.subtotal}</td>
              </tr>
              ${order.discount > 0 ? `
              <tr>
                <td style="color: #16a34a;">Coupon Discount:</td>
                <td style="color: #16a34a;">-₹${order.discount}</td>
              </tr>
              ` : ''}
              <tr>
                <td>Delivery Charges:</td>
                <td>${order.deliveryCharge > 0 ? `₹${order.deliveryCharge}` : 'FREE'}</td>
              </tr>
              <tr class="grand-total">
                <td>Grand Total:</td>
                <td>₹${order.total}</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            Thank you for shopping with E-Commerce-Platform_Alpha99!<br>
            This is a computer-generated tax invoice. No signature is required.
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlInvoice);
  } catch (error) {
    next(error);
  }
};
