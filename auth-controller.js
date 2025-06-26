const User = require('./user-model.js');
const crypto = require('crypto');
const sendEmail = require('./email-service.js'); // Assuming email-service.js exports the send function directly
const { generateOTP, verifyOTP } = require('./otp-util.js'); // Using the new placeholder
const catchAsync = require('./catch-async-util.js');
const AppError = require('./app-error-util.js');

// Generate and send token response
const createSendToken = (user, statusCode, res) => {
  const token = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();
  
  // Cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };
  
  // Save refresh token
  user.save({ validateBeforeSave: false });
  
  // Send cookies
  res.cookie('jwt', token, cookieOptions);
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  });
  
  // Remove password from output
  user.password = undefined;
  
  res.status(statusCode).json({
    success: true,
    token,
    refreshToken,
    user
  });
};

// Register new user
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, phone, password } = req.body;
  
  // Check if user exists
  const existingUser = await User.findOne({
    $or: [{ email }, { phone }]
  });
  
  if (existingUser) {
    return next(new AppError('این ایمیل یا شماره موبایل قبلا ثبت شده است', 400));
  }
  
  // Create user
  const user = await User.create({
    name,
    email,
    phone,
    password
  });
  
  // Generate email verification token
  const verifyToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });
  
  // Send verification email
  try {
    const verifyURL = `${req.protocol}://${req.get(
      'host'
    )}/api/auth/verify-email/${verifyToken}`;
    
    await sendEmail({
      email: user.email,
      subject: 'تایید ایمیل - فروشگاه آنلاین',
      template: 'emailVerification',
      context: {
        name: user.name,
        verifyURL
      }
    });
  } catch (err) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
  }
  
  // Send OTP for phone verification
  try {
    await generateOTP(user.phone);
  } catch (err) {
    console.error('OTP sending failed:', err);
  }
  
  createSendToken(user, 201, res);
});

// Login user
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  
  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError('لطفا ایمیل و رمز عبور را وارد کنید', 400));
  }
  
  // Check if user exists and password is correct
  const user = await User.findByCredentials(email, password);
  
  createSendToken(user, 200, res);
});

// Logout user
exports.logout = catchAsync(async (req, res) => {
  // Clear cookies
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.cookie('refreshToken', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({
    success: true,
    message: 'با موفقیت خارج شدید'
  });
});

// Refresh token
exports.refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.cookies;
  
  if (!refreshToken) {
    return next(new AppError('لطفا دوباره وارد شوید', 401));
  }
  
  // Verify refresh token
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  
  // Find user and check if refresh token exists
  const user = await User.findById(decoded.id);
  
  if (!user || !user.refreshTokens.find(rt => rt.token === refreshToken)) {
    return next(new AppError('توکن نامعتبر است', 401));
  }
  
  // Remove old refresh token
  user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
  
  // Generate new tokens
  createSendToken(user, 200, res);
});

// Forgot password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  
  // Get user based on email
  const user = await User.findOne({ email });
  
  if (!user) {
    return next(new AppError('کاربری با این ایمیل یافت نشد', 404));
  }
  
  // Generate reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });
  
  // Send it to user's email
  try {
    const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    
    await sendEmail({
      email: user.email,
      subject: 'بازیابی رمز عبور - فروشگاه آنلاین',
      template: 'passwordReset',
      context: {
        name: user.name,
        resetURL
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'لینک بازیابی رمز عبور به ایمیل شما ارسال شد'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    return next(new AppError('خطا در ارسال ایمیل. لطفا دوباره تلاش کنید', 500));
  }
});

// Reset password
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;
  
  // Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
    
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  
  if (!user) {
    return next(new AppError('توکن نامعتبر یا منقضی شده است', 400));
  }
  
  // Set new password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  
  // Log user in
  createSendToken(user, 200, res);
});

// Update password
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  
  // Get user from collection
  const user = await User.findById(req.user.id).select('+password');
  
  // Check if current password is correct
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('رمز عبور فعلی اشتباه است', 401));
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  // Log user in with new password
  createSendToken(user, 200, res);
});

// Verify email
exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  
  // Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
    
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });
  
  if (!user) {
    return next(new AppError('توکن نامعتبر یا منقضی شده است', 400));
  }
  
  // Verify email
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });
  
  res.status(200).json({
    success: true,
    message: 'ایمیل شما با موفقیت تایید شد'
  });
});

// Send OTP for phone verification
exports.sendPhoneOTP = catchAsync(async (req, res, next) => {
  const { phone } = req.body;
  
  // Generate and send OTP
  await generateOTP(phone);
  
  res.status(200).json({
    success: true,
    message: 'کد تایید به شماره موبایل شما ارسال شد'
  });
});

// Verify phone with OTP
exports.verifyPhone = catchAsync(async (req, res, next) => {
  const { phone, otp } = req.body;
  
  // Verify OTP
  const isValid = await verifyOTP(phone, otp);
  
  if (!isValid) {
    return next(new AppError('کد تایید نامعتبر یا منقضی شده است', 400));
  }
  
  // Update user
  const user = await User.findOne({ phone });
  if (user) {
    user.isPhoneVerified = true;
    await user.save({ validateBeforeSave: false });
  }
  
  res.status(200).json({
    success: true,
    message: 'شماره موبایل شما با موفقیت تایید شد'
  });
});

// Get current user
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate('orders')
    .select('-refreshTokens');
    
  res.status(200).json({
    success: true,
    user
  });
});