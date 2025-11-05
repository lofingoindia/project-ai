// Enhanced query cache with batch operations
class QueryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl = this.DEFAULT_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern?: string) {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

export const queryCache = new QueryCache();

// Optimized query helpers
export const createCachedQuery = (
  queryFn: () => Promise<any>,
  cacheKey: string,
  ttl?: number
) => {
  return async () => {
    // Check cache first
    const cached = queryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Execute query and cache result
    const result = await queryFn();
    queryCache.set(cacheKey, result, ttl);
    return result;
  };
};

// Batch query helper for parallel execution
export const batchQueries = async (queries: Array<{ key: string; fn: () => Promise<any>; ttl?: number }>) => {
  const results: Record<string, any> = {};
  
  // Separate cached and uncached queries
  const uncachedQueries: typeof queries = [];
  
  for (const query of queries) {
    const cached = queryCache.get(query.key);
    if (cached) {
      results[query.key] = cached;
    } else {
      uncachedQueries.push(query);
    }
  }

  // Execute uncached queries in parallel
  if (uncachedQueries.length > 0) {
    const promises = uncachedQueries.map(async (query) => {
      try {
        const result = await query.fn();
        queryCache.set(query.key, result, query.ttl);
        return { key: query.key, result };
      } catch (error) {
        console.error(`Query failed for ${query.key}:`, error);
        return { key: query.key, result: null };
      }
    });

    const freshResults = await Promise.all(promises);
    freshResults.forEach(({ key, result }) => {
      if (result !== null) {
        results[key] = result;
      }
    });
  }

  return results;
};