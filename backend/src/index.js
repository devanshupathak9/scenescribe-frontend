process.env.TZ = 'UTC'; // Force UTC for all Date operations in this process
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');
const analyseRoutes = require('./routes/analyse');
const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function seedDefaultUser() {
  const hash = await bcrypt.hash('abc@12345', 10);
  const existing = await User.findOne({ where: { email: 'abc@gmail.com' } });

  if (existing) {
    await existing.update({ password_hash: hash, is_admin: false, is_registered: true }, { hooks: false });
    console.log('Default user synced');
  } else {
    await User.create(
      { username: 'abc', email: 'abc@gmail.com', password_hash: hash, is_admin: false, is_registered: true },
      { hooks: false },
    );
    console.log('Default user created');
  }
}

async function seedAdmin() {
  // Always hash explicitly — do NOT rely on the beforeCreate hook here
  // because findOrCreate/update bypasses hooks inconsistently across Sequelize versions.
  const hash = await bcrypt.hash('xyz@12345', 10);
  const existing = await User.findOne({ where: { email: 'xyz@gmail.com' } });

  if (existing) {
    // Reset password and ensure admin every startup so it's always in sync
    await existing.update({ password_hash: hash, is_admin: true, is_registered: true }, { hooks: false });
    console.log('Admin user synced');
  } else {
    await User.create(
      { username: 'xyz', email: 'xyz@gmail.com', password_hash: hash, is_admin: true, is_registered: true },
      { hooks: false },  // we already hashed above, skip beforeCreate to avoid double-hash
    );
    console.log('Admin user created');
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analyse', analyseRoutes);

app.get('/api/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));

// Sync DB and start server
sequelize.sync({ alter: true })
  .then(async () => {
    console.log('Database synced');
    await seedAdmin();
    await seedDefaultUser();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to sync database:', err);
    process.exit(1);
  });
