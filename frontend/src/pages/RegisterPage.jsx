import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, Divider,
} from '@mui/material'
import { authApi } from '../services/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const { data } = await authApi.register({ name: form.name, email: form.email, password: form.password })
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/chat')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
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
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <img src="/logo.png" alt="Logo" style={{ height: 64, objectFit: 'contain' }} />
            <Typography variant="h6" sx={{ mt: 1, fontWeight: 700, color: '#282b4a' }}>
              Profile Matcher AI
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your account
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Full Name" name="name"
              value={form.name} onChange={handleChange}
              required sx={{ mb: 2 }}
            />
            <TextField
              fullWidth label="Email" name="email" type="email"
              value={form.email} onChange={handleChange}
              required sx={{ mb: 2 }}
            />
            <TextField
              fullWidth label="Password" name="password" type="password"
              value={form.password} onChange={handleChange}
              required sx={{ mb: 2 }}
            />
            <TextField
              fullWidth label="Confirm Password" name="confirm" type="password"
              value={form.confirm} onChange={handleChange}
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
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#f4c310', fontWeight: 600, textDecoration: 'none' }}>
                Sign in
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
