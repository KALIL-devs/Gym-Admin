// src/pages/ClientManagementPage.jsx
import React, { useState } from "react";
import DashboardStats from "../components/DashboardStats";
import ClientSearch from "../components/ClientSearch";
import ClientList from "../components/ClientList";
import AddUserForm from "../components/AddUserForm"; 
import ClientDetailsModal from "../components/ClientDetailsModal";
import { RiUserAddLine } from 'react-icons/ri'; 

function ClientManagementPage({ 
    clients, 
    filteredClients, 
    onFilter, 
    // 🌟 FIX 1: Expect the activeFilter state from the parent
    activeFilter, 
    searchTerm, 
    onSearchChange,
    selectedClient, 
    onClientClick, 
    onCloseClientModal, 
    onUpdateClient, 
    onDeleteClient, 
    lastRollNo,
    onAddSuccess,
    setMessageBox
}) {
    // State to manage the visibility of the AddUserForm
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    
    // 💥 REMOVED: activeDashboardFilter state is removed.
    // The filter state will now be managed by the parent component and passed via props.

    // Handler to update the filter state and call the parent's filter logic
    const handleFilterUpdate = (filterValue) => {
        // 1. We no longer update local state.
        // 2. Call the parent's onFilter function (to update the main client list and the parent's activeFilter state)
        onFilter(filterValue);
    };

    // Handler to wrap the parent's success function and close the local modal
    const handleLocalAddSuccess = (newClient) => {
        onAddSuccess(newClient); 
        setIsAddUserModalOpen(false); // Close the modal upon success
    };

    return (
        <div className="p-6">
            
            {/* Dashboard Stats Section */}
            {/* 🌟 FIX 2: Pass the activeFilter prop directly to DashboardStats */}
            <DashboardStats 
                clients={clients} 
                onFilter={handleFilterUpdate} 
                activeFilter={activeFilter} 
            />
            
            {/* Client List Section (Search and Table) */}
            <section className="mt-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-semibold text-dark-accent dark:text-light-accent">
                        Client List
                    </h3>
                    
                    {/* ADD USER BUTTON */}
                    <button
                        onClick={() => setIsAddUserModalOpen(true)}
                        className="flex items-center gap-2 bg-dark-accent dark:bg-light-accent text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                    >
                        <RiUserAddLine className="w-5 h-5" />
                        Add New Client
                    </button>
                    
                </div>
                
                <div className="bg-dark-card p-6 rounded-lg shadow-xl dark:bg-light-card">
                    <ClientSearch
                        searchTerm={searchTerm}
                        onSearchChange={onSearchChange}
                    />
                    <ClientList 
                        clients={filteredClients} 
                        onClientClick={onClientClick}
                    />
                </div>
            </section>
            
            {/* RENDER ADDUSERFORM CONDITIONALLY */}
            {isAddUserModalOpen && (
                <AddUserForm
                    lastRollNo={lastRollNo}
                    onClose={() => setIsAddUserModalOpen(false)}
                    onAddSuccess={handleLocalAddSuccess}
                    setMessageBox={setMessageBox}
                    clients={clients}
                />
            )}

            {/* RENDER CLIENTDETAILMODAL CONDITIONALLY */}
            {selectedClient && (
                <ClientDetailsModal 
                    client={selectedClient} 
                    onClose={onCloseClientModal}
                    onUpdate={onUpdateClient} 
                    onDelete={onDeleteClient} 
                    setMessageBox={setMessageBox}
                />
            )}
        </div>
    );
}

export default ClientManagementPage;