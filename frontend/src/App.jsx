import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ChatPage from './pages/ChatPage'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const token = localStorage.getItem('token')
  return !token ? children : <Navigate to="/chat" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
      <Route path="/chat/:chatId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  )
}
