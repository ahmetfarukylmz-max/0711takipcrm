import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = {
    'Bekliyor': '#EF4444',
    'Hazırlanıyor': '#F59E0B',
    'Tamamlandı': '#10B981',
    'İptal': '#6B7280'
};

const OrderStatusChart = ({ data, title = "Sipariş Durumu" }) => {
    const chartData = {
        labels: data.map(item => item.name),
        datasets: [
            {
                data: data.map(item => item.value),
                backgroundColor: data.map(item => COLORS[item.name] || '#8884d8'),
                borderColor: '#fff',
                borderWidth: 2,
                hoverOffset: 4,
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
                    color: '#6B7280',
                    font: {
                        size: 12,
                    },
                    padding: 15,
                    usePointStyle: true,
                    pointStyle: 'circle',
                },
            },
            tooltip: {
                backgroundColor: '#1F2937',
                titleColor: '#F9FAFB',
                bodyColor: '#F9FAFB',
                borderColor: '#374151',
                borderWidth: 1,
                padding: 12,
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(0);
                        return `${label}: ${value} (${percentage}%)`;
                    }
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
                <Doughnut data={chartData} options={options} />
            </div>
        </div>
    );
};

export default OrderStatusChart;
