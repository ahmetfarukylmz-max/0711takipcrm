import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import ConnectionStatusIndicator from '../common/ConnectionStatusIndicator';
import {
    HomeIcon,
    UsersIcon,
    BoxIcon,
    DocumentTextIcon,
    ClipboardListIcon,
    CalendarIcon,
    TruckIcon,
    LogoutIcon
} from '../icons';

const NavLink = ({ page, children, Icon, activePage, setActivePage }) => (
    <button
        onClick={() => setActivePage(page)}
        className={`w-full flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
            activePage === page
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`}
    >
        <Icon className="w-5 h-5" />
        <span>{children}</span>
    </button>
);

const Sidebar = ({ activePage, setActivePage, connectionStatus }) => {
    const handleLogout = async () => {
        await signOut(auth);
    };

    return (
        <aside className="w-64 bg-gray-800 text-white flex flex-col p-4">
            <div className="flex flex-col flex-grow">
                <div className="mb-10 border-b border-gray-700 pb-4 flex justify-center items-center">
                    <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-10 w-10 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                </div>
                <nav className="flex flex-col gap-3">
                    <NavLink page="Anasayfa" Icon={HomeIcon} activePage={activePage} setActivePage={setActivePage}>
                        Anasayfa
                    </NavLink>
                    <NavLink page="Müşteriler" Icon={UsersIcon} activePage={activePage} setActivePage={setActivePage}>
                        Müşteriler
                    </NavLink>
                    <NavLink page="Ürünler" Icon={BoxIcon} activePage={activePage} setActivePage={setActivePage}>
                        Ürünler
                    </NavLink>
                    <NavLink page="Teklifler" Icon={DocumentTextIcon} activePage={activePage} setActivePage={setActivePage}>
                        Teklifler
                    </NavLink>
                    <NavLink page="Siparişler" Icon={ClipboardListIcon} activePage={activePage} setActivePage={setActivePage}>
                        Siparişler
                    </NavLink>
                    <NavLink page="Görüşmeler" Icon={CalendarIcon} activePage={activePage} setActivePage={setActivePage}>
                        Görüşmeler
                    </NavLink>
                    <NavLink page="Sevkiyat" Icon={TruckIcon} activePage={activePage} setActivePage={setActivePage}>
                        Sevkiyat
                    </NavLink>
                </nav>
            </div>
            <div className="flex-shrink-0">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-md transition-colors text-gray-300 hover:bg-red-600 hover:text-white"
                >
                    <LogoutIcon className="w-5 h-5" />
                    <span>Çıkış Yap</span>
                </button>
                <ConnectionStatusIndicator status={connectionStatus} />
            </div>
        </aside>
    );
};

export default Sidebar;
