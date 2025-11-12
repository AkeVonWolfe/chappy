import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createBrowserRouter, RouterProvider } from 'react-router'
import Login from './components/login.tsx'
import Register from './components/register.tsx'
import ChatApp from './components/chat.tsx'

//  createBrowserRouter
const router = createBrowserRouter([
  {
    path: '/',
    Component: App,
    children: [
      {
        index: true,
        Component: Login
      },
     {
      path: '/register',
      Component: Register,
     },
     {
      path: '/chat',
      Component: ChatApp,
     }

    ]
  }
])

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

createRoot(container).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>
);