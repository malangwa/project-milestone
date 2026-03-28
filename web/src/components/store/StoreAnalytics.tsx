import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

type StoreAnalyticsProps = {
  stockStatusData: Array<{ name: string; value: number; color: string }>;
  projectDistributionData: Array<{ name: string; value: number }>;
  topMaterialsData: Array<{ name: string; quantity: number }>;
};

const StoreAnalytics = ({ stockStatusData, projectDistributionData, topMaterialsData }: StoreAnalyticsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Status Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={stockStatusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {stockStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Projects by Items</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={projectDistributionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Materials by Quantity</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={topMaterialsData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={80} />
            <Tooltip />
            <Bar dataKey="quantity" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StoreAnalytics;
