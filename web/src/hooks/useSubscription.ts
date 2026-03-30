import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';

export interface SubscriptionLimits {
  projects: number;
  users: number;
  price: number;
  label: string;
}

export interface Subscription {
  id: string;
  plan: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  limits: SubscriptionLimits;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    api.get('/subscriptions/me')
      .then((res) => setSubscription(res.data))
      .catch(() => setSubscription(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const isActive = subscription?.status === 'active';
  const isPaid   = subscription?.plan !== 'free' && isActive;

  const canCreateProject = (currentCount: number) => {
    if (!subscription) return true;
    const limit = subscription.limits.projects;
    return limit === -1 || currentCount < limit;
  };

  return { subscription, loading, isActive, isPaid, canCreateProject, refresh: fetch };
}
