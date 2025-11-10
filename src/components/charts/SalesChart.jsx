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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const SalesChart = ({ data, title = "Satış Trendi" }) => {
    const chartData = {
        labels: data.map(item => item.date),
        datasets: [
            {
                label: 'Satışlar',
                data: data.map(item => item.sales),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#3B82F6',
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
                    color: '#6B7280',
                    font: {
                        size: 12,
                    },
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
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
};

export default SalesChart;
