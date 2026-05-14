import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, List, ListItemButton, ListItemText,
  IconButton, Tooltip, Divider, Avatar, CircularProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import LogoutIcon from '@mui/icons-material/Logout'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'

function groupChatsByDate(chats) {
  const now = new Date()
  const today = now.toDateString()
  const yesterday = new Date(now - 86400000).toDateString()
  const weekAgo = new Date(now - 7 * 86400000)

  const groups = { Today: [], Yesterday: [], 'This Week': [], Older: [] }
  chats.forEach((chat) => {
    const d = new Date(chat.created_at)
    if (d.toDateString() === today) groups['Today'].push(chat)
    else if (d.toDateString() === yesterday) groups['Yesterday'].push(chat)
    else if (d > weekAgo) groups['This Week'].push(chat)
    else groups['Older'].push(chat)
  })
  return groups
}

export default function Sidebar({ chats, activeChatId, onNewChat, onSelectChat, onDeleteChat, loading }) {
  const navigate = useNavigate()
  const [hoveredId, setHoveredId] = useState(null)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const grouped = groupChatsByDate(chats)

  return (
    <Box sx={{
      width: 260, flexShrink: 0, bgcolor: '#282b4a',
      display: 'flex', flexDirection: 'column', height: '100vh',
    }}>
      {/* Logo + App name */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <img src="/logo.png" alt="GO" style={{ height: 36, objectFit: 'contain' }} />
        <Box>
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2 }}>
            Profile
          </Typography>
          <Typography sx={{ color: '#f4c310', fontWeight: 600, fontSize: '0.75rem' }}>
            Matcher AI
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: 1.5, pb: 1.5 }}>
        <Button
          fullWidth startIcon={<AddIcon />}
          onClick={onNewChat} disabled={loading}
          variant="contained"
          sx={{
            bgcolor: '#f4c310', color: '#282b4a',
            '&:hover': { bgcolor: '#e6b800' },
            fontWeight: 700, borderRadius: 2, py: 1,
          }}
        >
          New Chat
        </Button>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Chat list */}
      <Box sx={{
        flex: 1, overflowY: 'auto', py: 1,
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 },
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
            <CircularProgress size={24} sx={{ color: 'rgba(255,255,255,0.4)' }} />
          </Box>
        ) : chats.length === 0 ? (
          <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
            <ChatBubbleOutlineIcon sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 32, mb: 1 }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
              No chats yet. Start a new one!
            </Typography>
          </Box>
        ) : (
          Object.entries(grouped).map(([label, items]) =>
            items.length > 0 ? (
              <Box key={label}>
                <Typography sx={{
                  px: 2, py: 0.5, fontSize: '0.7rem', fontWeight: 600,
                  color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  {label}
                </Typography>
                <List dense disablePadding>
                  {items.map((chat) => (
                    <ListItemButton
                      key={chat.id}
                      selected={chat.id === activeChatId}
                      onMouseEnter={() => setHoveredId(chat.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => onSelectChat(chat.id)}
                      sx={{
                        mx: 1, borderRadius: 1.5, mb: 0.3, py: 0.8,
                        '&.Mui-selected': { bgcolor: 'rgba(244,195,16,0.15)', '&:hover': { bgcolor: 'rgba(244,195,16,0.2)' } },
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' },
                      }}
                    >
                      <ListItemText
                        primary={chat.title}
                        primaryTypographyProps={{
                          sx: {
                            color: chat.id === activeChatId ? '#f4c310' : 'rgba(255,255,255,0.85)',
                            fontSize: '0.83rem', fontWeight: chat.id === activeChatId ? 600 : 400,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          },
                        }}
                      />
                      {hoveredId === chat.id && (
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id) }}
                            sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#ef4444' }, p: 0.3 }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </ListItemButton>
                  ))}
                </List>
              </Box>
            ) : null
          )
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* User info */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: '#f4c310', color: '#282b4a', fontSize: '0.85rem', fontWeight: 700 }}>
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
          <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.83rem', fontWeight: 500 }}>
            {user.name || 'User'}
          </Typography>
        </Box>
        <Tooltip title="Logout">
          <IconButton onClick={handleLogout} size="small"
            sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#ef4444' } }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
}
