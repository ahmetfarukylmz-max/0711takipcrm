import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { logger } from '../../utils/logger';

const DailySummary = () => {
    const { user } = useAuth();
    const [activities, setActivities] = useState([]);
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
            where('timestamp', '<', tomorrow),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const acts = [];
            querySnapshot.forEach((doc) => {
                acts.push({ id: doc.id, ...doc.data() });
            });
            setActivities(acts);
            setLoading(false);
        }, (error) => {
            logger.error("Error fetching daily activities: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const formatTime = (timestamp) => {
        if (!timestamp) return '--:--';
        return new Date(timestamp.seconds * 1000).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return <div className="text-center p-4">Günlük aktiviteler yükleniyor...</div>;
    }

    if (activities.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Bugünkü Aksiyonlarım</h3>
                <p className="text-gray-500 dark:text-gray-400">Bugün için kaydedilmiş bir aktivite bulunmuyor.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Bugünkü Aksiyonlarım</h3>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {activities.map(activity => (
                    <li key={activity.id} className="py-3 flex items-center">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md text-sm font-mono">
                            {formatTime(activity.timestamp)}
                        </span>
                        <p className="ml-4 text-gray-700 dark:text-gray-300">{activity.details.message}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default DailySummary;
