import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const LossReasonChart = ({ data, title }) => {
  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        data: data.map((d) => d.value),
        backgroundColor: [
          '#EF4444', // Red (Fiyat)
          '#F59E0B', // Amber (Stok)
          '#3B82F6', // Blue (Rakip)
          '#6B7280', // Gray (İptal)
          '#8B5CF6', // Purple (İletişim)
          '#10B981', // Green (Diğer)
        ],
        borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            let value = context.raw;
            let total = context.chart._metasets[context.datasetIndex].total;
            let percentage = Math.round((value / total) * 100) + '%';
            return label + value + ' (' + percentage + ')';
          },
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        {title || 'Kayıp Sebepleri Dağılımı'}
      </h3>
      <div className="h-64">
        {data.length > 0 ? (
          <Doughnut data={chartData} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Veri bulunamadı
          </div>
        )}
      </div>
    </div>
  );
};

export default LossReasonChart;
