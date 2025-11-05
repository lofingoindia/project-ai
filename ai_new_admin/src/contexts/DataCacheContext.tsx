import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import { db } from '../lib/supabase';
import { queryCache } from '../lib/queryCache';
import type { Order, Customer, Category, Product, DashboardStats } from '../types';

interface DataState {
  // Cache data
  orders: Order[];
  customers: Customer[];
  categories: Category[];
  products: Product[];
  dashboardStats: DashboardStats;
  
  // Loading states
  loading: {
    orders: boolean;
    customers: boolean;
    categories: boolean;
    products: boolean;
    dashboard: boolean;
  };
  
  // Last fetch timestamps
  lastFetch: {
    orders: number;
    customers: number;
    categories: number;
    products: number;
    dashboard: number;
  };
  
  // Error states
  errors: {
    orders: string | null;
    customers: string | null;
    categories: string | null;
    products: string | null;
    dashboard: string | null;
  };
}

type DataAction = 
  | { type: 'SET_LOADING'; payload: { key: keyof DataState['loading']; value: boolean } }
  | { type: 'SET_DATA'; payload: { key: keyof Omit<DataState, 'loading' | 'lastFetch' | 'errors'>; value: any } }
  | { type: 'SET_ERROR'; payload: { key: keyof DataState['errors']; value: string | null } }
  | { type: 'SET_LAST_FETCH'; payload: { key: keyof DataState['lastFetch']; value: number } };

const initialState: DataState = {
  orders: [],
  customers: [],
  categories: [],
  products: [],
  dashboardStats: {
    total_users: 0,
    total_books: 0,
    total_orders: 0,
    total_revenue: 0,
    total_categories: 0
  },
  loading: {
    orders: false,
    customers: false,
    categories: false,
    products: false,
    dashboard: false,
  },
  lastFetch: {
    orders: 0,
    customers: 0,
    categories: 0,
    products: 0,
    dashboard: 0,
  },
  errors: {
    orders: null,
    customers: null,
    categories: null,
    products: null,
    dashboard: null,
  }
};

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value
        }
      };
    case 'SET_DATA':
      return {
        ...state,
        [action.payload.key]: action.payload.value
      };
    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.value
        }
      };
    case 'SET_LAST_FETCH':
      return {
        ...state,
        lastFetch: {
          ...state.lastFetch,
          [action.payload.key]: action.payload.value
        }
      };
    default:
      return state;
  }
}

interface DataContextType {
  state: DataState;
  actions: {
    fetchOrders: (force?: boolean) => Promise<void>;
    fetchCustomers: (force?: boolean) => Promise<void>;
    fetchCategories: (force?: boolean) => Promise<void>;
    fetchProducts: (force?: boolean) => Promise<void>;
    fetchDashboardStats: (force?: boolean) => Promise<void>;
    updateOrderStatus: (orderId: string, newStatus: string) => Promise<void>;
    refreshAll: () => Promise<void>;
    clearCache: () => void;
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useDataCache = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataCache must be used within a DataCacheProvider');
  }
  return context;
};

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

interface DataCacheProviderProps {
  children: ReactNode;
}

export const DataCacheProvider: React.FC<DataCacheProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  const isCacheValid = (key: keyof DataState['lastFetch']) => {
    const lastFetch = state.lastFetch[key];
    return Date.now() - lastFetch < CACHE_DURATION;
  };

  const setLoading = (key: keyof DataState['loading'], value: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: { key, value } });
  };

  const setData = (key: keyof Omit<DataState, 'loading' | 'lastFetch' | 'errors'>, value: any) => {
    dispatch({ type: 'SET_DATA', payload: { key, value } });
  };

  const setError = (key: keyof DataState['errors'], value: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: { key, value } });
  };

  const setLastFetch = (key: keyof DataState['lastFetch'], value: number) => {
    dispatch({ type: 'SET_LAST_FETCH', payload: { key, value } });
  };

  const fetchOrders = async (force = false) => {
    if (!force && isCacheValid('orders') && state.orders.length > 0) {
      return;
    }

    try {
      setLoading('orders', true);
      setError('orders', null);
      
      // Fetch with pagination to limit initial load size
      const { data } = await db.getOrders(1, 50); // Limit to 50 most recent orders
      setData('orders', data || []);
      setLastFetch('orders', Date.now());
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('orders', error instanceof Error ? error.message : 'Failed to fetch orders');
    } finally {
      setLoading('orders', false);
    }
  };

  const fetchCustomers = async (force = false) => {
    if (!force && isCacheValid('customers') && state.customers.length > 0) {
      return;
    }

    try {
      setLoading('customers', true);
      setError('customers', null);
      
      // Fetch with pagination to limit initial load size  
      const { data } = await db.getCustomers(1, 50); // Limit to 50 most recent customers
      
      // Transform the data to match Customer interface
      const transformedCustomers = (data || []).map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.full_name || 'Unknown User',
        phone: user.phone || '',
        address: '',
        city: '',
        country: '',
        total_orders: user.order_count || 0,
        total_spent: 0,
        status: 'active',
        created_at: user.created_at,
        updated_at: user.created_at
      }));
      
      setData('customers', transformedCustomers);
      setLastFetch('customers', Date.now());
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('customers', error instanceof Error ? error.message : 'Failed to fetch customers');
    } finally {
      setLoading('customers', false);
    }
  };

  const fetchCategories = async (force = false) => {
    if (!force && isCacheValid('categories') && state.categories.length > 0) {
      return;
    }

    try {
      setLoading('categories', true);
      setError('categories', null);
      
      const data = await db.getCategories();
      setData('categories', data || []);
      setLastFetch('categories', Date.now());
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('categories', error instanceof Error ? error.message : 'Failed to fetch categories');
    } finally {
      setLoading('categories', false);
    }
  };

  const fetchProducts = async (force = false) => {
    if (!force && isCacheValid('products') && state.products.length > 0) {
      return;
    }

    try {
      setLoading('products', true);
      setError('products', null);
      
      const data = await db.getProducts();
      setData('products', (data || []) as Product[]);
      setLastFetch('products', Date.now());
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('products', error instanceof Error ? error.message : 'Failed to fetch products');
    } finally {
      setLoading('products', false);
    }
  };

  const fetchDashboardStats = async (force = false) => {
    if (!force && isCacheValid('dashboard')) {
      return;
    }

    try {
      setLoading('dashboard', true);
      setError('dashboard', null);
      
      const stats = await db.getDashboardStats();
      setData('dashboardStats', stats);
      setLastFetch('dashboard', Date.now());
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('dashboard', error instanceof Error ? error.message : 'Failed to fetch dashboard stats');
    } finally {
      setLoading('dashboard', false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([
      fetchOrders(true),
      fetchCustomers(true),
      fetchCategories(true),
      fetchProducts(true),
      fetchDashboardStats(true)
    ]);
  };

  const clearCache = () => {
    setData('orders', []);
    setData('customers', []);
    setData('categories', []);
    setData('products', []);
    setData('dashboardStats', initialState.dashboardStats);
    
    // Reset timestamps
    Object.keys(state.lastFetch).forEach(key => {
      setLastFetch(key as keyof DataState['lastFetch'], 0);
    });
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await db.updateOrderStatus(orderId, newStatus);
      
      // Update the order in the local state immediately for better UX
      const updatedOrders = state.orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus as any, updated_at: new Date().toISOString() }
          : order
      );
      setData('orders', updatedOrders);
      
      // Invalidate only orders cache, not everything
      queryCache.invalidate('orders-');
      
      // Optional: refresh specific order data after a short delay
      setTimeout(() => {
        fetchOrders(true);
      }, 500);
      
    } catch (error) {
      console.error('Error updating order status in context:', error);
      throw error;
    }
  };

  // Pre-load essential data on mount with optimized loading strategy
  useEffect(() => {
    const preloadData = async () => {
      try {
        console.log('🚀 Starting optimized data preload...');
        
        // Phase 1: Load critical, fast data first (stats and categories)
        await Promise.allSettled([
          fetchDashboardStats(),
          fetchCategories()
        ]);
        
        console.log('✅ Phase 1 completed (stats + categories)');
        
        // Phase 2: Load heavier data in background (customers and limited orders)
        // Don't await this - let it load in background
        Promise.allSettled([
          fetchCustomers(),
          fetchOrders(), // Will load with default pagination
        ]).then(() => {
          console.log('✅ Phase 2 completed (customers + orders)');
        });
        
        // Phase 3: Products can load on-demand when needed
        // Don't preload products unless specifically requested
        
      } catch (error) {
        console.error('❌ Error in preload strategy:', error);
      }
    };
    
    preloadData();
  }, []);

  const contextValue: DataContextType = {
    state,
    actions: {
      fetchOrders,
      fetchCustomers,
      fetchCategories,
      fetchProducts,
      fetchDashboardStats,
      updateOrderStatus,
      refreshAll,
      clearCache
    }
  };

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};