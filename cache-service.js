const redis = require('redis');
const { promisify } = require('util');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hour
    this.connect();
  }
  
  // Connect to Redis
  async connect() {
    try {
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('Redis connection refused');
            return new Error('Redis connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Redis retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });
      
      // Promisify Redis methods
      this.getAsync = promisify(this.client.get).bind(this.client);
      this.setAsync = promisify(this.client.set).bind(this.client);
      this.delAsync = promisify(this.client.del).bind(this.client);
      this.existsAsync = promisify(this.client.exists).bind(this.client);
      this.expireAsync = promisify(this.client.expire).bind(this.client);
      this.ttlAsync = promisify(this.client.ttl).bind(this.client);
      this.keysAsync = promisify(this.client.keys).bind(this.client);
      this.mgetAsync = promisify(this.client.mget).bind(this.client);
      this.msetAsync = promisify(this.client.mset).bind(this.client);
      this.incrAsync = promisify(this.client.incr).bind(this.client);
      this.decrAsync = promisify(this.client.decr).bind(this.client);
      this.hgetAsync = promisify(this.client.hget).bind(this.client);
      this.hsetAsync = promisify(this.client.hset).bind(this.client);
      this.hgetallAsync = promisify(this.client.hgetall).bind(this.client);
      this.hdelAsync = promisify(this.client.hdel).bind(this.client);
      this.zaddAsync = promisify(this.client.zadd).bind(this.client);
      this.zrangeAsync = promisify(this.client.zrange).bind(this.client);
      this.zremAsync = promisify(this.client.zrem).bind(this.client);
      
      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('✅ Redis connected successfully');
      });
      
      this.client.on('error', (err) => {
        this.isConnected = false;
        console.error('❌ Redis error:', err);
      });
      
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.isConnected = false;
    }
  }
  
  // Check if Redis is connected
  isReady() {
    return this.isConnected && this.client && this.client.connected;
  }
  
  // Get cached data
  async get(key) {
    if (!this.isReady()) return null;
    
    try {
      const data = await this.getAsync(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }
  
  // Set cache data
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isReady()) return false;
    
    try {
      const serialized = JSON.stringify(value);
      await this.setAsync(key, serialized, 'EX', ttl);
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }
  
  // Delete cache
  async del(key) {
    if (!this.isReady()) return false;
    
    try {
      await this.delAsync(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }
  
  // Delete multiple keys by pattern
  async delByPattern(pattern) {
    if (!this.isReady()) return false;
    
    try {
      const keys = await this.keysAsync(pattern);
      if (keys.length > 0) {
        await this.delAsync(...keys);
      }
      return true;
    } catch (error) {
      console.error(`Cache delete by pattern error for ${pattern}:`, error);
      return false;
    }
  }
  
  // Check if key exists
  async exists(key) {
    if (!this.isReady()) return false;
    
    try {
      const exists = await this.existsAsync(key);
      return exists === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }
  
  // Get TTL for key
  async ttl(key) {
    if (!this.isReady()) return -1;
    
    try {
      return await this.ttlAsync(key);
    } catch (error) {
      console.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }
  
  // Increment counter
  async incr(key) {
    if (!this.isReady()) return null;
    
    try {
      return await this.incrAsync(key);
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return null;
    }
  }
  
  // Decrement counter
  async decr(key) {
    if (!this.isReady()) return null;
    
    try {
      return await this.decrAsync(key);
    } catch (error) {
      console.error(`Cache decrement error for key ${key}:`, error);
      return null;
    }
  }
  
  // Hash operations
  async hget(key, field) {
    if (!this.isReady()) return null;
    
    try {
      const data = await this.hgetAsync(key, field);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Cache hget error for key ${key}, field ${field}:`, error);
      return null;
    }
  }
  
  async hset(key, field, value, ttl = this.defaultTTL) {
    if (!this.isReady()) return false;
    
    try {
      await this.hsetAsync(key, field, JSON.stringify(value));
      await this.expireAsync(key, ttl);
      return true;
    } catch (error) {
      console.error(`Cache hset error for key ${key}, field ${field}:`, error);
      return false;
    }
  }
  
  async hgetall(key) {
    if (!this.isReady()) return null;
    
    try {
      const data = await this.hgetallAsync(key);
      if (!data) return null;
      
      const parsed = {};
      for (const [field, value] of Object.entries(data)) {
        parsed[field] = JSON.parse(value);
      }
      return parsed;
    } catch (error) {
      console.error(`Cache hgetall error for key ${key}:`, error);
      return null;
    }
  }
  
  // Sorted set operations (for rankings, etc.)
  async zadd(key, score, member, ttl = this.defaultTTL) {
    if (!this.isReady()) return false;
    
    try {
      await this.zaddAsync(key, score, member);
      await this.expireAsync(key, ttl);
      return true;
    } catch (error) {
      console.error(`Cache zadd error for key ${key}:`, error);
      return false;
    }
  }
  
  async zrange(key, start, stop, withScores = false) {
    if (!this.isReady()) return [];
    
    try {
      const args = withScores ? [key, start, stop, 'WITHSCORES'] : [key, start, stop];
      return await this.zrangeAsync(...args);
    } catch (error) {
      console.error(`Cache zrange error for key ${key}:`, error);
      return [];
    }
  }
  
  // Cache wrapper for async functions
  async cache(key, fn, ttl = this.defaultTTL) {
    // Try to get from cache
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }
    
    // Execute function and cache result
    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }
  
  // Specific cache methods for common use cases
  
  // Cache product data
  async cacheProduct(productId, productData, ttl = 3600) {
    const key = `product:${productId}`;
    return this.set(key, productData, ttl);
  }
  
  async getCachedProduct(productId) {
    const key = `product:${productId}`;
    return this.get(key);
  }
  
  async invalidateProduct(productId) {
    const key = `product:${productId}`;
    await this.del(key);
    // Also invalidate related caches
    await this.delByPattern(`products:*`);
    await this.delByPattern(`category:*:products`);
  }
  
  // Cache user session
  async cacheSession(sessionId, sessionData, ttl = 86400) { // 24 hours
    const key = `session:${sessionId}`;
    return this.set(key, sessionData, ttl);
  }
  
  async getSession(sessionId) {
    const key = `session:${sessionId}`;
    return this.get(key);
  }
  
  // Cache search results
  async cacheSearchResults(query, results, ttl = 1800) { // 30 minutes
    const key = `search:${Buffer.from(query).toString('base64')}`;
    return this.set(key, results, ttl);
  }
  
  async getSearchResults(query) {
    const key = `search:${Buffer.from(query).toString('base64')}`;
    return this.get(key);
  }
  
  // Rate limiting
  async checkRateLimit(identifier, limit = 100, window = 3600) {
    const key = `ratelimit:${identifier}`;
    const current = await this.incr(key);
    
    if (current === 1) {
      await this.expireAsync(key, window);
    }
    
    return {
      allowed: current <= limit,
      current,
      limit,
      remaining: Math.max(0, limit - current),
      resetIn: await this.ttl(key)
    };
  }
  
  // Cache statistics
  async getCacheStats() {
    if (!this.isReady()) return null;
    
    try {
      const info = await promisify(this.client.info).bind(this.client)();
      const stats = {};
      
      // Parse Redis INFO output
      info.split('\r\n').forEach(line => {
        if (line && line.includes(':')) {
          const [key, value] = line.split(':');
          stats[key] = value;
        }
      });
      
      return {
        connected: this.isConnected,
        used_memory: stats.used_memory_human,
        connected_clients: stats.connected_clients,
        total_commands_processed: stats.total_commands_processed,
        keyspace_hits: stats.keyspace_hits,
        keyspace_misses: stats.keyspace_misses,
        hit_rate: stats.keyspace_hits && stats.keyspace_misses
          ? (stats.keyspace_hits / (parseInt(stats.keyspace_hits) + parseInt(stats.keyspace_misses)) * 100).toFixed(2) + '%'
          : 'N/A'
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return null;
    }
  }
  
  // Clear all cache (use with caution!)
  async flushAll() {
    if (!this.isReady()) return false;
    
    try {
      await promisify(this.client.flushall).bind(this.client)();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }
  
  // Close connection
  close() {
    if (this.client) {
      this.client.quit();
      this.isConnected = false;
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

module.exports = cacheService;