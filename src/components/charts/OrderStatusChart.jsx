import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = {
  Bekliyor: '#F43F5E', // Rose-500
  Hazırlanıyor: '#F59E0B', // Amber-500
  Tamamlandı: '#10B981', // Emerald-500
  İptal: '#94A3B8', // Slate-400
};

const OrderStatusChart = ({ data, title = 'Sipariş Durumu' }) => {
  const chartData = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        data: data.map((item) => item.value),
        backgroundColor: data.map((item) => COLORS[item.name] || '#6366F1'),
        borderColor: '#fff',
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%', // Thinner doughnut
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#64748B',
          font: {
            family: "'Inter', sans-serif",
            size: 12,
            weight: 600,
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#F8FAFC',
        bodyColor: '#F8FAFC',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        titleFont: { family: "'Inter', sans-serif" },
        bodyFont: { family: "'JetBrains Mono', monospace" },
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(0);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-8 rounded-[2rem] border border-white/60 dark:border-gray-700/60 shadow-glass h-full">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
        {title}
      </h3>
      <div style={{ height: '300px', position: 'relative' }}>
        <Doughnut data={chartData} options={options} />
        {/* Center Text Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <span className="block text-3xl font-bold font-mono text-slate-800 dark:text-white">
              {data.reduce((a, b) => a + b.value, 0)}
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Toplam
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusChart;
