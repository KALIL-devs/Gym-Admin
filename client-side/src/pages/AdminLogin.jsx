import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminLogin({ setLoggedInUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  // NEW STATE: To toggle password visibility
  const [showPassword, setShowPassword] = useState(false); 
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        const loggedInUserData = {
          role: data.user.role, 
          email: data.user.email,
          token: data.token 
        };

        localStorage.setItem("loggedInUser", JSON.stringify(loggedInUserData));
        setLoggedInUser(loggedInUserData);
        navigate("/dashboard");
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || "❌ Login failed. Invalid credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("❌ Network error. Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 text-gray-200">
      <div className="bg-slate-900 shadow-lg rounded-2xl p-8 w-96 border-4 border-orange-500">
        <h2 className="text-2xl font-bold text-center mb-6 text-orange-500">
          Admin Login
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          {/* PASSWORD INPUT FIELD WITH TEXT TOGGLE BUTTON */}
          <div className="relative">
            <input
              // Conditional type based on showPassword state
              type={showPassword ? "text" : "password"}
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              // Increased padding-right (pr-16) to fit the "Show/Hide" text
              className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 pr-16"
            />
            {/* Toggle Button as Text */}
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm font-semibold text-orange-500 hover:text-orange-400 transition duration-150"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {/* Conditional Text based on showPassword state */}
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {/* END OF PASSWORD INPUT FIELD */}

          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 font-semibold transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login as Admin"}
          </button>
        </form>

        {message && <p className="mt-4 text-center text-red-400">{message}</p>}
      </div>
    </div>
  );
}

export default AdminLogin;