const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true,   // null until email is verified and registration is completed
    unique: true,
    validate: { len: [3, 30] },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: true,   // null until registration is completed
  },
  is_registered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,  // false = email submitted, OTP sent; true = fully registered
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  otp_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  curr_streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  longest_streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  total_completed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  last_submission_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  is_admin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  hooks: {
    beforeCreate: async (user) => {
      // Only hash when a plain-text password was actually provided.
      // Step 1 of registration (email-only) creates the row without a password.
      if (user.password_hash) {
        user.password_hash = await bcrypt.hash(user.password_hash, 10);
      }
    },
  },
});

User.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.password_hash);
};

module.exports = User;
