import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// Removed import Home from "./pages/Home";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";

function useAuth() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
      try {
        setLoggedInUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user data from localStorage", error);
        localStorage.removeItem('loggedInUser');
      }
    }
    setAuthLoading(false);
  }, []);

  const handleLogin = (user) => {
    setLoggedInUser(user);
    localStorage.setItem('loggedInUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    localStorage.removeItem('loggedInUser');
  };

  return { loggedInUser, authLoading, handleLogin, handleLogout };
}

function ProtectedRoute({ children, user }) {
  // If the user is not authenticated, redirect to the /login page,
  // which is now the main entry point.
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const { loggedInUser, authLoading, handleLogin, handleLogout } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* New Landing/Login Page - Anyone can access this, and it's the root path */}
        <Route
          path="/"
          element={
            // If the user is logged in, automatically redirect from the landing page to the dashboard
            loggedInUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AdminLogin setLoggedInUser={handleLogin} />
            )
          }
        />
        
        {/* Explicit /login route which now points to the same component as the root path */}
        <Route
          path="/login"
          element={<Navigate to="/" replace />} // Redirects /login to the root path
        />

        {/* Protected Dashboard Route - Only logged-in users can access this */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={loggedInUser}>
              <Dashboard user={loggedInUser} setLoggedInUser={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Catch-all route for any undefined paths, redirects to the Login/Landing Page */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;