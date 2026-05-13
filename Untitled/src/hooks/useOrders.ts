import { useState, useEffect } from 'react';
import { OrderAPI } from '../../api/orderAPI';
import type { Order } from '../data/orders';

export function useOrders(userId?: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await OrderAPI.getOrders(userId);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: {
    items: any[];
    total: number;
    deliveryAddress: string;
    specialInstructions?: string;
  }) => {
    if (!userId) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);
    try {
      const newOrder = await OrderAPI.createOrder(userId, orderData);
      setOrders(prev => [newOrder, ...prev]);
      return newOrder;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create order';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!userId) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);
    try {
      const cancelledOrder = await OrderAPI.cancelOrder(orderId, userId);
      setOrders(prev => prev.map(order =>
        order.id === orderId ? cancelledOrder : order
      ));
      return cancelledOrder;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel order';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userId]);

  return {
    orders,
    loading,
    error,
    createOrder,
    cancelOrder,
    refetch: fetchOrders
  };
}