const Product = require('../models/Product');
const Category = require('../models/Category');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

class SearchController {
  // Advanced product search
  searchProducts = catchAsync(async (req, res, next) => {
    const {
      q,
      category,
      subcategory,
      brand,
      minPrice,
      maxPrice,
      minRating,
      discount,
      inStock,
      features,
      tags,
      sort = 'relevance',
      page = 1,
      limit = 20
    } = req.query;

    // Build search query
    let query = { status: 'active' };

    // Text search
    if (q) {
      query.$or = [
        { $text: { $search: q } },
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { tags: { $in: q.split(' ').map(tag => new RegExp(tag, 'i')) } }
      ];
    }

    // Category filter
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        const categoryIds = [categoryDoc._id];
        // Include subcategories
        const subcategories = await Category.find({ parent: categoryDoc._id });
        categoryIds.push(...subcategories.map(cat => cat._id));
        query.category = { $in: categoryIds };
      }
    }

    // Subcategory filter
    if (subcategory) {
      const subcategoryDoc = await Category.findOne({ slug: subcategory });
      if (subcategoryDoc) {
        query.category = subcategoryDoc._id;
      }
    }

    // Brand filter
    if (brand) {
      query.brand = { $in: Array.isArray(brand) ? brand : [brand] };
    }

    // Price range
    if (minPrice || maxPrice) {
      query.finalPrice = {};
      if (minPrice) query.finalPrice.$gte = parseInt(minPrice);
      if (maxPrice) query.finalPrice.$lte = parseInt(maxPrice);
    }

    // Rating filter
    if (minRating) {
      query['rating.average'] = { $gte: parseFloat(minRating) };
    }

    // Discount filter
    if (discount) {
      if (discount === 'any') {
        query.discount = { $gt: 0 };
      } else {
        query.discount = { $gte: parseInt(discount) };
      }
    }

    // Stock filter
    if (inStock === 'true') {
      query.inStock = true;
    }

    // Features filter
    if (features) {
      const featureFilters = Array.isArray(features) ? features : [features];
      query.features = { $all: featureFilters };
    }

    // Tags filter
    if (tags) {
      const tagFilters = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagFilters };
    }

    // Build sort options
    let sortOption = {};
    switch (sort) {
      case 'price-asc':
        sortOption = { finalPrice: 1 };
        break;
      case 'price-desc':
        sortOption = { finalPrice: -1 };
        break;
      case 'rating':
        sortOption = { 'rating.average': -1, 'rating.count': -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'bestseller':
        sortOption = { 'stock.sold': -1 };
        break;
      case 'discount':
        sortOption = { discount: -1 };
        break;
      case 'relevance':
      default:
        if (q) {
          sortOption = { score: { $meta: 'textScore' } };
        } else {
          sortOption = { featured: -1, 'rating.average': -1 };
        }
    }

    // Execute search with pagination
    const skip = (page - 1) * limit;
    
    // Get products
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOption)
      .skip(skip)
      .limit(limit * 1)
      .select('-reviews');

    // Get total count
    const total = await Product.countDocuments(query);

    // Get aggregations for filters
    const aggregations = await this.getSearchAggregations(query);

    res.status(200).json({
      success: true,
      results: products.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      products,
      aggregations
    });
  });

  // Get search suggestions
  getSearchSuggestions = catchAsync(async (req, res, next) => {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(200).json({
        success: true,
        suggestions: []
      });
    }

    // Get product suggestions
    const productSuggestions = await Product.find({
      status: 'active',
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    })
    .limit(5)
    .select('name brand price finalPrice images')
    .lean();

    // Get category suggestions
    const categorySuggestions = await Category.find({
      name: { $regex: q, $options: 'i' },
      isActive: true
    })
    .limit(3)
    .select('name slug')
    .lean();

    // Get popular search terms
    const popularSearches = await this.getPopularSearches(q);

    res.status(200).json({
      success: true,
      suggestions: {
        products: productSuggestions,
        categories: categorySuggestions,
        searches: popularSearches
      }
    });
  });

  // Get search aggregations for filters
  async getSearchAggregations(baseQuery) {
    const aggregations = await Product.aggregate([
      { $match: baseQuery },
      {
        $facet: {
          brands: [
            { $group: { _id: '$brand', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          priceRanges: [
            {
              $bucket: {
                groupBy: '$finalPrice',
                boundaries: [0, 100000, 500000, 1000000, 5000000, 10000000, 50000000],
                default: 'above',
                output: { count: { $sum: 1 } }
              }
            }
          ],
          ratings: [
            {
              $bucket: {
                groupBy: '$rating.average',
                boundaries: [0, 1, 2, 3, 4, 5],
                default: 'unrated',
                output: { count: { $sum: 1 } }
              }
            }
          ],
          discounts: [
            {
              $group: {
                _id: {
                  $cond: [
                    { $eq: ['$discount', 0] },
                    'no-discount',
                    {
                      $cond: [
                        { $lte: ['$discount', 20] },
                        'up-to-20',
                        {
                          $cond: [
                            { $lte: ['$discount', 50] },
                            'up-to-50',
                            'above-50'
                          ]
                        }
                      ]
                    }
                  ]
                },
                count: { $sum: 1 }
              }
            }
          ],
          features: [
            { $unwind: '$features' },
            { $group: { _id: '$features', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 }
          ]
        }
      }
    ]);

    return aggregations[0];
  }

  // Get popular searches
  async getPopularSearches(query) {
    // In a real implementation, you would track search queries
    // and return the most popular ones
    const popularSearches = [
      'هدفون',
      'پاوربانک',
      'کیف چرم',
      'ساعت هوشمند',
      'موس گیمینگ'
    ];

    return popularSearches
      .filter(search => search.includes(query))
      .slice(0, 5);
  }

  // Search filters
  getSearchFilters = catchAsync(async (req, res, next) => {
    const { category } = req.query;

    let categoryFilter = {};
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        const categoryIds = [categoryDoc._id];
        const subcategories = await Category.find({ parent: categoryDoc._id });
        categoryIds.push(...subcategories.map(cat => cat._id));
        categoryFilter = { category: { $in: categoryIds } };
      }
    }

    // Get all available filters
    const filters = await Product.aggregate([
      { $match: { status: 'active', ...categoryFilter } },
      {
        $facet: {
          brands: [
            { $group: { _id: '$brand', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          categories: [
            {
              $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'categoryInfo'
              }
            },
            { $unwind: '$categoryInfo' },
            {
              $group: {
                _id: {
                  id: '$categoryInfo._id',
                  name: '$categoryInfo.name',
                  slug: '$categoryInfo.slug'
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } }
          ],
          priceRange: [
            {
              $group: {
                _id: null,
                minPrice: { $min: '$finalPrice' },
                maxPrice: { $max: '$finalPrice' }
              }
            }
          ],
          features: [
            { $unwind: '$features' },
            { $group: { _id: '$features', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          tags: [
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 }
          ]
        }
      }
    ]);

    res.status(200).json({
      success: true,
      filters: filters[0]
    });
  });

  // Barcode search
  searchByBarcode = catchAsync(async (req, res, next) => {
    const { barcode } = req.params;

    const product = await Product.findOne({
      barcode,
      status: 'active'
    }).populate('category', 'name slug');

    if (!product) {
      return next(new AppError('محصولی با این بارکد یافت نشد', 404));
    }

    res.status(200).json({
      success: true,
      product
    });
  });

  // Voice search (process transcribed text)
  voiceSearch = catchAsync(async (req, res, next) => {
    const { transcript } = req.body;

    if (!transcript) {
      return next(new AppError('متن جستجو الزامی است', 400));
    }

    // Process voice search query
    const processedQuery = this.processVoiceQuery(transcript);

    // Redirect to regular search
    req.query.q = processedQuery;
    return this.searchProducts(req, res, next);
  });

  // Process voice query
  processVoiceQuery(transcript) {
    // Remove common voice command words in Persian
    const removeWords = ['پیدا کن', 'جستجو کن', 'دنبال', 'میخوام', 'نشون بده'];
    let processed = transcript.toLowerCase();
    
    removeWords.forEach(word => {
      processed = processed.replace(word, '');
    });

    return processed.trim();
  }

  // Visual search (search by image)
  visualSearch = catchAsync(async (req, res, next) => {
    // This would integrate with an image recognition service
    // For now, we'll return a placeholder response
    
    if (!req.file) {
      return next(new AppError('تصویر الزامی است', 400));
    }

    // In a real implementation:
    // 1. Process image with ML service
    // 2. Extract features/labels
    // 3. Search products by extracted features

    res.status(200).json({
      success: true,
      message: 'جستجوی تصویری در حال توسعه است',
      products: []
    });
  });
}

module.exports = new SearchController();