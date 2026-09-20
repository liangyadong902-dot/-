import request from '@/api'

export interface PersonalityOption {
  id: number
  questionId: number
  seq: number
  label: string
  score: Record<string, number>
}

export interface PersonalityQuestion {
  id: number
  seq: number
  stem: string
  status: 'on' | 'off'
  updatedAt?: string
  options: PersonalityOption[]
}

export interface PersonalityResult {
  id: number
  type: string
  name: string
  mark: string
  description: string
  recommend: string
}

const base = '/api/v1/admin/personality'
export const listPersonalityQuestions = () => request.get<PersonalityQuestion[]>(`${base}/questions`)
export const savePersonalityQuestion = (id: number | null, data: any) => id ? request.put(`${base}/questions/${id}`, data) : request.post(`${base}/questions`, data)
export const deletePersonalityQuestion = (id: number) => request.delete(`${base}/questions/${id}`)
export const savePersonalityOption = (questionId: number, id: number | null, data: any) => id ? request.put(`${base}/options/${id}`, data) : request.post(`${base}/questions/${questionId}/options`, data)
export const deletePersonalityOption = (id: number) => request.delete(`${base}/options/${id}`)
export const listPersonalityResults = () => request.get<PersonalityResult[]>(`${base}/results`)
export const savePersonalityResult = (id: number | null, data: any) => id ? request.put(`${base}/results/${id}`, data) : request.post(`${base}/results`, data)
export const deletePersonalityResult = (id: number) => request.delete(`${base}/results/${id}`)
