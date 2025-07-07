



// =====================================================================
// src/components/ui/Tab.jsx
// =====================================================================
import React from 'react';

const Tab = ({ id, label, icon: Icon, activeTab, setActiveTab }) => {
  const isActive = activeTab === id;
  return (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-3 py-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors duration-200
        ${isActive 
          ? 'border-blue-500 text-blue-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
};

export default Tab;