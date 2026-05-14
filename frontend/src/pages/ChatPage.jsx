import { useState, useEffect } from 'react'
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
  const [chats, setChats] = useState([])
  const [messages, setMessages] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingChats, setLoadingChats] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)

  // On mount: load chat list + restore chat from URL if present
  useEffect(() => {
    const init = async () => {
      setLoadingChats(true)
      try {
        const { data } = await chatApi.list()
        setChats(data)
        // UUID in URL: /chat/<uuid>
        const match = window.location.pathname.match(/^\/chat\/([a-f0-9-]{36})$/)
        if (match) {
          const urlChatId = match[1]
          const exists = data.find((c) => c.id === urlChatId)
          if (exists) await selectChat(urlChatId, false)
        }
      } catch (err) {
        console.error('Failed to load chats', err)
      } finally {
        setLoadingChats(false)
      }
    }
    init()
  }, [])

  const selectChat = async (chatId, pushUrl = true) => {
    if (isLoading) return
    setActiveChatId(chatId)
    setMessages([])
    if (pushUrl) window.history.pushState({}, '', `/chat/${chatId}`)
    try {
      const { data } = await chatApi.get(chatId)
      setMessages(data.messages)
    } catch (err) {
      console.error('Failed to load messages', err)
    }
  }

  const startNewChat = () => {
    if (isLoading) return
    setActiveChatId(null)
    setMessages([])
    setInput('')
    window.history.pushState({}, '', '/chat')
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    setInput('')
    setIsLoading(true)

    // Lazy chat creation — only on first message (ChatGPT style)
    let currentChatId = activeChatId
    if (!currentChatId) {
      try {
        const { data } = await chatApi.create()
        currentChatId = data.id   // UUID string
        setActiveChatId(currentChatId)
        window.history.pushState({}, '', `/chat/${currentChatId}`)
        setChats((prev) => [{ ...data, title: text.slice(0, 60) }, ...prev])
      } catch (err) {
        console.error('Failed to create chat', err)
        setIsLoading(false)
        return
      }
    }

    // Optimistic user message
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: text }])

    // Update sidebar title on first real message
    setChats((prev) => prev.map((c) =>
      c.id === currentChatId && c.title === 'New Chat'
        ? { ...c, title: text.slice(0, 60) }
        : c
    ))

    try {
      const { data } = await chatApi.send(currentChatId, { message: text })
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: data }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(), role: 'assistant',
          content: { error: err.response?.data?.detail || 'Something went wrong. Please try again.' },
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteChat = async (id) => {
    try {
      await chatApi.delete(id)
      const updated = chats.filter((c) => c.id !== id)
      setChats(updated)
      if (id === activeChatId) startNewChat()
    } catch (err) {
      console.error('Failed to delete chat', err)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const activeTitle = chats.find((c) => c.id === activeChatId)?.title || 'Profile Matcher AI'

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f5f6fa' }}>
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={startNewChat}
        onSelectChat={selectChat}
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
              {activeTitle}
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
        <Box sx={{ px: 3, py: 2, bgcolor: '#fff', borderTop: '1px solid #e5e7eb' }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
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
        </Box>
      </Box>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </Box>
  )
}
