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

const FREE_PLAN_FALLBACK: Subscription = {
  id: '',
  plan: 'free',
  status: 'active',
  currentPeriodStart: null,
  currentPeriodEnd: null,
  limits: { projects: 1, users: 3, price: 0, label: 'Free' },
};

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

  const effective  = subscription ?? FREE_PLAN_FALLBACK;
  const isActive   = effective.status === 'active';
  const isPaid     = effective.plan !== 'free' && isActive;

  const canCreateProject = (currentCount: number) => {
    const limit = effective.limits.projects;
    return limit === -1 || currentCount < limit;
  };

  return { subscription: effective, loading, isActive, isPaid, canCreateProject, refresh: fetch };
}
