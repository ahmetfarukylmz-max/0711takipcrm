import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const SalesChart = ({ data, title = 'Satış Trendi' }) => {
  const chartData = {
    labels: data.map((item) => item.date),
    datasets: [
      {
        label: 'Satışlar',
        data: data.map((item) => item.sales),
        borderColor: '#4F46E5', // Indigo-600
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#4F46E5',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#64748B', // Slate-500
          font: {
            family: "'Inter', sans-serif",
            size: 12,
            weight: 600,
          },
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)', // Slate-900
        titleColor: '#F8FAFC',
        bodyColor: '#F8FAFC',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        boxPadding: 6,
        titleFont: { family: "'Inter', sans-serif" },
        bodyFont: { family: "'JetBrains Mono', monospace" },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#94A3B8', // Slate-400
          font: {
            family: "'JetBrains Mono', monospace",
            size: 11,
          },
        },
        grid: {
          color: 'rgba(79, 70, 229, 0.05)',
          borderDash: [4, 4],
        },
      },
      y: {
        ticks: {
          color: '#94A3B8',
          font: {
            family: "'JetBrains Mono', monospace",
            size: 11,
          },
          callback: function (value) {
            return '₺' + value;
          },
        },
        grid: {
          color: 'rgba(79, 70, 229, 0.05)',
          borderDash: [4, 4],
        },
      },
    },
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-8 rounded-[2rem] border border-white/60 dark:border-gray-700/60 shadow-glass h-full">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
        {title}
      </h3>
      <div style={{ height: '300px' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default SalesChart;
