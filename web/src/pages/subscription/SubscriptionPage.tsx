import { useEffect, useState } from 'react';
import api from '../../api/axios';

interface Plan {
  plan: string;
  label: string;
  price: number;
  priceLabel: string;
  projects: number;
  projectsLabel: string;
  users: number;
  usersLabel: string;
  currency: string;
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  phone: string | null;
  limits: { projects: number; users: number; price: number; label: string };
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  phone: string | null;
  months: number;
  palmPesaOrderId: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const PLAN_COLORS: Record<string, string> = {
  free: 'border-gray-200 bg-white',
  starter: 'border-blue-300 bg-blue-50',
  pro: 'border-purple-400 bg-purple-50',
  enterprise: 'border-yellow-400 bg-yellow-50',
};

const PLAN_BADGE: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600',
  starter: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-yellow-100 text-yellow-700',
};

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [months, setMonths] = useState(1);
  const [uzaShopId, setUzaShopId] = useState('');
  const [paying, setPaying] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [plansRes, subRes, payRes] = await Promise.all([
        api.get('/subscriptions/plans'),
        api.get('/subscriptions/me'),
        api.get('/subscriptions/me/payments'),
      ]);
      setPlans(plansRes.data);
      setSubscription(subRes.data);
      setPayments(payRes.data);
      if (subRes.data?.phone) setPhone(subRes.data.phone);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load subscription data.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!selectedPlan || !phone) {
      setMessage({ type: 'error', text: 'Select a plan and enter your phone number.' });
      return;
    }
    setPaying(true);
    setMessage(null);
    try {
      const res = await api.post('/subscriptions/pay/palmpesa', {
        plan: selectedPlan,
        phone,
        months,
        ...(uzaShopId ? { uzaShopId } : {}),
      });
      const orderId = res.data.palmPesaOrderId;
      setPendingOrderId(orderId);
      setMessage({ type: 'info', text: res.data.message });
      await fetchAll();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.message ?? 'Payment initiation failed.' });
    } finally {
      setPaying(false);
    }
  };

  const handleCheckStatus = async (orderId: string) => {
    setCheckingStatus(orderId);
    setMessage(null);
    try {
      const res = await api.get(`/subscriptions/payment-status/${orderId}`);
      const s = res.data.status;
      setMessage({
        type: ['success', 'completed', 'paid'].includes(s?.toLowerCase()) ? 'success' : 'info',
        text: `Payment status: ${s}. Subscription: ${res.data.subscription?.status}`,
      });
      await fetchAll();
    } catch {
      setMessage({ type: 'error', text: 'Failed to check payment status.' });
    } finally {
      setCheckingStatus(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription? You will be downgraded at end of billing period.')) return;
    try {
      await api.delete('/subscriptions/cancel');
      setMessage({ type: 'info', text: 'Subscription cancelled.' });
      await fetchAll();
    } catch {
      setMessage({ type: 'error', text: 'Failed to cancel subscription.' });
    }
  };

  const handleDowngrade = async () => {
    if (!confirm('Downgrade to Free plan immediately?')) return;
    try {
      await api.post('/subscriptions/downgrade');
      setMessage({ type: 'info', text: 'Downgraded to Free plan.' });
      await fetchAll();
    } catch {
      setMessage({ type: 'error', text: 'Failed to downgrade.' });
    }
  };

  const planPrice = selectedPlan ? plans.find(p => p.plan === selectedPlan)?.price ?? 0 : 0;
  const totalAmount = planPrice * months;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-10">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription & Billing</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your plan — powered by UZA-MANAGER PalmPesa</p>
        </div>
        {subscription && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${PLAN_BADGE[subscription.plan] ?? 'bg-gray-100 text-gray-600'}`}>
            <span className="capitalize">{subscription.plan}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[subscription.status] ?? 'bg-gray-100 text-gray-500'}`}>
              {subscription.status}
            </span>
          </div>
        )}
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          message.type === 'error'   ? 'bg-red-50 text-red-700 border border-red-200' :
                                       'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {message.text}
        </div>
      )}

      {subscription && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-3">Current Plan</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Plan</p>
              <p className="font-semibold text-gray-900 capitalize">{subscription.plan}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[subscription.status] ?? ''}`}>
                {subscription.status}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500">Projects</p>
              <p className="font-semibold text-gray-900">
                {subscription.limits.projects === -1 ? 'Unlimited' : subscription.limits.projects}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Team Members</p>
              <p className="font-semibold text-gray-900">
                {subscription.limits.users === -1 ? 'Unlimited' : subscription.limits.users}
              </p>
            </div>
            {subscription.currentPeriodEnd && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Renews / Expires</p>
                <p className="font-medium text-gray-900">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                </p>
              </div>
            )}
          </div>
          {subscription.plan !== 'free' && (
            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
              <button onClick={handleDowngrade} className="text-xs text-gray-500 hover:text-gray-700 underline">
                Downgrade to Free
              </button>
              <button onClick={handleCancel} className="text-xs text-red-500 hover:text-red-700 underline">
                Cancel Subscription
              </button>
            </div>
          )}
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-4">Choose a Plan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const isCurrent = subscription?.plan === plan.plan;
            const isSelected = selectedPlan === plan.plan;
            return (
              <div
                key={plan.plan}
                onClick={() => plan.plan !== 'free' && setSelectedPlan(plan.plan)}
                className={`relative rounded-xl border-2 p-5 cursor-pointer transition-all ${
                  isSelected ? 'border-blue-500 shadow-md scale-[1.02]' :
                  isCurrent  ? 'border-green-400' :
                               PLAN_COLORS[plan.plan] ?? 'border-gray-200'
                } ${plan.plan === 'free' ? 'cursor-default opacity-80' : 'hover:shadow-md'}`}
              >
                {isCurrent && (
                  <span className="absolute -top-2.5 left-3 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    CURRENT
                  </span>
                )}
                {plan.plan === 'pro' && !isCurrent && (
                  <span className="absolute -top-2.5 left-3 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    POPULAR
                  </span>
                )}
                <p className="font-bold text-gray-900 capitalize text-base">{plan.label}</p>
                <p className="text-xl font-extrabold text-blue-600 mt-1">{plan.priceLabel}</p>
                <div className="mt-3 space-y-1.5 text-sm text-gray-600">
                  <p>📁 {plan.projectsLabel} project{plan.projects !== 1 ? 's' : ''}</p>
                  <p>👥 {plan.usersLabel} team member{plan.users !== 1 ? 's' : ''}</p>
                  <p>💳 PalmPesa mobile money</p>
                  {plan.plan !== 'free' && <p>✅ Priority support</p>}
                  {plan.plan === 'enterprise' && <p>🤝 Dedicated onboarding</p>}
                </div>
                {plan.plan !== 'free' && !isCurrent && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedPlan(plan.plan); }}
                    className={`mt-4 w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    {isSelected ? 'Selected ✓' : 'Select'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedPlan && selectedPlan !== 'free' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            Complete Payment via PalmPesa
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mobile Number (PalmPesa)</label>
              <input
                type="tel"
                placeholder="e.g. 255712345678"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Billing Months</label>
              <select
                value={months}
                onChange={e => setMonths(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {[1, 3, 6, 12].map(m => (
                  <option key={m} value={m}>{m} month{m > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">UZA Shop ID (optional)</label>
              <input
                type="text"
                placeholder="Leave blank to use default"
                value={uzaShopId}
                onChange={e => setUzaShopId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex flex-col justify-end">
              <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm">
                <p className="text-gray-500">Total amount</p>
                <p className="text-2xl font-extrabold text-blue-700">
                  {totalAmount.toLocaleString()} TZS
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {months} × {planPrice.toLocaleString()} TZS
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handlePay}
            disabled={paying || !phone}
            className="mt-5 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {paying ? 'Processing…' : `Pay ${totalAmount.toLocaleString()} TZS via PalmPesa`}
          </button>
          {pendingOrderId && (
            <button
              onClick={() => handleCheckStatus(pendingOrderId)}
              disabled={checkingStatus === pendingOrderId}
              className="mt-3 ml-3 px-5 py-2.5 border border-blue-400 text-blue-600 font-medium rounded-lg text-sm hover:bg-blue-50 disabled:opacity-50 transition-colors"
            >
              {checkingStatus === pendingOrderId ? 'Checking…' : 'Check Payment Status'}
            </button>
          )}
        </div>
      )}

      {payments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">Payment History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Amount</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Method</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Months</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Order ID</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-700">
                      {new Date(p.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">
                      {Number(p.amount).toLocaleString()} {p.currency}
                    </td>
                    <td className="px-4 py-2.5 capitalize text-gray-600">{p.method}</td>
                    <td className="px-4 py-2.5 text-gray-600">{p.months}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        p.status === 'success' ? 'bg-green-100 text-green-700' :
                        p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        p.status === 'failed'  ? 'bg-red-100 text-red-700' :
                                                  'bg-gray-100 text-gray-500'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs font-mono">
                      {p.palmPesaOrderId ?? '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      {p.status === 'pending' && p.palmPesaOrderId && (
                        <button
                          onClick={() => handleCheckStatus(p.palmPesaOrderId!)}
                          disabled={checkingStatus === p.palmPesaOrderId}
                          className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                        >
                          {checkingStatus === p.palmPesaOrderId ? 'Checking…' : 'Check'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm text-gray-500">
        <p className="font-medium text-gray-700 mb-1">💳 Payment powered by UZA-MANAGER + PalmPesa</p>
        <p>Payments are processed through the UZA-MANAGER API using PalmPesa mobile money. Prices are in Tanzanian Shillings (TZS). Contact support if a payment is stuck.</p>
      </div>
    </div>
  );
}
