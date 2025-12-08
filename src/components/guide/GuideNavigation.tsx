import React, { useState } from 'react';

interface Section {
  id: string;
  title: string;
  icon: string;
  Component: React.ComponentType;
}

interface GuideNavigationProps {
  sections: Section[];
  activeSection: string;
  onSectionChange: (id: string) => void;
}

const GuideNavigation: React.FC<GuideNavigationProps> = ({
  sections,
  activeSection,
  onSectionChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredSections = sections.filter((section) =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSectionClick = (sectionId: string) => {
    onSectionChange(sectionId);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-blue-500 text-white p-3 rounded-lg shadow-lg hover:bg-blue-600 active:scale-95 transition-all"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )}
      </button>

      {/* Sidebar Navigation */}
      <div
        className={`
                fixed lg:static inset-y-0 left-0 z-40
                w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
                overflow-y-auto transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            Kullanıcı Rehberi
          </h2>
          <input
            type="text"
            placeholder="Rehberde ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <nav className="p-2">
          {filteredSections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleSectionClick(section.id)}
              className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-2">{section.icon}</span>
              <span className="text-sm font-medium">{section.title.replace(/^[^\s]+ /, '')}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default GuideNavigation;
