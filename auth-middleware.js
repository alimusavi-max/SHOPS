const jwt = require('jsonwebtoken');
const User = require('./user-model.js');
const catchAsync = require('./catch-async-util.js');
const AppError = require('./app-error-util.js');

// Protect routes - Authentication check
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  
  // 1) Getting token and check if it exists
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  
  if (!token) {
    return next(new AppError('شما وارد حساب کاربری نشده‌اید', 401));
  }
  
  // 2) Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('توکن نامعتبر است', 401));
    } else if (err.name === 'TokenExpiredError') {
      return next(new AppError('توکن منقضی شده است', 401));
    }
    return next(err);
  }
  
  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('کاربر مربوط به این توکن دیگر وجود ندارد', 401));
  }
  
  // 4) Check if user is active
  if (!currentUser.isActive) {
    return next(new AppError('حساب کاربری شما غیرفعال شده است', 401));
  }
  
  // Grant access to protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Restrict to certain roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('شما دسترسی لازم برای انجام این عملیات را ندارید', 403)
      );
    }
    next();
  };
};

// Check if user is logged in (for rendered pages)
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) Verify token
      const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
      
      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      
      // 3) Check if user is active
      if (!currentUser.isActive) {
        return next();
      }
      
      // There is a logged in user
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

// Optional authentication
exports.optionalAuth = async (req, res, next) => {
  let token;
  
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const currentUser = await User.findById(decoded.id);
      
      if (currentUser && currentUser.isActive) {
        req.user = currentUser;
        res.locals.user = currentUser;
      }
    } catch (err) {
      // Token is invalid, but we continue without user
    }
  }
  
  next();
};

// Verify email before certain actions
exports.verifyEmail = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return next(
      new AppError('لطفا ابتدا ایمیل خود را تایید کنید', 403)
    );
  }
  next();
};

// Verify phone before certain actions
exports.verifyPhone = (req, res, next) => {
  if (!req.user.isPhoneVerified) {
    return next(
      new AppError('لطفا ابتدا شماره موبایل خود را تایید کنید', 403)
    );
  }
  next();
};

// Rate limiting for sensitive routes
const rateLimit = require('express-rate-limit');

exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'تعداد تلاش‌های ورود بیش از حد مجاز. لطفا بعد از 15 دقیقه دوباره تلاش کنید',
  standardHeaders: true,
  legacyHeaders: false,
});

exports.createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 requests per windowMs
  message: 'تعداد ثبت‌نام از این IP بیش از حد مجاز است. لطفا بعدا تلاش کنید',
  standardHeaders: true,
  legacyHeaders: false,
});

exports.passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 requests per windowMs
  message: 'تعداد درخواست بازیابی رمز عبور بیش از حد مجاز است',
  standardHeaders: true,
  legacyHeaders: false,
});