import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#6366f1', // indigo-500
];

const PaymentMethodChart = ({ payments }) => {
  const data = useMemo(() => {
    if (!payments || payments.length === 0) return [];

    const methodStats = {};
    let totalAmount = 0;

    payments.forEach((payment) => {
      // Sadece tahsil edilmiş veya bekleyen ödemeleri dahil et (İptal hariç)
      if (payment.isDeleted || payment.status === 'İptal') return;

      const method = payment.paymentMethod || 'Belirtilmemiş';
      // Currency conversion could be handled here if needed, defaulting to raw sum for now
      // Assuming all valid payments should be counted

      if (!methodStats[method]) {
        methodStats[method] = {
          name: method,
          value: 0,
          count: 0,
        };
      }

      methodStats[method].value += Number(payment.amount);
      methodStats[method].count += 1;
      totalAmount += Number(payment.amount);
    });

    // Convert to array and calculate percentages
    return Object.values(methodStats)
      .map((item) => ({
        ...item,
        percentage: ((item.value / totalAmount) * 100).toFixed(1),
      }))
      .sort((a, b) => b.value - a.value); // Sort by highest value
  }, [payments]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-100 dark:border-gray-700 shadow-xl rounded-xl">
          <p className="font-bold text-gray-900 dark:text-white mb-1">{data.name}</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Tutar: <span className="font-semibold">{formatCurrency(data.value)}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Adet: <span className="font-semibold">{data.count}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Oran: <span className="font-semibold text-primary-600">%{data.percentage}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs">
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-600 dark:text-gray-300 font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
        <div className="text-4xl mb-2">📊</div>
        <p>Henüz ödeme verisi bulunmuyor</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                strokeWidth={2}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PaymentMethodChart;
