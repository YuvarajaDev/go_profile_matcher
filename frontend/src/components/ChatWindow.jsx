import { useEffect, useRef } from 'react'
import { Box, Typography, Avatar } from '@mui/material'
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import CandidateCard from './CandidateCard'

function TypingIndicator() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: { xs: 1.5, md: 2 }, py: 1.5 }}>
      <Avatar sx={{ width: 32, height: 32, bgcolor: '#282b4a', flexShrink: 0 }}>
        <SmartToyOutlinedIcon sx={{ fontSize: 18, color: '#f4c310' }} />
      </Avatar>
      <Box sx={{
        display: 'flex', gap: 0.5, bgcolor: '#fff',
        border: '1px solid #e5e7eb', borderRadius: '0 12px 12px 12px', px: 2, py: 1.5,
      }}>
        {[0, 1, 2].map((i) => (
          <Box key={i} sx={{
            width: 8, height: 8, borderRadius: '50%', bgcolor: '#282b4a',
            animation: 'bounce 1.2s infinite',
            animationDelay: `${i * 0.2}s`,
            '@keyframes bounce': {
              '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: 0.4 },
              '40%': { transform: 'scale(1)', opacity: 1 },
            },
          }} />
        ))}
      </Box>
    </Box>
  )
}

function UserMessage({ content }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: { xs: 1.5, md: 2 }, py: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, maxWidth: { xs: '88%', sm: '75%', md: '70%' } }}>
        <Box sx={{
          bgcolor: '#282b4a', color: '#fff', px: 2.5, py: 1.5,
          borderRadius: '12px 12px 0 12px',
          fontSize: { xs: '0.85rem', md: '0.9rem' }, lineHeight: 1.6,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {content}
        </Box>
        <Avatar sx={{ width: 32, height: 32, bgcolor: '#f4c310', flexShrink: 0 }}>
          <PersonOutlineIcon sx={{ fontSize: 18, color: '#282b4a' }} />
        </Avatar>
      </Box>
    </Box>
  )
}

function AssistantMessage({ content }) {
  const isObj = typeof content === 'object' && content !== null

  if (isObj && content.type === 'message') {
    return (
      <Box sx={{ display: 'flex', px: { xs: 1.5, md: 2 }, py: 1, gap: 1 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: '#282b4a', flexShrink: 0, mt: 0.5 }}>
          <SmartToyOutlinedIcon sx={{ fontSize: 18, color: '#f4c310' }} />
        </Avatar>
        <Box sx={{
          bgcolor: '#fff', border: '1px solid #e5e7eb',
          borderRadius: '0 12px 12px 12px', px: 2.5, py: 1.5,
          maxWidth: { xs: '88%', sm: '80%', md: 520 },
        }}>
          <Typography sx={{ color: '#374151', fontSize: { xs: '0.85rem', md: '0.9rem' }, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {content.content}
          </Typography>
        </Box>
      </Box>
    )
  }

  if (isObj && content.error) {
    return (
      <Box sx={{ display: 'flex', px: { xs: 1.5, md: 2 }, py: 1, gap: 1 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: '#282b4a', flexShrink: 0, mt: 0.5 }}>
          <SmartToyOutlinedIcon sx={{ fontSize: 18, color: '#f4c310' }} />
        </Avatar>
        <Box sx={{
          bgcolor: '#fff', border: '1px solid #fecaca',
          borderRadius: '0 12px 12px 12px', px: 2.5, py: 1.5,
          maxWidth: { xs: '88%', sm: '80%', md: 520 },
        }}>
          <Typography sx={{ color: '#ef4444', fontSize: { xs: '0.85rem', md: '0.9rem' } }}>
            {content.error}
          </Typography>
        </Box>
      </Box>
    )
  }

  const results = isObj ? (content.results || []) : []
  const total = isObj ? (content.total || 0) : 0

  return (
    <Box sx={{ display: 'flex', px: { xs: 1.5, md: 2 }, py: 1, gap: 1 }}>
      <Avatar sx={{ width: 32, height: 32, bgcolor: '#282b4a', flexShrink: 0, mt: 0.5 }}>
        <SmartToyOutlinedIcon sx={{ fontSize: 18, color: '#f4c310' }} />
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0, maxWidth: { xs: '100%', sm: '90%', md: 700 } }}>
        <Box sx={{
          bgcolor: '#fff', border: '1px solid #e5e7eb',
          borderRadius: '0 12px 12px 12px', p: { xs: 1.5, md: 2 },
        }}>
          {total === 0 ? (
            <Typography sx={{ color: '#6b7280', fontSize: { xs: '0.85rem', md: '0.9rem' } }}>
              No matching profiles found. Try a different job description or upload more resumes.
            </Typography>
          ) : (
            <>
              <Typography sx={{ fontWeight: 600, color: '#282b4a', mb: 1.5, fontSize: { xs: '0.85rem', md: '0.9rem' } }}>
                Found <span style={{ color: '#f4c310', fontWeight: 700 }}>{total}</span> matching profile{total > 1 ? 's' : ''}:
              </Typography>
              {results.map((candidate, idx) => (
                <CandidateCard key={candidate.id} candidate={candidate} rank={idx + 1} />
              ))}
            </>
          )}
        </Box>
      </Box>
    </Box>
  )
}

function WelcomeMessage() {
  return (
    <Box sx={{ display: 'flex', px: { xs: 1.5, md: 2 }, py: 1, gap: 1 }}>
      <Avatar sx={{ width: 32, height: 32, bgcolor: '#282b4a', flexShrink: 0, mt: 0.5 }}>
        <SmartToyOutlinedIcon sx={{ fontSize: 18, color: '#f4c310' }} />
      </Avatar>
      <Box sx={{
        bgcolor: '#fff', border: '1px solid #e5e7eb',
        borderRadius: '0 12px 12px 12px', px: 2.5, py: 2,
        maxWidth: { xs: '88%', sm: '80%', md: 480 },
      }}>
        <Typography sx={{ fontWeight: 700, color: '#282b4a', mb: 0.5, fontSize: { xs: '0.9rem', md: '1rem' } }}>
          Welcome to GO Profile Matcher AI
        </Typography>
        <Typography sx={{ color: '#6b7280', fontSize: { xs: '0.8rem', md: '0.9rem' }, lineHeight: 1.6 }}>
          Paste a Job Description or describe the profile you're looking for. I'll search through the resume database and find the best matching candidates for you.
        </Typography>
      </Box>
    </Box>
  )
}

export default function ChatWindow({ messages, isLoading }) {
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <Box sx={{
      flex: 1, overflowY: 'auto', py: 2,
      '&::-webkit-scrollbar': { width: 6 },
      '&::-webkit-scrollbar-thumb': { bgcolor: '#d1d5db', borderRadius: 3 },
    }}>
      <WelcomeMessage />
      {messages.map((msg) => (
        msg.role === 'user'
          ? <UserMessage key={msg.id} content={msg.content} />
          : <AssistantMessage key={msg.id} content={msg.content} />
      ))}
      {isLoading && <TypingIndicator />}
      <div ref={bottomRef} />
    </Box>
  )
}
