interface BudgetChartProps {
  spent: number;
  budget: number;
  className?: string;
}

export const BudgetChart = ({ spent, budget, className = '' }: BudgetChartProps) => {
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  const isOverBudget = percentage > 100;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          ${spent.toLocaleString()} spent
        </span>
        <span className={isOverBudget ? 'text-red-600 font-medium' : 'text-gray-600'}>
          ${budget.toLocaleString()} budget
        </span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isOverBudget ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">
        {isOverBudget
          ? `${(percentage - 100).toFixed(1)}% over budget`
          : `${(100 - percentage).toFixed(1)}% remaining`}
      </p>
    </div>
  );
};