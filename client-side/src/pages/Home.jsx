// src/pages/Home.jsx (Corrected)

import React, { useState, useEffect } from "react";
import DashboardStats from "../components/DashboardStats";
import ClientSearch from "../components/ClientSearch";
import ClientList from "../components/ClientList";
import ClientDetailsModal from "../components/ClientDetailsModal";
import MessageBox from "../components/MessageBox";
// ⭐ REMOVED: import NotificationList from "../components/NotificationList";
import { useNavigate } from 'react-router-dom';

import {
  RiCloseFill,
  RiDashboardLine,
  RiNotification2Line,
  RiLoginCircleLine,
} from "react-icons/ri";

// Helper function to determine if a client needs attention (e.g., for the sidebar badge)
const isClientNeedingAttention = (client) => {
    if (!client.membershipEndDate) return false;
    const endDate = new Date(client.membershipEndDate);
    const today = new Date();
    
    // Set both to midnight for day comparison
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const daysDifference = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    // Needing Attention: Expires today, expiring within 30 days, or expired up to 31 days ago.
    return daysDifference <= 30 || (daysDifference < 0 && daysDifference >= -31);
}

function Home() {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [messageBox, setMessageBox] = useState({
    isVisible: false,
    message: "",
    type: "info",
    onConfirm: null,
  });
  // ⭐ UPDATED: We use a simple count now, not a full list state
  const [attentionCount, setAttentionCount] = useState(0); 
  const navigate = useNavigate();

  const fetchClients = async () => {
    try {
      const response = await fetch("http://localhost:5000/admin/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data);

        // ⭐ UPDATED LOGIC: Calculate attention count based on date
        const clientsNeedingAttention = data.filter(isClientNeedingAttention);
        setAttentionCount(clientsNeedingAttention.length);
        
      } else {
        console.error("Failed to fetch clients");
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleClientUpdate = (updatedClient) => {
    // Optimistically update the list
    setClients((prev) =>
      prev.map((c) => (c.uid === updatedClient.uid ? updatedClient : c))
    );
    // Refetch to ensure state is accurate, especially if status/dates changed
    fetchClients(); 
  };

  const handleClientDelete = (uid) => {
    setClients((prev) => prev.filter((c) => c.uid !== uid));
    setActiveModal(null);
    fetchClients(); 
  };

  const handleClientClick = (client) => {
    setSelectedClient(client);
    setActiveModal('client-details');
  };

  // ⭐ UPDATED FILTERING: Must use membershipEndDate since status is removed from backend response
  const filteredClients = clients
    .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((c) => {
        if (!c.membershipEndDate) return false;
        
        const endDate = new Date(c.membershipEndDate);
        const today = new Date();
        const daysDifference = (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

      if (filterStatus === "active") {
        // Active means membership is NOT expired (diff >= 0)
        return daysDifference >= 0;
      }
      if (filterStatus === "expired") {
        // Expired means membership is in the past (diff < 0)
        return daysDifference < 0;
      }
      return true;
    })
    .sort((a, b) => (a.rollno || 0) - (b.rollno || 0));

  return (
    <div className="flex min-h-screen bg-light-bg text-light-text font-sans">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 z-50 h-screen w-64 hidden sm:flex flex-col bg-light-card border-r border-gray-200 shadow-lg">
        <div className="p-6 font-bold text-2xl text-light-accent">
          Admin Dashboard
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <button
            className="flex items-center gap-3 w-full p-3 rounded-lg text-light-text hover:bg-gray-100 transition-colors duration-200"
            onClick={() => setActiveModal(null)}
          >
            <RiDashboardLine className="w-5 h-5" /> Dashboard
          </button>
          <button
            className="flex items-center gap-3 w-full p-3 rounded-lg text-light-text hover:bg-gray-100 transition-colors duration-200"
            // ⭐ UPDATED: Keep the button but change the functionality to show the client details modal
            onClick={() => setActiveModal('notifications')}
          >
            <RiNotification2Line className="w-5 h-5" /> Notifications
            {attentionCount > 0 && ( // Use the new attentionCount
              <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {attentionCount}
              </span>
            )}
          </button>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center justify-center gap-3 w-full p-3 rounded-lg bg-light-accent text-white font-semibold hover:bg-orange-600 transition-colors duration-200"
          >
            <RiLoginCircleLine className="w-5 h-5" /> Login
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col sm:pl-64">
        {/* Topbar */}
        <header className="flex justify-between items-center px-6 py-4 bg-light-card border-b border-gray-200">
          <h1 className="text-xl font-semibold text-light-text-highlight">
            Dashboard
          </h1>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          <DashboardStats clients={clients} onFilter={setFilterStatus} />
          <section className="mt-8">
            <h3 className="text-2xl font-semibold mb-6 text-light-text-highlight">
              Client List
            </h3>
            <div className="bg-light-card p-6 rounded-lg shadow-sm border border-gray-200">
              <ClientSearch
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
              <ClientList clients={filteredClients} onClientClick={handleClientClick} />
            </div>
          </section>
        </div>
      </main>

      {/* Modals and Drawers - Conditionally Rendered */}
      {/* ⭐ REMOVED: The old 'notifications' drawer UI block is removed */}

      {activeModal === 'client-details' && selectedClient && (
        <ClientDetailsModal
          client={selectedClient}
          onClose={() => setActiveModal(null)}
          onUpdate={handleClientUpdate}
          onDelete={handleClientDelete}
          setMessageBox={setMessageBox}
        />
      )}

      {messageBox.isVisible && (
        <MessageBox
          message={messageBox.message}
          type={messageBox.type}
          onClose={() => setMessageBox({ isVisible: false, message: "" })}
          onConfirm={messageBox.onConfirm}
        />
      )}
    </div>
  );
}

export default Home;