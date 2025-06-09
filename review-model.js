const mongoose = require('mongoose');
const Product = require('./Product');

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: [true, 'محصول الزامی است']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'کاربر الزامی است']
  },
  rating: {
    type: Number,
    min: [1, 'امتیاز باید حداقل 1 باشد'],
    max: [5, 'امتیاز باید حداکثر 5 باشد'],
    required: [true, 'امتیاز الزامی است']
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'عنوان نباید بیشتر از 100 کاراکتر باشد']
  },
  comment: {
    type: String,
    required: [true, 'متن نظر الزامی است'],
    trim: true,
    minlength: [10, 'نظر باید حداقل 10 کاراکتر باشد'],
    maxlength: [1000, 'نظر نباید بیشتر از 1000 کاراکتر باشد']
  },
  pros: [{
    type: String,
    trim: true,
    maxlength: [100, 'هر مورد نباید بیشتر از 100 کاراکتر باشد']
  }],
  cons: [{
    type: String,
    trim: true,
    maxlength: [100, 'هر مورد نباید بیشتر از 100 کاراکتر باشد']
  }],
  images: [{
    type: String
  }],
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  helpful: {
    type: Number,
    default: 0
  },
  helpfulVotes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'hidden'],
    default: 'pending'
  },
  rejectionReason: {
    type: String
  },
  reports: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'fake', 'offensive', 'other']
    },
    description: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  editedAt: {
    type: Date
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, status: 1, rating: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ helpful: -1 });

// Virtual for user display name
reviewSchema.virtual('displayName').get(function() {
  if (this.user && this.user.name) {
    const nameParts = this.user.name.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`;
    }
    return nameParts[0];
  }
  return 'کاربر';
});

// Check if review is editable
reviewSchema.virtual('isEditable').get(function() {
  // Can edit within 7 days of creation
  const daysSinceCreation = Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
  return daysSinceCreation <= 7 && this.status !== 'approved';
});

// Static method to calculate product rating
reviewSchema.statics.calcAverageRatings = async function(productId) {
  const stats = await this.aggregate([
    {
      $match: { 
        product: productId,
        status: 'approved'
      }
    },
    {
      $group: {
        _id: '$product',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      'rating.average': Math.round(stats[0].avgRating * 10) / 10,
      'rating.count': stats[0].nRating
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      'rating.average': 0,
      'rating.count': 0
    });
  }
};

// Update product rating after save
reviewSchema.post('save', async function() {
  if (this.status === 'approved') {
    await this.constructor.calcAverageRatings(this.product);
  }
});

// Update product rating after remove
reviewSchema.post('remove', async function() {
  if (this.status === 'approved') {
    await this.constructor.calcAverageRatings(this.product);
  }
});

// Instance methods
reviewSchema.methods = {
  // Approve review
  async approve(adminId) {
    this.status = 'approved';
    this.approvedAt = new Date();
    this.approvedBy = adminId;
    await this.save();
    
    // Update product rating
    await this.constructor.calcAverageRatings(this.product);
    
    return this;
  },
  
  // Reject review
  async reject(reason, adminId) {
    this.status = 'rejected';
    this.rejectionReason = reason;
    this.approvedAt = new Date();
    this.approvedBy = adminId;
    await this.save();
    
    return this;
  },
  
  // Hide review
  async hide() {
    const previousStatus = this.status;
    this.status = 'hidden';
    await this.save();
    
    // Update product rating if was approved
    if (previousStatus === 'approved') {
      await this.constructor.calcAverageRatings(this.product);
    }
    
    return this;
  }
};

// Static methods
reviewSchema.statics = {
  // Get review statistics for a product
  async getProductStats(productId) {
    const stats = await this.aggregate([
      {
        $match: { 
          product: mongoose.Types.ObjectId(productId),
          status: 'approved'
        }
      },
      {
        $facet: {
          overview: [
            {
              $group: {
                _id: null,
                totalReviews: { $sum: 1 },
                avgRating: { $avg: '$rating' },
                verifiedPurchases: {
                  $sum: { $cond: ['$isVerifiedPurchase', 1, 0] }
                }
              }
            }
          ],
          distribution: [
            {
              $group: {
                _id: '$rating',
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: -1 } }
          ],
          recent: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'user'
              }
            },
            { $unwind: '$user' },
            {
              $project: {
                rating: 1,
                title: 1,
                comment: 1,
                createdAt: 1,
                'user.name': 1
              }
            }
          ]
        }
      }
    ]);
    
    return stats[0];
  },
  
  // Get top reviewers
  async getTopReviewers(limit = 10) {
    return this.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$user',
          reviewCount: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          totalHelpful: { $sum: '$helpful' }
        }
      },
      { $sort: { totalHelpful: -1, reviewCount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          'user.name': 1,
          'user.avatar': 1,
          reviewCount: 1,
          avgRating: 1,
          totalHelpful: 1
        }
      }
    ]);
  },
  
  // Get pending reviews count
  async getPendingCount() {
    return this.countDocuments({ status: 'pending' });
  }
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;