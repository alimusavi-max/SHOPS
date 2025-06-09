const mongoose = require('mongoose');
const slugify = require('slugify');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'نظر باید توسط کاربر ثبت شود']
  },
  rating: {
    type: Number,
    min: [1, 'امتیاز باید حداقل 1 باشد'],
    max: [5, 'امتیاز باید حداکثر 5 باشد'],
    required: [true, 'امتیاز الزامی است']
  },
  comment: {
    type: String,
    required: [true, 'متن نظر الزامی است'],
    trim: true,
    maxlength: [500, 'نظر نباید بیشتر از 500 کاراکتر باشد']
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  helpful: {
    type: Number,
    default: 0
  },
  images: [{
    type: String
  }]
}, {
  timestamps: true
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'نام محصول الزامی است'],
    trim: true,
    maxlength: [200, 'نام محصول نباید بیشتر از 200 کاراکتر باشد']
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'توضیحات محصول الزامی است'],
    maxlength: [2000, 'توضیحات نباید بیشتر از 2000 کاراکتر باشد']
  },
  price: {
    type: Number,
    required: [true, 'قیمت محصول الزامی است'],
    min: [0, 'قیمت نمی‌تواند منفی باشد']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'تخفیف نمی‌تواند منفی باشد'],
    max: [100, 'تخفیف نمی‌تواند بیشتر از 100% باشد']
  },
  finalPrice: {
    type: Number
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    required: [true, 'دسته‌بندی محصول الزامی است']
  },
  subcategory: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category'
  },
  brand: {
    type: String,
    required: [true, 'برند محصول الزامی است'],
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    required: [true, 'کد محصول الزامی است']
  },
  barcode: {
    type: String
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: String,
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  colors: [{
    name: String,
    hex: String,
    inStock: {
      type: Boolean,
      default: true
    }
  }],
  sizes: [{
    name: String,
    inStock: {
      type: Boolean,
      default: true
    }
  }],
  features: [{
    type: String
  }],
  specifications: {
    type: Map,
    of: String
  },
  tags: [{
    type: String,
    lowercase: true
  }],
  stock: {
    quantity: {
      type: Number,
      required: [true, 'تعداد موجودی الزامی است'],
      min: [0, 'موجودی نمی‌تواند منفی باشد'],
      default: 0
    },
    reserved: {
      type: Number,
      default: 0
    },
    sold: {
      type: Number,
      default: 0
    }
  },
  inStock: {
    type: Boolean,
    default: true
  },
  weight: {
    type: Number,
    min: 0
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'امتیاز نمی‌تواند منفی باشد'],
      max: [5, 'امتیاز نمی‌تواند بیشتر از 5 باشد'],
      set: val => Math.round(val * 10) / 10
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [reviewSchema],
  viewCount: {
    type: Number,
    default: 0
  },
  wishlistCount: {
    type: Number,
    default: 0
  },
  seller: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  warranty: {
    type: String,
    default: 'گارانتی اصالت و سلامت فیزیکی کالا'
  },
  shippingInfo: {
    freeShipping: {
      type: Boolean,
      default: false
    },
    shippingCost: {
      type: Number,
      default: 0
    },
    estimatedDelivery: {
      type: String,
      default: '3 تا 5 روز کاری'
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'active'
  },
  featured: {
    type: Boolean,
    default: false
  },
  isNew: {
    type: Boolean,
    default: true
  },
  metaTitle: String,
  metaDescription: String,
  metaKeywords: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ price: 1, rating: -1 });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ status: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ slug: 1 });
productSchema.index({ sku: 1 });

// Virtual for availability
productSchema.virtual('available').get(function() {
  return this.stock.quantity - this.stock.reserved > 0;
});

// Virtual for actual stock
productSchema.virtual('actualStock').get(function() {
  return this.stock.quantity - this.stock.reserved;
});

// Pre-save middleware
productSchema.pre('save', function(next) {
  // Generate slug
  if (!this.slug) {
    this.slug = slugify(this.name, { 
      lower: true,
      strict: true,
      locale: 'fa'
    });
  }
  
  // Calculate final price
  this.finalPrice = this.discount > 0 
    ? this.price - (this.price * this.discount / 100)
    : this.price;
    
  // Update stock status
  this.inStock = this.stock.quantity > 0;
  
  // Set isNew flag (products created in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  this.isNew = this.createdAt > thirtyDaysAgo;
  
  next();
});

// Calculate average rating
productSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.rating.average = 0;
    this.rating.count = 0;
  } else {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.rating.average = sum / this.reviews.length;
    this.rating.count = this.reviews.length;
  }
  return this.save();
};

// Add review
productSchema.methods.addReview = async function(userId, rating, comment, images = []) {
  // Check if user already reviewed
  const existingReview = this.reviews.find(
    review => review.user.toString() === userId.toString()
  );
  
  if (existingReview) {
    throw new Error('شما قبلا برای این محصول نظر ثبت کرده‌اید');
  }
  
  // Check if user purchased this product
  const Order = mongoose.model('Order');
  const userOrders = await Order.find({
    user: userId,
    'items.product': this._id,
    status: 'delivered'
  });
  
  const isVerifiedPurchase = userOrders.length > 0;
  
  // Add review
  this.reviews.push({
    user: userId,
    rating,
    comment,
    images,
    isVerifiedPurchase
  });
  
  // Recalculate rating
  await this.calculateAverageRating();
  
  return this;
};

// Reserve stock
productSchema.methods.reserveStock = function(quantity) {
  if (this.actualStock < quantity) {
    throw new Error('موجودی کافی نیست');
  }
  
  this.stock.reserved += quantity;
  return this.save();
};

// Release reserved stock
productSchema.methods.releaseStock = function(quantity) {
  this.stock.reserved = Math.max(0, this.stock.reserved - quantity);
  return this.save();
};

// Sell stock
productSchema.methods.sellStock = function(quantity) {
  if (this.stock.quantity < quantity) {
    throw new Error('موجودی کافی نیست');
  }
  
  this.stock.quantity -= quantity;
  this.stock.sold += quantity;
  this.stock.reserved = Math.max(0, this.stock.reserved - quantity);
  
  return this.save();
};

// Static methods
productSchema.statics = {
  // Get featured products
  getFeatured(limit = 10) {
    return this.find({ featured: true, status: 'active' })
      .limit(limit)
      .populate('category', 'name slug');
  },
  
  // Get best sellers
  getBestSellers(limit = 10) {
    return this.find({ status: 'active' })
      .sort('-stock.sold')
      .limit(limit)
      .populate('category', 'name slug');
  },
  
  // Get new products
  getNewProducts(limit = 10) {
    return this.find({ isNew: true, status: 'active' })
      .sort('-createdAt')
      .limit(limit)
      .populate('category', 'name slug');
  },
  
  // Get discounted products
  getDiscountedProducts(limit = 10) {
    return this.find({ discount: { $gt: 0 }, status: 'active' })
      .sort('-discount')
      .limit(limit)
      .populate('category', 'name slug');
  },
  
  // Search products
  async searchProducts(query, filters = {}) {
    const searchCriteria = {
      status: 'active',
      $text: { $search: query }
    };
    
    // Apply filters
    if (filters.category) {
      searchCriteria.category = filters.category;
    }
    
    if (filters.brand) {
      searchCriteria.brand = filters.brand;
    }
    
    if (filters.minPrice || filters.maxPrice) {
      searchCriteria.finalPrice = {};
      if (filters.minPrice) searchCriteria.finalPrice.$gte = filters.minPrice;
      if (filters.maxPrice) searchCriteria.finalPrice.$lte = filters.maxPrice;
    }
    
    if (filters.inStock) {
      searchCriteria.inStock = true;
    }
    
    if (filters.hasDiscount) {
      searchCriteria.discount = { $gt: 0 };
    }
    
    // Build query
    let query = this.find(searchCriteria);
    
    // Sorting
    switch (filters.sort) {
      case 'price-asc':
        query = query.sort('finalPrice');
        break;
      case 'price-desc':
        query = query.sort('-finalPrice');
        break;
      case 'rating':
        query = query.sort('-rating.average');
        break;
      case 'newest':
        query = query.sort('-createdAt');
        break;
      case 'bestseller':
        query = query.sort('-stock.sold');
        break;
      default:
        query = query.sort({ score: { $meta: 'textScore' } });
    }
    
    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    
    query = query.skip(skip).limit(limit);
    
    // Execute query
    const products = await query.populate('category', 'name slug');
    const total = await this.countDocuments(searchCriteria);
    
    return {
      products,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;