// src/components/ClientList.jsx
import React, { useState, useMemo } from 'react';

// You can adjust this value as needed
const CLIENTS_PER_PAGE = 10; 

// --- ClientTableRow Component ---
// This replaces the ClientCard component
function ClientTableRow({ client, onClick }) {
  // Determine the status text color class
  const statusClass = 
    client.status === 'active'
      ? 'bg-status-active/20 text-status-active'
      : client.status === 'expiring soon'
      ? 'bg-status-expiring/20 text-status-expiring'
      : 'bg-status-expired/20 text-status-expired';

  return (
    <tr
      onClick={() => onClick(client)}
      // Tailwind classes for the row
      className="border-b border-dark-text-highlight/10 dark:border-light-text/10 
                 hover:bg-gray-800/50 dark:hover:bg-gray-200/50 transition-all cursor-pointer"
    >
      {/* Roll No */}
      <td className="py-3 px-4 font-mono text-dark-accent dark:text-light-accent">
        {client.rollno}
      </td>
      
      {/* Name */}
      <td className="py-3 px-4 font-semibold">
        {client.name}
      </td>
      
      {/* Membership Type */}
      <td className="py-3 px-4 text-gray-400 dark:text-gray-500 hidden sm:table-cell">
        {client.membershipType}
      </td>
      
      {/* 🎯 NEW: End Date */}
      <td className="py-3 px-4 text-gray-400 dark:text-gray-500 hidden sm:table-cell">
        {client.endDate} 
      </td>
      
      {/* Status */}
      <td className="py-3 px-4 text-right">
        <span
          className={`font-semibold uppercase text-xs px-3 py-1 rounded-full ${statusClass}`}
        >
          {client.status}
        </span>
      </td>
    </tr>
  );
}

// --- ClientList Component with Table and Pagination ---
function ClientList({ clients, onClientClick }) {
  // State for the current page number (starts at 1)
  const [currentPage, setCurrentPage] = useState(1);
  
  // Calculate total pages
  const totalPages = Math.ceil(clients.length / CLIENTS_PER_PAGE);

  // Calculate the subset of clients to display (same pagination logic)
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * CLIENTS_PER_PAGE;
    const endIndex = startIndex + CLIENTS_PER_PAGE;
    return clients.slice(startIndex, endIndex);
  }, [clients, currentPage]);

  // Handler functions for pagination buttons
  const goToNextPage = () => {
    setCurrentPage(prevPage => Math.min(prevPage + 1, totalPages));
  };

  const goToPrevPage = () => {
    setCurrentPage(prevPage => Math.max(prevPage - 1, 1));
  };

  if (clients.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 p-8">
        No clients found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 bg-dark-card dark:bg-light-card rounded-lg shadow-lg overflow-hidden">
      
      {/* --- Client Table --- */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-dark-text-highlight/20 dark:divide-light-text/20">
          
          {/* Table Header */}
          <thead className="bg-gray-900 dark:bg-gray-100 text-dark-text-highlight dark:text-light-text-highlight">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">
                Roll No
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">
                Name
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider hidden sm:table-cell">
                Membership
              </th>
              {/* 🎯 NEW: End Date Header */}
              <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider hidden sm:table-cell">
                End Date
              </th>
              <th className="py-3 px-4 text-right text-xs font-medium uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          
          {/* Table Body */}
          <tbody className="divide-y divide-dark-text-highlight/5 dark:divide-light-text/5 text-dark-text dark:text-light-text">
            {paginatedClients.map((client) => (
              <ClientTableRow key={client.uid} client={client} onClick={onClientClick} />
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Pagination Controls (Same as before) --- */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-4 py-3 border-t border-dark-text-highlight/20 dark:border-light-text/20">
          
          {/* Previous Button */}
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className="px-4 py-2 text-dark-accent dark:text-light-accent font-semibold rounded-md transition-colors 
                       disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-text-highlight/10 dark:hover:bg-light-text/10"
          >
            &larr; Previous
          </button>

          {/* Page Info */}
          <span className="text-dark-text dark:text-light-text text-sm">
            Page <b className="text-dark-accent dark:text-light-accent">{currentPage}</b> of <b>{totalPages}</b>
          </span>

          {/* Next Button */}
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-dark-accent dark:text-light-accent font-semibold rounded-md transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-text-highlight/10 dark:hover:bg-light-text/10"
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
}

export default ClientList;