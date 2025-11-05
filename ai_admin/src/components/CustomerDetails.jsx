import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, ShoppingBag } from 'react-feather';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';

const CustomerDetails = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomerDetails();
  }, [customerId]);

  const loadCustomerDetails = async () => {
    try {
      setLoading(true);
      // Load customer details
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (customerError) throw customerError;
      setCustomer(customerData);

      // Load customer's orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            quantity,
            unit_price,
            total_price,
            product:products(name)
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setCustomerOrders(ordersData || []);
    } catch (error) {
      console.error('Error loading customer details:', error);
      toast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const updateCustomerStatus = async (newStatus) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ status: newStatus })
        .eq('id', customerId);

      if (error) throw error;
      toast.success('Customer status updated successfully');
      loadCustomerDetails();
    } catch (error) {
      console.error('Error updating customer status:', error);
      toast.error('Failed to update customer status');
    }
  };

  if (loading) {
    return <div className="loading">Loading customer details...</div>;
  }

  if (!customer) {
    return <div className="error">Customer not found</div>;
  }

  return (
    <div className="customer-details-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back to Customers
        </button>
        <h2>{customer.first_name} {customer.last_name}</h2>
      </div>

      <div className="customer-details-grid">
        {/* Customer Information */}
        <div className="details-card">
          <h3>Customer Information</h3>
          <div className="customer-info">
            <div className="info-item">
              <Mail size={18} />
              <div>
                <label>Email</label>
                <span>{customer.email}</span>
              </div>
            </div>
            <div className="info-item">
              <Phone size={18} />
              <div>
                <label>Phone</label>
                <span>{customer.phone || 'N/A'}</span>
              </div>
            </div>
            <div className="info-item">
              <Calendar size={18} />
              <div>
                <label>Member Since</label>
                <span>{new Date(customer.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="info-item">
              <ShoppingBag size={18} />
              <div>
                <label>Total Orders</label>
                <span>{customer.total_orders}</span>
              </div>
            </div>
          </div>

          <div className="status-section">
            <label>Account Status</label>
            <select
              value={customer.status}
              onChange={(e) => updateCustomerStatus(e.target.value)}
              className={`status-select ${customer.status}`}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        {/* Address Information */}
        <div className="details-card">
          <h3>Addresses</h3>
          {customer.default_shipping_address && (
            <div className="address-section">
              <h4>Default Shipping Address</h4>
              <div className="address-details">
                <MapPin size={18} />
                <div>
                  <p>{customer.default_shipping_address.street}</p>
                  <p>{customer.default_shipping_address.city}, {customer.default_shipping_address.state}</p>
                  <p>{customer.default_shipping_address.postal_code}</p>
                  <p>{customer.default_shipping_address.country}</p>
                </div>
              </div>
            </div>
          )}

          {customer.default_billing_address && (
            <div className="address-section">
              <h4>Default Billing Address</h4>
              <div className="address-details">
                <MapPin size={18} />
                <div>
                  <p>{customer.default_billing_address.street}</p>
                  <p>{customer.default_billing_address.city}, {customer.default_billing_address.state}</p>
                  <p>{customer.default_billing_address.postal_code}</p>
                  <p>{customer.default_billing_address.country}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order History */}
        <div className="details-card full-width">
          <h3>Order History</h3>
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customerOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.order_number}</td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="order-items-summary">
                        {order.items.map((item, index) => (
                          <span key={index}>
                            {item.quantity}x {item.product.name}
                            {index < order.items.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>${order.total_amount}</td>
                    <td>
                      <span className={`status-badge ${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="action-btn view"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        View Order
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Statistics */}
        <div className="details-card">
          <h3>Customer Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <label>Total Spent</label>
              <span className="stat-value">${customer.total_spent}</span>
            </div>
            <div className="stat-item">
              <label>Average Order Value</label>
              <span className="stat-value">
                ${customer.total_orders > 0
                  ? (customer.total_spent / customer.total_orders).toFixed(2)
                  : '0.00'
                }
              </span>
            </div>
            <div className="stat-item">
              <label>Last Order</label>
              <span className="stat-value">
                {customerOrders.length > 0
                  ? new Date(customerOrders[0].created_at).toLocaleDateString()
                  : 'No orders'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;
