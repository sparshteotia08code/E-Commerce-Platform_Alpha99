const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
require('dotenv').config();

const { initDatabase } = require('./config/database');
const { initModels } = require('./models/index');
const seedData = require('./config/seed');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware configuration
app.use(helmet({
  contentSecurityPolicy: false // Required to view Swagger docs UI locally without assets being blocked
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limits
app.use('/api', apiLimiter);

// API Documentation UI
try {
  const swaggerDocument = YAML.load(path.join(__dirname, './config/swagger.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('[Server] Swagger API docs configured at /api-docs');
} catch (e) {
  console.error('[Server] Failed to initialize Swagger documentation:', e.message);
}

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date(), env: process.env.NODE_ENV });
});

// Routers
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const couponRoutes = require('./routes/couponRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// Route Fallback
app.use((req, res, next) => {
  const error = new Error(`Cannot ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Error handling handler
app.use(errorHandler);

const startServer = async () => {
  try {
    const sequelize = await initDatabase();
    const db = initModels(sequelize);

    // Sync database schema. This creates/updates tables automatically without data loss (using alter)
    await sequelize.sync({ alter: true });
    console.log('[Database] Schema synced successfully.');

    // Seed original products and default user accounts
    await seedData(db);

    app.listen(PORT, () => {
      console.log(`[Server] Express API Server running on port ${PORT} in ${process.env.NODE_ENV} mode.`);
    });
  } catch (error) {
    console.error('[Server] Startup failed during boot:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app; // For testing suites
