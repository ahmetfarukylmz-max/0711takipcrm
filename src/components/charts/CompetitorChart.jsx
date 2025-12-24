import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CompetitorChart = ({ data, title }) => {
  const chartData = {
    labels: data.map((d) => d.name),
    datasets: [
      {
        label: 'Kazanılan Teklif Sayısı',
        data: data.map((d) => d.count),
        backgroundColor: '#4F46E5', // Indigo-600
        borderRadius: 8, // More rounded bars
        barThickness: 20,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y', // Horizontal bar chart
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { family: "'Inter', sans-serif" },
        bodyFont: { family: "'JetBrains Mono', monospace" },
        callbacks: {
          label: function (context) {
            return `${context.raw} Adet Teklif`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          display: false,
        },
        ticks: {
          font: { family: "'JetBrains Mono', monospace" },
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          font: { family: "'Inter', sans-serif", weight: 600 },
        },
      },
    },
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-8 rounded-[2rem] border border-white/60 dark:border-gray-700/60 shadow-glass h-full">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
        {title || 'En Güçlü Rakipler'}
      </h3>
      <div className="h-64">
        {data.length > 0 ? (
          <Bar data={chartData} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 font-medium">
            Veri bulunamadı
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitorChart;
