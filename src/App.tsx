import React, { useEffect, useState } from "react";
import "./App.css";


import { Outlet } from 'react-router'

function App() {


 

  return (
    <div className="app">
      
      <main className="main-content">
        <Outlet /> 
      </main>
      
    </div>
  )
}

export default App