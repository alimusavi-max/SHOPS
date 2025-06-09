const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const addressSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'عنوان آدرس الزامی است'],
    trim: true
  },
  receiver: {
    type: String,
    required: [true, 'نام گیرنده الزامی است'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'شماره تماس الزامی است'],
    match: [/^09\d{9}$/, 'شماره موبایل معتبر نیست']
  },
  province: {
    type: String,
    required: [true, 'استان الزامی است']
  },
  city: {
    type: String,
    required: [true, 'شهر الزامی است']
  },
  address: {
    type: String,
    required: [true, 'آدرس کامل الزامی است']
  },
  postalCode: {
    type: String,
    required: [true, 'کد پستی الزامی است'],
    match: [/^\d{10}$/, 'کد پستی باید 10 رقم باشد']
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'نام و نام خانوادگی الزامی است'],
    trim: true,
    minlength: [3, 'نام باید حداقل 3 کاراکتر باشد']
  },
  email: {
    type: String,
    required: [true, 'ایمیل الزامی است'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'ایمیل معتبر نیست']
  },
  phone: {
    type: String,
    required: [true, 'شماره موبایل الزامی است'],
    unique: true,
    match: [/^09\d{9}$/, 'شماره موبایل معتبر نیست']
  },
  password: {
    type: String,
    required: [true, 'رمز عبور الزامی است'],
    minlength: [8, 'رمز عبور باید حداقل 8 کاراکتر باشد'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'seller'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: null
  },
  nationalCode: {
    type: String,
    match: [/^\d{10}$/, 'کد ملی باید 10 رقم باشد']
  },
  birthDate: {
    type: Date
  },
  addresses: [addressSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  twoFactorSecret: String,
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  lastLogin: Date,
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800 // 7 days
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for user's orders
userSchema.virtual('orders', {
  ref: 'Order',
  foreignField: 'user',
  localField: '_id'
});

// Check if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Ensure only one default address
userSchema.pre('save', function(next) {
  if (this.addresses && this.addresses.length > 0) {
    const defaultAddresses = this.addresses.filter(addr => addr.isDefault);
    if (defaultAddresses.length > 1) {
      // Keep only the last one as default
      this.addresses.forEach((addr, index) => {
        addr.isDefault = index === this.addresses.length - 1;
      });
    }
  }
  next();
});

// Instance methods
userSchema.methods = {
  // Compare password
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  },
  
  // Generate JWT token
  generateAuthToken() {
    return jwt.sign(
      { 
        id: this._id, 
        email: this.email,
        role: this.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
  },
  
  // Generate refresh token
  generateRefreshToken() {
    const refreshToken = jwt.sign(
      { id: this._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );
    
    this.refreshTokens.push({ token: refreshToken });
    return refreshToken;
  },
  
  // Generate password reset token
  generatePasswordResetToken() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
      
    this.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    
    return resetToken;
  },
  
  // Generate email verification token
  generateEmailVerificationToken() {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    this.emailVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
      
    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    return verificationToken;
  },
  
  // Handle failed login attempts
  incLoginAttempts() {
    // Reset attempts if lock has expired
    if (this.lockUntil && this.lockUntil < Date.now()) {
      return this.updateOne({
        $set: { loginAttempts: 1 },
        $unset: { lockUntil: 1 }
      });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    const maxAttempts = 5;
    const lockTime = 2 * 60 * 60 * 1000; // 2 hours
    
    if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
      updates.$set = { lockUntil: Date.now() + lockTime };
    }
    
    return this.updateOne(updates);
  },
  
  // Reset login attempts
  resetLoginAttempts() {
    return this.updateOne({
      $set: { loginAttempts: 0 },
      $unset: { lockUntil: 1 }
    });
  }
};

// Static methods
userSchema.statics = {
  // Find user by credentials
  async findByCredentials(emailOrPhone, password) {
    const user = await this.findOne({
      $or: [
        { email: emailOrPhone },
        { phone: emailOrPhone }
      ]
    }).select('+password');
    
    if (!user) {
      throw new Error('اطلاعات وارد شده صحیح نمی‌باشد');
    }
    
    if (user.isLocked) {
      throw new Error('حساب کاربری شما موقتا مسدود شده است');
    }
    
    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch) {
      await user.incLoginAttempts();
      throw new Error('اطلاعات وارد شده صحیح نمی‌باشد');
    }
    
    if (!user.isActive) {
      throw new Error('حساب کاربری شما غیرفعال است');
    }
    
    // Reset login attempts and update last login
    await user.resetLoginAttempts();
    user.lastLogin = Date.now();
    await user.save();
    
    return user;
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;