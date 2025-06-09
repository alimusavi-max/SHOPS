const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'نام دسته‌بندی الزامی است'],
    unique: true,
    trim: true,
    maxlength: [50, 'نام دسته‌بندی نباید بیشتر از 50 کاراکتر باشد']
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    maxlength: [500, 'توضیحات نباید بیشتر از 500 کاراکتر باشد']
  },
  parent: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    default: null
  },
  image: {
    type: String,
    default: null
  },
  icon: {
    type: String,
    default: null
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  productsCount: {
    type: Number,
    default: 0
  },
  metaTitle: {
    type: String,
    maxlength: [60, 'عنوان متا نباید بیشتر از 60 کاراکتر باشد']
  },
  metaDescription: {
    type: String,
    maxlength: [160, 'توضیحات متا نباید بیشتر از 160 کاراکتر باشد']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ order: 1 });
categorySchema.index({ isActive: 1 });

// Virtual for children categories
categorySchema.virtual('children', {
  ref: 'Category',
  foreignField: 'parent',
  localField: '_id'
});

// Virtual for products
categorySchema.virtual('products', {
  ref: 'Product',
  foreignField: 'category',
  localField: '_id'
});

// Virtual for breadcrumb
categorySchema.virtual('breadcrumb').get(async function() {
  const breadcrumb = [];
  let current = this;
  
  while (current) {
    breadcrumb.unshift({
      id: current._id,
      name: current.name,
      slug: current.slug
    });
    
    if (current.parent) {
      current = await this.constructor.findById(current.parent);
    } else {
      current = null;
    }
  }
  
  return breadcrumb;
});

// Generate slug before save
categorySchema.pre('save', function(next) {
  if (!this.isModified('name')) return next();
  
  this.slug = slugify(this.name, {
    replacement: '-',
    lower: true,
    strict: true,
    locale: 'fa'
  });
  
  // Generate meta tags if not provided
  if (!this.metaTitle) {
    this.metaTitle = this.name;
  }
  
  if (!this.metaDescription) {
    this.metaDescription = this.description || `دسته‌بندی ${this.name} - فروشگاه آنلاین`;
  }
  
  next();
});

// Update products count
categorySchema.methods.updateProductsCount = async function() {
  const Product = mongoose.model('Product');
  
  // Count direct products
  const directCount = await Product.countDocuments({ 
    category: this._id,
    status: 'active'
  });
  
  // Count products in subcategories
  const subcategories = await this.constructor.find({ parent: this._id });
  let totalCount = directCount;
  
  for (const subcat of subcategories) {
    const subcatCount = await Product.countDocuments({ 
      category: subcat._id,
      status: 'active'
    });
    totalCount += subcatCount;
  }
  
  this.productsCount = totalCount;
  await this.save();
  
  return totalCount;
};

// Get all parent IDs
categorySchema.methods.getParentIds = async function() {
  const parentIds = [];
  let current = this;
  
  while (current.parent) {
    parentIds.push(current.parent);
    current = await this.constructor.findById(current.parent);
    if (!current) break;
  }
  
  return parentIds;
};

// Get all children IDs (recursive)
categorySchema.methods.getChildrenIds = async function() {
  const childrenIds = [];
  
  const getChildren = async (parentId) => {
    const children = await this.constructor.find({ parent: parentId });
    
    for (const child of children) {
      childrenIds.push(child._id);
      await getChildren(child._id);
    }
  };
  
  await getChildren(this._id);
  return childrenIds;
};

// Check if category is parent of another
categorySchema.methods.isParentOf = async function(categoryId) {
  const childrenIds = await this.getChildrenIds();
  return childrenIds.some(id => id.toString() === categoryId.toString());
};

// Static method to get featured categories
categorySchema.statics.getFeatured = function(limit = 6) {
  return this.find({ 
    isFeatured: true, 
    isActive: true,
    parent: null // Only top-level categories
  })
  .sort('order name')
  .limit(limit);
};

// Static method to build category tree
categorySchema.statics.buildTree = async function() {
  const categories = await this.find({ isActive: true }).lean();
  
  const buildHierarchy = (parentId = null) => {
    return categories
      .filter(cat => {
        if (parentId === null) {
          return !cat.parent;
        }
        return cat.parent && cat.parent.toString() === parentId.toString();
      })
      .map(cat => ({
        ...cat,
        children: buildHierarchy(cat._id)
      }))
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  };
  
  return buildHierarchy();
};

// Prevent deletion if has children or products
categorySchema.pre('remove', async function(next) {
  // Check for children
  const childrenCount = await this.constructor.countDocuments({ parent: this._id });
  if (childrenCount > 0) {
    throw new Error('دسته‌بندی دارای زیرمجموعه است و قابل حذف نیست');
  }
  
  // Check for products
  const Product = mongoose.model('Product');
  const productsCount = await Product.countDocuments({ category: this._id });
  if (productsCount > 0) {
    throw new Error('دسته‌بندی دارای محصول است و قابل حذف نیست');
  }
  
  next();
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;