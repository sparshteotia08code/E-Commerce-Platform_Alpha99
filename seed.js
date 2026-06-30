const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const seedData = async (db) => {
  try {
    // 1. Check if products already exist
    const count = await db.Product.count();
    if (count > 0) {
      console.log('[Seeder] Database already populated. Skipping seed.');
      return;
    }

    console.log('[Seeder] Seeding original database content...');

    // 2. Read products from legacy data.js dynamically
    const dataPath = path.join(__dirname, '../../../original/original/js/data.js'); // Nested due to folder rename/move
    const dataPathAlternative = path.join(__dirname, '../../../../original/js/data.js'); // fallback path search
    const dataPathAlternative2 = path.join(__dirname, '../../../original/js/data.js');

    let resolvedPath = null;
    if (fs.existsSync(dataPath)) resolvedPath = dataPath;
    else if (fs.existsSync(dataPathAlternative)) resolvedPath = dataPathAlternative;
    else if (fs.existsSync(dataPathAlternative2)) resolvedPath = dataPathAlternative2;

    let products = [];
    if (resolvedPath) {
      console.log(`[Seeder] Reading legacy products from: ${resolvedPath}`);
      const rawContent = fs.readFileSync(resolvedPath, 'utf8');
      // Evaluate raw js to extract PRODUCTS
      const getProducts = new Function(`${rawContent}; return PRODUCTS;`);
      products = getProducts();
      console.log(`[Seeder] Loaded ${products.length} products dynamically.`);
    } else {
      console.warn('[Seeder] Legacy data.js not found. Seeding with a minimal fallback.');
      products = [
        {
          id: 1,
          name: 'Premium Slim Fit Formal Shirt',
          brand: 'Allen Solly',
          category: 'mens',
          img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80',
          price: 1299,
          originalPrice: 2499,
          rating: 4.7,
          reviews: 2341,
          colors: ['#FFFFFF', '#87CEEB', '#F5DEB3', '#000000'],
          sizes: ['S', 'M', 'L', 'XL', 'XXL'],
          badge: 'hot',
          description: 'Crafted from premium Egyptian cotton, this slim-fit shirt offers superior comfort. Wrinkle-resistant fabric.',
          features: ['100% Premium Cotton', 'Wrinkle-resistant']
        }
      ];
    }

    // 3. Format and save products
    for (const p of products) {
      await db.Product.create({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        description: p.description || 'Premium design and construction by original brand.',
        price: p.price,
        originalPrice: p.originalPrice || p.price,
        stock: p.stock || 50,
        rating: p.rating || 4.5,
        reviewsCount: p.reviews || 0,
        colors: p.colors || [],
        sizes: p.sizes || [],
        img: p.img,
        gallery: p.gallery || [p.img],
        videoUrl: p.videoUrl || null,
        view360: p.view360 || [],
        badge: p.badge || null,
        features: p.features || []
      });
    }
    console.log('[Seeder] Products seeded successfully.');

    // 4. Seed default coupons
    const coupons = [
      { code: 'ALPHA99', discountPercent: 10 },
      { code: 'SAVE20', discountPercent: 20 },
      { code: 'WELCOME15', discountPercent: 15 },
      { code: 'FIRST50', discountPercent: 50 }
    ];

    for (const c of coupons) {
      await db.Coupon.create(c);
    }
    console.log('[Seeder] Coupon codes seeded.');

    // 5. Seed default admin and user
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const userPasswordHash = await bcrypt.hash('user123', 10);

    await db.User.create({
      name: 'Alpha Admin',
      email: 'admin@alpha99.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      verified: true
    });

    await db.User.create({
      name: 'John Doe',
      email: 'user@alpha99.com',
      passwordHash: userPasswordHash,
      role: 'customer',
      verified: true
    });

    console.log('[Seeder] Default users seeded successfully:');
    console.log('   - Admin: admin@alpha99.com / admin123');
    console.log('   - Customer: user@alpha99.com / user123');

  } catch (error) {
    console.error('[Seeder] Failed to seed database:', error);
  }
};

module.exports = seedData;
