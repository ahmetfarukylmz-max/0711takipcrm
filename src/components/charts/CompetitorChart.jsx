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
        backgroundColor: '#3B82F6',
        borderRadius: 4,
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
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        {title || 'En Güçlü Rakipler'}
      </h3>
      <div className="h-64">
        {data.length > 0 ? (
          <Bar data={chartData} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Veri bulunamadı
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitorChart;
