import React, { useState } from 'react';
import './login.css'

const Register = () => {

const [username, setUsername] = useState('');
const [password, setPassword] = useState('');

const goToLogin = () => {
  
  console.log('Logging in with', { username, password });
}

const registerButton = () => {
    console.log('Registering with', { username, password });    
}


  return (
    <div className="login-container">
      <h1>Welcome</h1>
      
      <div className="input-group">
        <label htmlFor="username">Username</label>
        <input
          type="text"
          id="username"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
        <button className="btn-back" onClick={goToLogin}>
          Login
        </button>
        <button className="btn-register" onClick={registerButton}>
          Register
        </button>
        
      </div>
    </div>
  );
};

export default Register;