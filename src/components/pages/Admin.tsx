import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';
import type { User, LoginLog } from '../../types';
import { logger } from '../../utils/logger';

type TabType = 'users' | 'logs';

/**
 * Admin Page - User management and login logs
 * Only accessible by users with admin role
 */
const Admin: React.FC = () => {
    const { isAdmin, user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch users
    const fetchUsers = async () => {
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const usersData = usersSnapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            })) as User[];
            setUsers(usersData);
        } catch (error) {
            logger.error('Error fetching users:', error);
            toast.error('Kullanıcılar yüklenemedi');
        }
    };

    // Fetch login logs (last 100)
    const fetchLoginLogs = async () => {
        try {
            const logsQuery = query(
                collection(db, 'loginLogs'),
                orderBy('timestamp', 'desc'),
                limit(100)
            );
            const logsSnapshot = await getDocs(logsQuery);
            const logsData = logsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as LoginLog[];
            setLoginLogs(logsData);
        } catch (error) {
            logger.error('Error fetching logs:', error);
            toast.error('Loglar yüklenemedi');
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchUsers(), fetchLoginLogs()]);
            setLoading(false);
        };
        loadData();
    }, []);

    // Toggle user role
    const toggleUserRole = async (userId: string, currentRole: string) => {
        try {
            const newRole = currentRole === 'admin' ? 'user' : 'admin';
            await updateDoc(doc(db, 'users', userId), {
                role: newRole,
                updatedAt: new Date().toISOString()
            });
            toast.success(`Kullanıcı rolü ${newRole === 'admin' ? 'admin' : 'kullanıcı'} olarak güncellendi`);
            await fetchUsers();
        } catch (error) {
            logger.error('Error updating role:', error);
            toast.error('Rol güncellenemedi');
        }
    };

    // Toggle user active status
    const toggleUserStatus = async (userId: string, currentStatus?: boolean) => {
        try {
            const newStatus = !currentStatus;
            await updateDoc(doc(db, 'users', userId), {
                isActive: newStatus,
                updatedAt: new Date().toISOString()
            });
            toast.success(`Kullanıcı ${newStatus ? 'aktif' : 'devre dışı'} hale getirildi`);
            await fetchUsers();
        } catch (error) {
            logger.error('Error updating status:', error);
            toast.error('Durum güncellenemedi');
        }
    };

    // Check admin access
    if (!isAdmin()) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">🔒 Yetkiniz Yok</h2>
                    <p className="text-gray-600 dark:text-gray-400">Bu sayfaya erişim için admin yetkisi gereklidir.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    🔐 Admin Paneli
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Kullanıcı yönetimi ve sistem güvenliği
                </p>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`pb-3 px-2 font-semibold transition-colors ${
                            activeTab === 'users'
                                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                        👥 Kullanıcılar ({users.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`pb-3 px-2 font-semibold transition-colors ${
                            activeTab === 'logs'
                                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                        📊 Giriş Logları ({loginLogs.length})
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'users' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    {/* Users Table - Desktop */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Kullanıcı
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Rol
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Durum
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Son Giriş
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Kayıt Tarihi
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        İşlemler
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {users.map(user => (
                                    <tr key={user.uid} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {user.displayName || 'İsimsiz'}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {user.email}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                user.role === 'admin'
                                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                            }`}>
                                                {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                user.isActive !== false
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                            }`}>
                                                {user.isActive !== false ? '✅ Aktif' : '❌ Pasif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {user.lastLogin ? formatDate(user.lastLogin) : 'Hiç giriş yapmadı'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(user.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => toggleUserRole(user.uid, user.role)}
                                                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                                                        user.role === 'admin'
                                                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                                                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200'
                                                    }`}
                                                >
                                                    {user.role === 'admin' ? 'User Yap' : 'Admin Yap'}
                                                </button>
                                                <button
                                                    onClick={() => toggleUserStatus(user.uid, user.isActive)}
                                                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                                                        user.isActive !== false
                                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200'
                                                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200'
                                                    }`}
                                                >
                                                    {user.isActive !== false ? 'Devre Dışı' : 'Aktifleştir'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Users List - Mobile */}
                    <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map(user => (
                            <div key={user.uid} className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                                            {user.displayName || 'İsimsiz'}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {user.email}
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            user.role === 'admin'
                                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                        }`}>
                                            {user.role === 'admin' ? '👑' : '👤'}
                                        </span>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            user.isActive !== false
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                        }`}>
                                            {user.isActive !== false ? '✅' : '❌'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 space-y-1">
                                    <p>Son giriş: {user.lastLogin ? formatDate(user.lastLogin) : 'Hiç giriş yapmadı'}</p>
                                    <p>Kayıt: {formatDate(user.createdAt)}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => toggleUserRole(user.uid, user.role)}
                                        className={`flex-1 px-3 py-2 rounded text-xs font-semibold transition-colors ${
                                            user.role === 'admin'
                                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                        }`}
                                    >
                                        {user.role === 'admin' ? 'User Yap' : 'Admin Yap'}
                                    </button>
                                    <button
                                        onClick={() => toggleUserStatus(user.uid, user.isActive)}
                                        className={`flex-1 px-3 py-2 rounded text-xs font-semibold transition-colors ${
                                            user.isActive !== false
                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                        }`}
                                    >
                                        {user.isActive !== false ? 'Devre Dışı' : 'Aktifleştir'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'logs' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    {/* Logs Table - Desktop */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Tarih/Saat
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Kullanıcı
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        İşlem
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        IP Adresi
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Cihaz
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {loginLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                            Henüz giriş/çıkış kaydı bulunmuyor
                                        </td>
                                    </tr>
                                ) : (
                                    loginLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {formatDate(log.timestamp)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {log.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                    log.action === 'login'
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                                }`}>
                                                    {log.action === 'login' ? '✅ Giriş' : '🚪 Çıkış'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                                                {log.ipAddress || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {log.userAgent ? (
                                                    <span className="text-xs truncate max-w-xs block" title={log.userAgent}>
                                                        {log.userAgent.includes('Mobile') ? '📱' : '💻'} {log.userAgent.split(' ')[0]}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Logs List - Mobile */}
                    <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                        {loginLogs.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                Henüz giriş/çıkış kaydı bulunmuyor
                            </div>
                        ) : (
                            loginLogs.map(log => (
                                <div key={log.id} className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {log.email}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatDate(log.timestamp)}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            log.action === 'login'
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                        }`}>
                                            {log.action === 'login' ? '✅ Giriş' : '🚪 Çıkış'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                        {log.ipAddress && <p>IP: {log.ipAddress}</p>}
                                        {log.userAgent && (
                                            <p className="truncate">
                                                {log.userAgent.includes('Mobile') ? '📱' : '💻'} {log.userAgent}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default Admin;
