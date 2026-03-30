import { useNavigate } from 'react-router-dom';

interface Props {
  onClose: () => void;
  currentPlan: string;
  limitType: 'projects' | 'users';
  currentCount: number;
  limit: number;
}

const PLAN_UPGRADES: Record<string, { next: string; price: string; projects: string; users: string }> = {
  free:     { next: 'starter',    price: '10,000 TZS/mo', projects: '5',         users: '10'  },
  starter:  { next: 'pro',        price: '25,000 TZS/mo', projects: '20',        users: '50'  },
  pro:      { next: 'enterprise', price: '50,000 TZS/mo', projects: 'Unlimited', users: 'Unlimited' },
  enterprise: { next: '',         price: '',               projects: 'Unlimited', users: 'Unlimited' },
};

const LIMIT_LABELS: Record<string, string> = {
  projects: 'projects',
  users: 'team members',
};

export default function SubscriptionGate({ onClose, currentPlan, limitType, currentCount, limit }: Props) {
  const navigate = useNavigate();
  const upgrade  = PLAN_UPGRADES[currentPlan] ?? PLAN_UPGRADES.free;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 text-white">
          <div className="text-3xl mb-2">🔒</div>
          <h2 className="text-lg font-bold">Plan Limit Reached</h2>
          <p className="text-blue-100 text-sm mt-1">
            You've used {currentCount} of {limit} {LIMIT_LABELS[limitType]} on your <span className="font-semibold capitalize">{currentPlan}</span> plan.
          </p>
        </div>

        <div className="p-6">
          <p className="text-gray-600 text-sm mb-5">
            Upgrade to create more {LIMIT_LABELS[limitType]} and unlock all premium features.
          </p>

          {upgrade.next && (
            <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-blue-800 capitalize text-base">{upgrade.next} Plan</span>
                <span className="text-blue-700 font-semibold text-sm">{upgrade.price}</span>
              </div>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>📁 {upgrade.projects} projects</li>
                <li>👥 {upgrade.users} team members</li>
                <li>💳 PalmPesa mobile money</li>
                <li>✅ Priority support</li>
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={() => { onClose(); navigate('/subscription'); }}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors"
            >
              Upgrade Now →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
