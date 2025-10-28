import React from 'react';

function DashboardStats({ clients, onFilter, activeFilter }) {
  const totalClients = clients.length;
  const activeClients = clients.filter(
    (client) => client.status === 'active' || client.status === 'expiring soon'
  ).length;
  const expiredClients = clients.filter(
    (client) => client.status === 'expired'
  ).length;

  // Base classes for the card (p-6, rounded, shadow, cursor, transition)
  const baseCardClasses = "p-6 rounded-lg shadow-lg flex-1 min-w-[150px] text-center cursor-pointer transition-colors";
  const statTextClasses = "text-3xl font-bold";
  const labelClasses = "mt-2 text-dark-text/75 text-sm font-medium dark:text-light-text/75";

  // Default (unselected) background and hover classes
  const unselectedBg = "bg-dark-card hover:bg-gray-800 dark:bg-light-card dark:hover:bg-gray-100";

  // Function to determine the class name based on selection
  const getCardClasses = (filterValue, selectedBgClasses) => {
    const isSelected = activeFilter === filterValue;
    
    // If selected, use the passed transparent background color
    // If NOT selected, use the default unselected background and hover
    return `${baseCardClasses} ${isSelected ? selectedBgClasses : unselectedBg}`;
  };

  return (
    <div className="flex flex-wrap justify-between gap-4 mb-8">
      
      {/* Total Clients Card */}
      <div 
        // Use the accent color with 10% opacity for the background when selected
        className={getCardClasses('', "bg-dark-accent/10 dark:bg-light-accent/10")} 
        onClick={() => onFilter('')}
      >
        <div className={`${statTextClasses} text-dark-accent dark:text-light-accent`}>{totalClients}</div>
        <div className={labelClasses}>Total Clients</div>
      </div>

      {/* Active Clients Card */}
      <div 
        // Use the active status color with 10% opacity for the background when selected
        className={getCardClasses('active', "bg-status-active/10")} 
        onClick={() => onFilter('active')}
      >
        <div className={`${statTextClasses} text-status-active`}>{activeClients}</div>
        <div className={labelClasses}>Active Clients</div>
      </div>

      {/* Expired Clients Card */}
      <div 
        // Use the expired status color with 10% opacity for the background when selected
        className={getCardClasses('expired', "bg-status-expired/10")} 
        onClick={() => onFilter('expired')}
      >
        <div className={`${statTextClasses} text-status-expired`}>{expiredClients}</div>
        <div className={labelClasses}>Expired</div>
      </div>
    </div>
  );
}

export default DashboardStats;