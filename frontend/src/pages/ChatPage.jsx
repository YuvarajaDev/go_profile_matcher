import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box, TextField, IconButton, Tooltip, Typography,
  AppBar, Toolbar, Button, CircularProgress,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined'
import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'
import UploadModal from '../components/UploadModal'
import { chatApi } from '../services/api'

export default function ChatPage() {
  const { chatId } = useParams()
  const navigate = useNavigate()

  const [chats, setChats] = useState([])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [loadingChats, setLoadingChats] = useState(false)

  // Load chat list
  const loadChats = useCallback(async () => {
    setLoadingChats(true)
    try {
      const { data } = await chatApi.list()
      setChats(data)
      // If no chatId in URL, navigate to most recent or create new
      if (!chatId) {
        if (data.length > 0) navigate(`/chat/${data[0].id}`, { replace: true })
        else handleNewChat()
      }
    } catch (err) {
      console.error('Failed to load chats', err)
    } finally {
      setLoadingChats(false)
    }
  }, [chatId])

  // Load messages for current chat
  const loadMessages = useCallback(async () => {
    if (!chatId) return
    try {
      const { data } = await chatApi.get(chatId)
      setMessages(data.messages)
    } catch (err) {
      console.error('Failed to load messages', err)
    }
  }, [chatId])

  useEffect(() => { loadChats() }, [])
  useEffect(() => { setMessages([]); loadMessages() }, [chatId])

  const handleNewChat = async () => {
    try {
      const { data } = await chatApi.create()
      setChats((prev) => [data, ...prev])
      navigate(`/chat/${data.id}`)
    } catch (err) {
      console.error('Failed to create chat', err)
    }
  }

  const handleDeleteChat = async (id) => {
    try {
      await chatApi.delete(id)
      const updated = chats.filter((c) => c.id !== id)
      setChats(updated)
      if (String(id) === chatId) {
        if (updated.length > 0) navigate(`/chat/${updated[0].id}`)
        else handleNewChat()
      }
    } catch (err) {
      console.error('Failed to delete chat', err)
    }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading || !chatId) return

    setInput('')
    setIsLoading(true)

    // Optimistic user message
    const tempId = Date.now()
    setMessages((prev) => [...prev, { id: tempId, role: 'user', content: text }])

    // Update sidebar title if this is first message
    setChats((prev) => prev.map((c) =>
      String(c.id) === chatId && c.title === 'New Chat'
        ? { ...c, title: text.slice(0, 60) }
        : c
    ))

    try {
      const { data } = await chatApi.send(chatId, { message: text })
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: 'assistant', content: data },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(), role: 'assistant',
          content: { error: err.response?.data?.detail || 'Something went wrong. Please try again.' },
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f5f6fa' }}>
      <Sidebar
        chats={chats}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        loading={loadingChats}
      />

      {/* Main area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Navbar */}
        <AppBar position="static" elevation={0} sx={{
          bgcolor: '#fff', borderBottom: '1px solid #e5e7eb',
        }}>
          <Toolbar sx={{ justifyContent: 'space-between', minHeight: '56px !important', px: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#282b4a' }}>
              {chats.find((c) => String(c.id) === chatId)?.title || 'Profile Matcher AI'}
            </Typography>
            <Button
              variant="contained" startIcon={<FileUploadOutlinedIcon />}
              onClick={() => setUploadOpen(true)}
              sx={{
                bgcolor: '#f4c310', color: '#282b4a',
                '&:hover': { bgcolor: '#e6b800' },
                fontWeight: 700, borderRadius: 2,
              }}
            >
              Upload Resume
            </Button>
          </Toolbar>
        </AppBar>

        {/* Chat window */}
        <ChatWindow messages={messages} isLoading={isLoading} />

        {/* Input area */}
        <Box sx={{
          px: 3, py: 2, bgcolor: '#fff', borderTop: '1px solid #e5e7eb',
        }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end', maxWidth: 800, mx: 'auto' }}>
            <TextField
              fullWidth multiline maxRows={6}
              placeholder="Paste a Job Description or describe the profile you're looking for..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  '&.Mui-focused fieldset': { borderColor: '#282b4a' },
                },
              }}
            />
            <Tooltip title="Send (Enter)">
              <span>
                <IconButton
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  sx={{
                    bgcolor: '#282b4a', color: '#fff',
                    width: 48, height: 48, borderRadius: 2, flexShrink: 0,
                    '&:hover': { bgcolor: '#1a1d32' },
                    '&:disabled': { bgcolor: '#d1d5db', color: '#9ca3af' },
                  }}
                >
                  {isLoading
                    ? <CircularProgress size={20} sx={{ color: '#fff' }} />
                    : <SendIcon sx={{ fontSize: 20 }} />
                  }
                </IconButton>
              </span>
            </Tooltip>
          </Box>
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, color: '#9ca3af' }}>
            Press Enter to send · Shift+Enter for new line
          </Typography>
        </Box>
      </Box>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </Box>
  )
}
