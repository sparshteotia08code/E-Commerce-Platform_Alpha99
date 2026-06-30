const UserModel = require('./User');
const ProductModel = require('./Product');
const ReviewModel = require('./Review');
const CartItemModel = require('./CartItem');
const OrderModel = require('./Order');
const OrderItemModel = require('./OrderItem');
const AddressModel = require('./Address');
const CouponModel = require('./Coupon');

const db = {};

const initModels = (sequelize) => {
  db.sequelize = sequelize;
  db.User = UserModel(sequelize);
  db.Product = ProductModel(sequelize);
  db.Review = ReviewModel(sequelize);
  db.CartItem = CartItemModel(sequelize);
  db.Order = OrderModel(sequelize);
  db.OrderItem = OrderItemModel(sequelize);
  db.Address = AddressModel(sequelize);
  db.Coupon = CouponModel(sequelize);

  // --- Associations ---

  // User <-> Address
  db.User.hasMany(db.Address, { foreignKey: 'userId', onDelete: 'CASCADE' });
  db.Address.belongsTo(db.User, { foreignKey: 'userId' });

  // User <-> CartItem
  db.User.hasMany(db.CartItem, { foreignKey: 'userId', onDelete: 'CASCADE' });
  db.CartItem.belongsTo(db.User, { foreignKey: 'userId' });

  // Product <-> CartItem
  db.Product.hasMany(db.CartItem, { foreignKey: 'productId', onDelete: 'CASCADE' });
  db.CartItem.belongsTo(db.Product, { foreignKey: 'productId' });

  // User <-> Order
  db.User.hasMany(db.Order, { foreignKey: 'userId', onDelete: 'SET NULL' });
  db.Order.belongsTo(db.User, { foreignKey: 'userId' });

  // Order <-> OrderItem
  db.Order.hasMany(db.OrderItem, { foreignKey: 'orderId', onDelete: 'CASCADE' });
  db.OrderItem.belongsTo(db.Order, { foreignKey: 'orderId' });

  // Product <-> OrderItem
  db.Product.hasMany(db.OrderItem, { foreignKey: 'productId', onDelete: 'SET NULL' });
  db.OrderItem.belongsTo(db.Product, { foreignKey: 'productId' });

  // User <-> Review
  db.User.hasMany(db.Review, { foreignKey: 'userId', onDelete: 'SET NULL' });
  db.Review.belongsTo(db.User, { foreignKey: 'userId' });

  // Product <-> Review
  db.Product.hasMany(db.Review, { foreignKey: 'productId', onDelete: 'CASCADE' });
  db.Review.belongsTo(db.Product, { foreignKey: 'productId' });

  return db;
};

module.exports = {
  initModels,
  db
};
