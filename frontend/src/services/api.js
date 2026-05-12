import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

export const chatApi = {
  list: () => api.get('/chats'),
  create: () => api.post('/chats'),
  get: (chatId) => api.get(`/chats/${chatId}`),
  delete: (chatId) => api.delete(`/chats/${chatId}`),
  send: (chatId, data) => api.post(`/chats/${chatId}/message`, data),
}

export const resumeApi = {
  upload: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/upload-resume', form)
  },
}
