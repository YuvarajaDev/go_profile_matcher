import { Box, Typography, Chip, Divider } from '@mui/material'
import WorkOutlineIcon from '@mui/icons-material/WorkOutline'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'

function ScoreBadge({ score }) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f4c310' : score >= 40 ? '#f97316' : '#ef4444'
  return (
    <Box sx={{
      px: 1.5, py: 0.5, borderRadius: 2, bgcolor: color,
      color: score >= 60 && score < 80 ? '#282b4a' : '#fff',
      fontWeight: 700, fontSize: { xs: '0.75rem', md: '0.85rem' },
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {score}% Match
    </Box>
  )
}

export default function CandidateCard({ candidate, rank }) {
  const explanation = candidate.explanation
    ? candidate.explanation.split('\n').filter((l) => l.trim())
    : []

  return (
    <Box sx={{
      bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2,
      p: { xs: 1.5, md: 2 }, mb: 1.5, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      {/* Header */}
      <Box sx={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 1, mb: 1, flexWrap: 'wrap',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: '50%', bgcolor: '#282b4a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#f4c310', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
          }}>
            #{rank}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700, lineHeight: 1.2, color: '#282b4a', fontSize: { xs: '0.9rem', md: '1rem' } }}>
              {candidate.candidate_name || 'Unknown Candidate'}
            </Typography>
            {candidate.current_title && (
              <Typography variant="body2" noWrap color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                {candidate.current_title}
              </Typography>
            )}
          </Box>
        </Box>
        <ScoreBadge score={candidate.similarity_score} />
      </Box>

      {/* Meta info */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, md: 2 }, mb: 1.5 }}>
        {candidate.years_experience && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <WorkOutlineIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {candidate.years_experience} yrs exp
            </Typography>
          </Box>
        )}
        {candidate.email && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
            <EmailOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary" noWrap>
              {candidate.email}
            </Typography>
          </Box>
        )}
        {candidate.phone && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PhoneOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {candidate.phone}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Skills */}
      {candidate.skills?.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: explanation.length ? 1.5 : 0 }}>
          {candidate.skills.map((skill) => (
            <Chip
              key={skill} label={skill} size="small"
              sx={{
                bgcolor: '#f0f1f8', color: '#282b4a',
                fontWeight: 500, fontSize: '0.72rem', height: 22,
              }}
            />
          ))}
        </Box>
      )}

      {/* AI Explanation */}
      {explanation.length > 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <Box>
            {explanation.map((line, i) => (
              <Typography key={i} variant="body2" sx={{ color: '#374151', mb: 0.3, fontSize: { xs: '0.78rem', md: '0.82rem' } }}>
                {line}
              </Typography>
            ))}
          </Box>
        </>
      )}
    </Box>
  )
}
