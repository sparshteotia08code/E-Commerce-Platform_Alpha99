const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    orderStatus: {
      type: DataTypes.STRING, // pending, shipped, delivered, cancelled
      defaultValue: 'pending'
    },
    subtotal: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    deliveryCharge: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    discount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    total: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('address');
        try {
          return rawValue ? JSON.parse(rawValue) : {};
        } catch (e) {
          return {};
        }
      },
      set(value) {
        this.setDataValue('address', JSON.stringify(value || {}));
      }
    },
    paymentMethod: {
      type: DataTypes.STRING, // upi, card, netbanking, emi, cod
      allowNull: false
    },
    paymentStatus: {
      type: DataTypes.STRING, // pending, paid, failed
      defaultValue: 'pending'
    },
    stripeSessionId: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });

  return Order;
};
