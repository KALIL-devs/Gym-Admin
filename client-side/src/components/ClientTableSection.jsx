// src/components/ClientTableSection.jsx
import React from 'react';
import { StatusPill } from './StatusPill'; // Import the new StatusPill component

/**
 * Renders a section of the client table (e.g., Active or Renewal Needed).
 * It displays clients filtered by the search term and handles selection.
 */
export const ClientTableSection = React.memo(({ title, clients, selectedClient, handleClientSelect, searchTerm, type }) => {
    const isRenewalNeeded = type === 'renewalNeeded';
    const isNoClients = clients.length === 0;

    return (
        <div className="mb-6 bg-white shadow-lg rounded-xl transition-shadow duration-300 border border-gray-100">
            <h3 className={`text-xl font-bold p-4 rounded-t-xl ${isRenewalNeeded ? 'text-red-600' : 'text-gray-800'} border-b border-gray-200`}>
                {title} ({clients.length})
            </h3>
            <div className="p-4 overflow-y-auto max-h-[400px]">
                {/* Handling Empty States */}
                {isNoClients && searchTerm === '' ? (
                    <div className="text-center py-8 text-gray-500">
                        <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {isRenewalNeeded ? "No inactive members found." : "No active members found."}
                    </div>
                ) : isNoClients && searchTerm !== '' ? (
                    <div className="text-center py-8 text-gray-500">
                        No clients found matching "<span className="font-semibold">{searchTerm}</span>".
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="sticky top-0 bg-white shadow-sm">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-1/6">Roll No</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-2/6">Name</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-2/6">End Date</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-1/6">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {clients.map((client) => (
                                    <tr 
                                        key={client.id} 
                                        onClick={() => handleClientSelect(client)}
                                        className={`cursor-pointer transition-colors duration-200 ${
                                            selectedClient?.id === client.id 
                                                ? 'bg-amber-50 border-l-4 border-amber-600' 
                                                : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <td className="px-4 py-3 text-sm font-semibold text-amber-700">{client.rollno}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{client.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{client.membershipEnd || 'N/A'}</td>
                                        <td className="px-4 py-3 text-sm"><StatusPill status={client.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
});