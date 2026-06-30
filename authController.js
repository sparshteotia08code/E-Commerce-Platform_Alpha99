const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../models/index');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Helper to sign JWT
const signToken = (user) => {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'super_secret_alpha_key_99',
    { expiresIn: '7d' }
  );
};

// Helper to send email (graceful logging if SMTP not configured)
const sendEmail = async (to, subject, text, html) => {
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'user_placeholder') {
    console.log(`[Email Mock]
      To: ${to}
      Subject: ${subject}
      Body: ${text}
    `);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 2525,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@alpha99.com',
      to,
      subject,
      text,
      html
    });
    console.log(`[Email] Dispatched successfully to ${to}`);
  } catch (e) {
    console.error('[Email] Failed to send email via SMTP:', e.message);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await db.User.create({
      name,
      email,
      passwordHash,
      verificationToken,
      verified: false
    });

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    const subject = 'Verify your email for E-Commerce-Platform_Alpha99';
    const text = `Welcome to Alpha99! Please verify your email by clicking this link: ${verificationUrl}`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to Alpha99, ${name}!</h2>
        <p>Thank you for signing up. Please click the button below to verify your email address:</p>
        <a href="${verificationUrl}" style="background-color: #0ea5e9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px;">Verify Email</a>
      </div>
    `;

    await sendEmail(email, subject, text, html);

    const token = signToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Verification email sent.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken(user);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash', 'verificationToken'] },
      include: [db.Address]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, password, profileImg } = req.body;
    const user = await db.User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name) user.name = name;
    if (profileImg) user.profileImg = profileImg;
    if (password) {
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        profileImg: user.profileImg
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required.' });
    }

    const user = await db.User.findOne({ where: { verificationToken: token } });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token.' });
    }

    user.verified = true;
    user.verificationToken = null;
    await user.save();

    res.json({ success: true, message: 'Email address verified successfully!' });
  } catch (error) {
    next(error);
  }
};

exports.socialLogin = async (req, res, next) => {
  try {
    const { email, name, provider, providerId } = req.body;

    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Email and name are required for social login.' });
    }

    let user = await db.User.findOne({ where: { email } });

    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = await db.User.create({
        name,
        email,
        passwordHash,
        verified: true, // OAuth registrations are pre-verified
        role: 'customer'
      });
      console.log(`[Social Login] Registered new user: ${email} via ${provider || 'oauth'}`);
    }

    const token = signToken(user);

    res.json({
      success: true,
      message: `Login successful via ${provider || 'social provider'}.`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.addAddress = async (req, res, next) => {
  try {
    const { fullName, phone, addressLine, city, state, pincode, isDefault } = req.body;
    const userId = req.user.id;

    if (!fullName || !phone || !addressLine || !city || !pincode) {
      return res.status(400).json({ success: false, message: 'All address fields are required.' });
    }

    const address = await db.Address.create({
      fullName,
      phone,
      addressLine,
      city,
      state,
      pincode,
      isDefault: isDefault || false,
      userId
    });

    res.status(201).json({ success: true, message: 'Address added successfully.', address });
  } catch (error) {
    next(error);
  }
};

exports.removeAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const address = await db.Address.findOne({ where: { id, userId } });

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }

    await address.destroy();
    res.json({ success: true, message: 'Address deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
