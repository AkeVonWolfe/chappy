import React, { useState } from "react";
import "./login.css";
import { useNavigate } from "react-router";

const Login = () => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!name || !password) {  //  validate inputs
      console.log("Please enter both name and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:1337/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {  // check if login was successful
        console.log(data.message || "Invalid credentials");
        return;
      }

      // Save token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/chat");
    } catch (err) {
      console.error("Login error:", err);
      console.log("Login failed, please try again.");
    } finally {
      setLoading(false);  // reset loading state
    }
  };

  const handleGuest = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/chat");
  };

//   const handleRegister = () => {
//     navigate("/register");
//   };

  return (
    <>
      <div className="login-container">
        <h1>Login</h1>

        <div className="input-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="button-group">
          <button onClick={handleLogin} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

        <div className="register-group">
          <button onClick={() => navigate("/register")}>Register</button>
         </div>

          <button onClick={handleGuest}>Continue as Guest</button>


        </div>
      </div>
    </>
  );
};

export default Login;