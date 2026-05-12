import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, Divider,
} from '@mui/material'
import { authApi } from '../services/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.login(form)
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/chat')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #282b4a 0%, #3d4270 100%)',
    }}>
      <Card sx={{ width: '100%', maxWidth: 420, mx: 2, borderRadius: 3, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <img src="/logo.png" alt="Logo" style={{ height: 64, objectFit: 'contain' }} />
            <Typography variant="h6" sx={{ mt: 1, fontWeight: 700, color: '#282b4a' }}>
              Profile Matcher AI
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to your account
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Email" name="email" type="email"
              value={form.email} onChange={handleChange}
              required sx={{ mb: 2 }}
            />
            <TextField
              fullWidth label="Password" name="password" type="password"
              value={form.password} onChange={handleChange}
              required sx={{ mb: 3 }}
            />
            <Button
              type="submit" fullWidth variant="contained" size="large"
              disabled={loading}
              sx={{
                bgcolor: '#282b4a', '&:hover': { bgcolor: '#1a1d32' },
                py: 1.5, fontSize: '1rem',
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#f4c310', fontWeight: 600, textDecoration: 'none' }}>
                Create one
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
