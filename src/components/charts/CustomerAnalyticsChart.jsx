import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CustomerAnalyticsChart = ({ data, title = "Müşteri Bazlı Satışlar" }) => {
    const chartData = {
        labels: data.map(item => item.name),
        datasets: [
            {
                label: 'Toplam Satış',
                data: data.map(item => item.total),
                backgroundColor: '#3B82F6',
                borderColor: '#3B82F6',
                borderWidth: 1,
                borderRadius: 8,
                borderSkipped: false,
            },
            {
                label: 'Sipariş Sayısı',
                data: data.map(item => item.count),
                backgroundColor: '#10B981',
                borderColor: '#10B981',
                borderWidth: 1,
                borderRadius: 8,
                borderSkipped: false,
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
                    color: '#6B7280',
                    font: {
                        size: 12,
                    },
                    usePointStyle: true,
                    pointStyle: 'rect',
                },
            },
            tooltip: {
                backgroundColor: '#1F2937',
                titleColor: '#F9FAFB',
                bodyColor: '#F9FAFB',
                borderColor: '#374151',
                borderWidth: 1,
                padding: 12,
                displayColors: true,
                boxPadding: 6,
            },
        },
        scales: {
            x: {
                ticks: {
                    color: '#6B7280',
                    font: {
                        size: 12,
                    },
                    maxRotation: 45,
                    minRotation: 45,
                },
                grid: {
                    color: 'rgba(55, 65, 81, 0.1)',
                    borderDash: [3, 3],
                },
            },
            y: {
                ticks: {
                    color: '#6B7280',
                    font: {
                        size: 12,
                    },
                },
                grid: {
                    color: 'rgba(55, 65, 81, 0.1)',
                    borderDash: [3, 3],
                },
            },
        },
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                {title}
            </h3>
            <div style={{ height: '300px' }}>
                <Bar data={chartData} options={options} />
            </div>
        </div>
    );
};

export default CustomerAnalyticsChart;
