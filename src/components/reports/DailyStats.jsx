import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { logger } from '../../utils/logger';

const StatCard = ({ title, value, icon, color }) => (
    <div className={`p-6 rounded-lg shadow-lg text-white ${color}`}>
        <div className="flex justify-between items-center">
            <div>
                <p className="text-3xl font-bold">{value}</p>
                <h3 className="text-sm font-medium opacity-90 mt-1">{title}</h3>
            </div>
            <div className="opacity-80">
                {icon}
            </div>
        </div>
    </div>
);

const DailyStats = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        quotesCreated: 0,
        ordersConfirmed: 0,
        shipmentsCreated: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const q = query(
            collection(db, `users/${user.uid}/activity_log`),
            where('timestamp', '>=', today),
            where('timestamp', '<', tomorrow)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            let quotes = 0;
            let orders = 0;
            let shipments = 0;

            querySnapshot.forEach((doc) => {
                const activity = doc.data();
                switch (activity.action) {
                    case 'CREATE_QUOTE':
                        quotes++;
                        break;
                    case 'CONVERT_QUOTE_TO_ORDER':
                        orders++;
                        break;
                    case 'CREATE_SHIPMENT':
                        shipments++;
                        break;
                    default:
                        break;
                }
            });

            setStats({
                quotesCreated: quotes,
                ordersConfirmed: orders,
                shipmentsCreated: shipments,
            });
            setLoading(false);
        }, (error) => {
            logger.error("Error fetching daily stats: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    if (loading) {
        return <div className="text-center p-4">Günlük istatistikler yükleniyor...</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard 
                title="Verilen Teklif Sayısı" 
                value={stats.quotesCreated} 
                color="bg-gradient-to-br from-sky-500 to-sky-600"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            />
            <StatCard 
                title="Onaylanan Sipariş Sayısı" 
                value={stats.ordersConfirmed} 
                color="bg-gradient-to-br from-teal-500 to-teal-600"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
            />
            <StatCard 
                title="Yapılan Sevkiyat Sayısı" 
                value={stats.shipmentsCreated} 
                color="bg-gradient-to-br from-amber-500 to-amber-600"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8a1 1 0 001-1z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h2a1 1 0 001-1V7a1 1 0 00-1-1h-2" /></svg>}
            />
        </div>
    );
};

export default DailyStats;
