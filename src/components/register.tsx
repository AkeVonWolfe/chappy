import React, { useState } from "react";
import "./login.css";
import { useNavigate } from "react-router";

const Register = () => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!name || !password) {
      console.log("Please fill in both fields");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:1337/register/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        console.log(data.message || "Failed to register user");
        return;
      }

      console.log("Registered successfully! You can now log in.");
      navigate("/");
    } catch (error) {
      console.error("Error registering:", error);
      console.log("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="login-container">
      <h1>Create Account</h1>

      <div className="input-group">
        <label htmlFor="name">Username</label>
        <input
          type="text"
          id="name"
          placeholder="Choose a username"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="input-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="button-group">
        <button className="btn-back" onClick={goToLogin}>
          Back to Login
        </button>
        <button className="btn-register" onClick={handleRegister} disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </div>
    </div>
  );
};

export default Register;
