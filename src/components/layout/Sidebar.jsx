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
    LogoutIcon,
    QuestionMarkCircleIcon
} from '../icons';

const ChartBarIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const NavLink = ({ page, children, Icon, activePage, onNavigate }) => (
    <button
        onClick={() => onNavigate(page)}
        className={`w-full flex items-center gap-3 px-4 py-2 rounded-md transition-colors min-h-[44px] ${
            activePage === page
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`}
    >
        <Icon className="w-5 h-5" />
        <span>{children}</span>
    </button>
);

const Sidebar = ({ activePage, setActivePage, connectionStatus, onToggleGuide, overdueItems, isOpen, onClose }) => {
    const handleLogout = async () => {
        await signOut(auth);
    };

    const handleNavClick = (page) => {
        setActivePage(page);
        // Mobilde menüyü kapat
        if (onClose && window.innerWidth < 768) {
            onClose();
        }
    };

    return (
        <aside className={`
            w-64 bg-gray-800 dark:bg-gray-900 text-white flex flex-col p-4
            fixed md:relative h-full z-50
            transform transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
            <div className="flex flex-col flex-grow">
                <div className="mb-10 border-b border-gray-700 pb-4 flex justify-between items-center">
                    <h1 className="text-2xl font-semibold text-white">Takip CRM</h1>
                    {/* Mobilde kapat butonu */}
                    <button
                        onClick={onClose}
                        className="md:hidden text-gray-300 hover:text-white"
                        aria-label="Menüyü Kapat"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <nav className="flex flex-col gap-3">
                    <NavLink page="Anasayfa" Icon={HomeIcon} activePage={activePage} onNavigate={handleNavClick}>
                        Anasayfa
                    </NavLink>
                    <NavLink page="Müşteriler" Icon={UsersIcon} activePage={activePage} onNavigate={handleNavClick}>
                        Müşteriler
                    </NavLink>
                    <NavLink page="Ürünler" Icon={BoxIcon} activePage={activePage} onNavigate={handleNavClick}>
                        Ürünler
                    </NavLink>
                    <NavLink page="Teklifler" Icon={DocumentTextIcon} activePage={activePage} onNavigate={handleNavClick}>
                        Teklifler
                    </NavLink>
                    <NavLink page="Siparişler" Icon={ClipboardListIcon} activePage={activePage} onNavigate={handleNavClick}>
                        Siparişler
                    </NavLink>
                    <NavLink page="Görüşmeler" Icon={CalendarIcon} activePage={activePage} onNavigate={handleNavClick}>
                        Görüşmeler
                    </NavLink>
                    <NavLink page="Sevkiyat" Icon={TruckIcon} activePage={activePage} onNavigate={handleNavClick}>
                        Sevkiyat
                    </NavLink>
                    <NavLink page="Raporlar" Icon={ChartBarIcon} activePage={activePage} onNavigate={handleNavClick}>
                        Raporlar
                    </NavLink>
                    <button
                        onClick={onToggleGuide}
                        className="w-full flex items-center gap-3 px-4 py-2 mt-2 rounded-md transition-colors text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                        <QuestionMarkCircleIcon className="w-5 h-5" />
                        <span>Rehber</span>
                    </button>
                </nav>
            </div>
            <div className="flex-shrink-0">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 mb-2 rounded-md transition-colors text-gray-300 hover:bg-red-600 hover:text-white"
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
