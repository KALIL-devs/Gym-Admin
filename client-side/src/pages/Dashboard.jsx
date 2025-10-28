// src/pages/Dashboard.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

// Import the new pages/components
import ClientManagementPage from "./ClientManagementPage"; 
import MembershipRenewalPage from "./MembershipRenewalPage";
import RenewalHistoryLog from "./RenewalHistoryPage"; 
import MembershipDashboard from "../components/MembershipDashboard"; 

// Import the necessary modal/component overlays
import MessageBox from "../components/MessageBox";

import { useTheme } from "../context/ThemeContext";

import {
  RiCloseFill,
  RiSunLine,
  RiMoonLine,
  RiDashboardLine,
  RiUserLine,
  RiLogoutCircleRLine,
  RiNotification2Line,
} from "react-icons/ri";
import { FaMoneyBillWave } from "react-icons/fa"; 
import { HiOutlineDocumentText } from "react-icons/hi"; 

// --- Component Start ---

function Dashboard({ user, setLoggedInUser }) {
  const { isDarkMode, toggleTheme } = useTheme();

  const [clients, setClients] = useState([]);
  const [lastRollNo, setLastRollNo] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
    
  // State to track the client whose details modal should be open
  const [selectedClient, setSelectedClient] = useState(null);

  // ✅ Default page set to 'membership-status' instead of null
  const [activeModal, setActiveModal] = useState('membership-status'); 

  const [messageBox, setMessageBox] = useState({
    isVisible: false,
    message: "",
    type: "info",
    onConfirm: null,
  });
  
  // Track the count of clients needing attention for the sidebar badge
  const [attentionCount, setAttentionCount] = useState(0);

  const navigate = useNavigate();

  const handleLogout = () => {
    setLoggedInUser(null);
    navigate('/');
  };
    
  // --- Helper for calculating attention count ---
  const isClientNeedingAttention = (client) => {
    if (!client.endDate) return false; 
    const endDate = new Date(client.endDate); 
    const today = new Date();
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const daysDifference = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    return daysDifference <= 30 || (daysDifference < 0 && daysDifference >= -31);
  }

  const fetchClients = async () => {
    try {
      const response = await fetch("http://localhost:5000/admin/clients");
      if (response.ok) {
        const data = await response.json();
        const validClients = data.filter(c => c && c.uid); 
        
        setClients(validClients);

        const clientsNeedingAttention = validClients.filter(isClientNeedingAttention);
        setAttentionCount(clientsNeedingAttention.length);

        if (validClients.length > 0) {
          const latest = Math.max(...validClients.map((c) => c.rollno || 0));
          setLastRollNo(latest);
        }
      } else {
        console.error("Failed to fetch clients");
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  useEffect(() => {
    if (user) fetchClients();
  }, [user]);

  const handleAddUserSuccess = (newUserData) => {
    setClients((prev) => [...prev, newUserData]);
    setLastRollNo(newUserData.rollno);
    
    setMessageBox({
      isVisible: true,
      message: "✅ User created successfully!",
      type: "success",
    });
    fetchClients();
  };

  const handleClientUpdate = (updatedClient) => {
    console.log("Client update triggered, refetching clients...");
    setSelectedClient(null); 
    fetchClients();
  };

  const handleClientDelete = (uid) => {
    setClients((prev) => prev.filter((c) => c?.uid !== uid)); 
    setSelectedClient(null);
    fetchClients();
  };

  const handleClientClick = (client) => {
    setSelectedClient(client);
  };

  const handleCloseClientModal = () => {
    setSelectedClient(null);
  };

  // --- UPDATED FILTERING LOGIC ---
  const filteredClients = (Array.isArray(clients) ? clients : [])
    .filter((c) => {
      if (!c || !c.name || !c.rollno || !c.endDate) return false; 
      
      const lowerCaseSearchTerm = searchTerm.toLowerCase();

      // 🎯 FIX: Check if search term matches Name OR Roll No.
      const isNameMatch = c.name.toLowerCase().includes(lowerCaseSearchTerm);
      const isRollNoMatch = String(c.rollno).toLowerCase().includes(lowerCaseSearchTerm);
      
      const isSearchMatch = isNameMatch || isRollNoMatch; // The key change!
      
      if (!isSearchMatch) return false;
      
      // Existing status filtering logic remains
      const endDate = new Date(c.endDate); 
      const today = new Date();
      // Calculate days difference by comparing date objects
      const daysDifference = (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

      if (filterStatus === "active") {
        return daysDifference >= 0;
      }
      if (filterStatus === "expired") {
        return daysDifference < 0;
      }
      
      return true;
    })
    .sort((a, b) => (a.rollno || 0) - (b.rollno || 0));
// -----------------------------------


  return (
    <div className="flex min-h-screen bg-dark-bg text-dark-text dark:bg-light-bg dark:text-light-text">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 z-50 h-screen w-64 hidden sm:flex flex-col bg-dark-card dark:bg-light-card shadow-xl">
        <div className="p-6 font-bold text-2xl text-dark-accent dark:text-light-accent">
          GYM ADMIN
        </div>
        <nav className="flex-1 px-4 space-y-3 overflow-y-auto">
          
          {/* 1. MEMBERSHIP STATUS */}
          <button
            className={`flex items-center gap-3 w-full p-3 rounded-lg hover:bg-dark-accent hover:text-white dark:hover:bg-light-accent ${activeModal === 'membership-status' ? 'bg-dark-accent text-white dark:bg-light-accent' : ''}`}
            onClick={() => setActiveModal('membership-status')} 
          >
            <RiNotification2Line /> Membership 
          </button>

          {/* 2. CLIENTS */}
          <button
            className={`flex items-center gap-3 w-full p-3 rounded-lg hover:bg-dark-accent hover:text-white dark:hover:bg-light-accent ${activeModal === null ? 'bg-dark-accent text-white dark:bg-light-accent' : ''}`}
            onClick={() => setActiveModal(null)} 
          >
            <RiDashboardLine /> Clients
          </button>
          
          {/* 3. RENEW MEMBERSHIP */}
          <button
            className={`flex items-center gap-3 w-full p-3 rounded-lg hover:bg-dark-accent hover:text-white dark:hover:bg-light-accent ${activeModal === 'renew-membership' ? 'bg-dark-accent text-white dark:bg-light-accent' : ''}`}
            onClick={() => setActiveModal('renew-membership')}
          >
            <FaMoneyBillWave /> Renew Membership
          </button>
          
          {/* 4. RENEWAL HISTORY */}
          <button
            className={`flex items-center gap-3 w-full p-3 rounded-lg hover:bg-dark-accent hover:text-white dark:hover:bg-light-accent ${activeModal === 'renewal-log' ? 'bg-dark-accent text-white dark:bg-light-accent' : ''}`}
            onClick={() => setActiveModal('renewal-log')} 
          >
            <HiOutlineDocumentText /> Renewal History
          </button>
          
        </nav>
        <div className="p-4 border-t border-gray-700 dark:border-gray-300">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
          >
            <RiLogoutCircleRLine /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col sm:pl-64">
        {/* Topbar */}
        <header className="flex justify-between items-center px-6 py-4 shadow-md bg-dark-card dark:bg-light-card">
          <h1 className="text-xl font-semibold text-dark-accent dark:text-light-accent">
            {activeModal === 'renew-membership' 
                ? 'Membership Renewal' 
                : activeModal === 'renewal-log'
                ? 'Renewal History'
                : activeModal === 'membership-status' 
                ? 'Membership Status Dashboard'
                : 'Client Management Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-dark-accent hover:text-white dark:hover:bg-light-accent"
            >
              {isDarkMode ? (
                <RiMoonLine className="h-5 w-5" />
              ) : (
                <RiSunLine className="h-5 w-5" />
              )}
            </button>
          </div>
        </header>

        {/* CONDITIONAL PAGE RENDERING */}
        {activeModal === null && (
          <ClientManagementPage
            clients={clients}
            filteredClients={filteredClients}
            onFilter={setFilterStatus}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            lastRollNo={lastRollNo}
            onAddSuccess={handleAddUserSuccess}
            setMessageBox={setMessageBox}
            selectedClient={selectedClient}
            onClientClick={handleClientClick}
            onCloseClientModal={handleCloseClientModal}
            onUpdateClient={handleClientUpdate}
            onDeleteClient={handleClientDelete}
          />
        )}
        
        {activeModal === 'renew-membership' && (
            <MembershipRenewalPage
                clients={clients}
                setMessageBox={setMessageBox}
                onClientUpdate={handleClientUpdate}
            />
        )}
        
        {activeModal === 'renewal-log' && (
            <div className="flex-1 overflow-auto">
                <RenewalHistoryLog />
            </div>
        )}
        
        {activeModal === 'membership-status' && (
            <MembershipDashboard clients={clients} /> 
        )}

      </main>

      {/* Modals */}
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

export default Dashboard;