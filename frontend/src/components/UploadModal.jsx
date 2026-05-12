import { useState, useRef } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, CircularProgress, Alert, IconButton,
} from '@mui/material'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { resumeApi } from '../services/api'

export default function UploadModal({ open, onClose }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const reset = () => { setFile(null); setSuccess(''); setError('') }
  const handleClose = () => { reset(); onClose() }

  const handleFile = (f) => {
    const allowed = ['.pdf', '.docx', '.doc']
    const ext = '.' + f.name.split('.').pop().toLowerCase()
    if (!allowed.includes(ext)) { setError('Only PDF and DOCX files are supported'); return }
    setFile(f); setError('')
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false)
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true); setError('')
    try {
      await resumeApi.upload(file)
      setSuccess(`"${file.name}" uploaded successfully!`)
      setFile(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#282b4a' }}>Upload Resume</Typography>
        <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent>
        {success ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 56, color: '#22c55e', mb: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#22c55e' }}>{success}</Typography>
            <Button onClick={reset} sx={{ mt: 2, color: '#282b4a' }}>Upload Another</Button>
          </Box>
        ) : (
          <>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Drop zone */}
            <Box
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current.click()}
              sx={{
                border: `2px dashed ${dragging ? '#f4c310' : '#d1d5db'}`,
                borderRadius: 2, p: 4, textAlign: 'center', cursor: 'pointer',
                bgcolor: dragging ? '#fffbeb' : '#f9fafb',
                transition: 'all 0.2s',
                '&:hover': { borderColor: '#282b4a', bgcolor: '#f0f1f8' },
              }}
            >
              <input ref={inputRef} type="file" accept=".pdf,.docx,.doc" hidden
                onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
              <CloudUploadOutlinedIcon sx={{ fontSize: 48, color: '#282b4a', mb: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#282b4a' }}>
                {file ? file.name : 'Drag & drop or click to select'}
              </Typography>
              <Typography variant="body2" color="text.secondary">PDF, DOCX or DOC files</Typography>
            </Box>
          </>
        )}
      </DialogContent>

      {!success && (
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button
            variant="contained" onClick={handleUpload}
            disabled={!file || loading}
            sx={{ bgcolor: '#282b4a', '&:hover': { bgcolor: '#1a1d32' }, minWidth: 120 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Upload'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  )
}
