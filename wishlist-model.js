const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: [true, 'محصول الزامی است']
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  notifyOnDiscount: {
    type: Boolean,
    default: false
  },
  notifyOnAvailable: {
    type: Boolean,
    default: false
  },
  targetPrice: {
    type: Number,
    min: 0
  }
});

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'کاربر الزامی است'],
    unique: true
  },
  items: [wishlistItemSchema],
  isPublic: {
    type: Boolean,
    default: false
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
wishlistSchema.index({ user: 1 });
wishlistSchema.index({ 'items.product': 1 });
wishlistSchema.index({ shareToken: 1 });

// Virtual for items count
wishlistSchema.virtual('itemsCount').get(function() {
  return this.items.length;
});

// Generate share token
wishlistSchema.methods.generateShareToken = function() {
  const crypto = require('crypto');
  this.shareToken = crypto.randomBytes(16).toString('hex');
  this.isPublic = true;
  return this.shareToken;
};

// Check if product exists in wishlist
wishlistSchema.methods.hasProduct = function(productId) {
  return this.items.some(item => item.product.toString() === productId.toString());
};

// Get items sorted by date
wishlistSchema.methods.getSortedItems = function(order = 'desc') {
  return this.items.sort((a, b) => {
    if (order === 'desc') {
      return b.addedAt - a.addedAt;
    }
    return a.addedAt - b.addedAt;
  });
};

// Get items by category
wishlistSchema.methods.getItemsByCategory = async function() {
  await this.populate({
    path: 'items.product',
    populate: {
      path: 'category',
      select: 'name slug'
    }
  });
  
  const categoryMap = new Map();
  
  this.items.forEach(item => {
    if (item.product && item.product.category) {
      const categoryId = item.product.category._id.toString();
      const categoryName = item.product.category.name;
      
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          id: categoryId,
          name: categoryName,
          items: []
        });
      }
      
      categoryMap.get(categoryId).items.push(item);
    }
  });
  
  return Array.from(categoryMap.values());
};

// Check for price drops
wishlistSchema.methods.checkPriceDrops = async function() {
  const Product = mongoose.model('Product');
  const priceDrops = [];
  
  for (const item of this.items) {
    const product = await Product.findById(item.product);
    
    if (product) {
      // Check if price dropped below target price
      if (item.targetPrice && product.finalPrice <= item.targetPrice) {
        priceDrops.push({
          product,
          targetPrice: item.targetPrice,
          currentPrice: product.finalPrice,
          discount: product.discount
        });
      }
      // Check if product has new discount
      else if (item.notifyOnDiscount && product.discount > 0) {
        priceDrops.push({
          product,
          currentPrice: product.finalPrice,
          discount: product.discount
        });
      }
    }
  }
  
  return priceDrops;
};

// Check for available products
wishlistSchema.methods.checkAvailability = async function() {
  const Product = mongoose.model('Product');
  const nowAvailable = [];
  
  for (const item of this.items) {
    if (item.notifyOnAvailable) {
      const product = await Product.findById(item.product);
      
      if (product && product.inStock && product.stock.quantity > 0) {
        nowAvailable.push(product);
      }
    }
  }
  
  return nowAvailable;
};

// Clean up deleted products
wishlistSchema.methods.cleanup = async function() {
  const Product = mongoose.model('Product');
  const validItems = [];
  
  for (const item of this.items) {
    const product = await Product.findById(item.product);
    if (product) {
      validItems.push(item);
    }
  }
  
  if (validItems.length !== this.items.length) {
    this.items = validItems;
    await this.save();
  }
  
  return this.items.length - validItems.length; // Return number of removed items
};

// Static methods
wishlistSchema.statics = {
  // Get popular products from all wishlists
  async getPopularProducts(limit = 10) {
    const result = await this.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          product: 1,
          wishlistCount: '$count'
        }
      }
    ]);
    
    return result;
  },
  
  // Get public wishlists
  async getPublicWishlists(limit = 10) {
    return this.find({ isPublic: true })
      .populate('user', 'name')
      .populate('items.product', 'name price images')
      .sort('-updatedAt')
      .limit(limit);
  },
  
  // Find by share token
  async findByShareToken(token) {
    return this.findOne({ shareToken: token, isPublic: true })
      .populate('user', 'name')
      .populate({
        path: 'items.product',
        select: 'name price discount images rating category',
        populate: {
          path: 'category',
          select: 'name slug'
        }
      });
  }
};

// Middleware to limit wishlist size
wishlistSchema.pre('save', function(next) {
  const MAX_WISHLIST_SIZE = 100;
  
  if (this.items.length > MAX_WISHLIST_SIZE) {
    next(new Error(`لیست علاقه‌مندی نمی‌تواند بیش از ${MAX_WISHLIST_SIZE} محصول داشته باشد`));
  } else {
    next();
  }
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;