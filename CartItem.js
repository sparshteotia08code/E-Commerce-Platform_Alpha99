const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CartItem = sequelize.define('CartItem', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false
    },
    selectedColor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    selectedSize: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });

  return CartItem;
};
