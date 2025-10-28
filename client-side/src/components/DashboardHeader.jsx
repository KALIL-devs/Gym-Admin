import React from 'react';
import { useNavigate } from 'react-router-dom';

function DashboardHeader({ user, onAddUser, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    onLogout(null);
    navigate('/admin-login');
  };

  return (
    <header className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8">
      <h2 className="text-3xl font-bold text-teal-500 mb-4 sm:mb-0">
        Welcome, {user?.name || 'Admin'} 👋
      </h2>
      <div className="flex gap-2">
        <button
          onClick={onAddUser}
          className="bg-teal-500 text-slate-950 px-4 py-2 rounded-lg font-semibold hover:bg-teal-400 transition-colors"
        >
          Add User
        </button>
        <button
          onClick={handleLogout}
          className="bg-slate-700 text-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-slate-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default DashboardHeader;