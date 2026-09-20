import request from '@/api'

export interface AdminAiConfig {
  greet: string
  systemPrompt: string
  diaryPrompt: string
  enabled: boolean
  toolsEnabled: boolean
  fallbackEnabled: boolean
}

export interface WeightedItem { id: number; sortWeight: number; status: 'on' | 'off' }
export interface QuickQuestion extends WeightedItem { text: string }
export interface KeywordRule extends WeightedItem { keywords: string[]; replyText: string; recommendBoxIds: number[] }
export interface DefaultReply extends WeightedItem { text: string }
export interface DiaryTemplate extends WeightedItem { content: string }

const base = '/api/v1/admin/ai'
export const getAiConfig = () => request.get<AdminAiConfig>(`${base}/config`)
export const updateAiConfig = (data: AdminAiConfig) => request.put<AdminAiConfig>(`${base}/config`, data)
export const listQuickQuestions = () => request.get<QuickQuestion[]>(`${base}/quick-questions`)
export const saveQuickQuestion = (id: number | null, data: Omit<QuickQuestion, 'id'>) => id ? request.put(`${base}/quick-questions/${id}`, data) : request.post(`${base}/quick-questions`, data)
export const deleteQuickQuestion = (id: number) => request.delete(`${base}/quick-questions/${id}`)
export const listKeywordRules = () => request.get<KeywordRule[]>(`${base}/keyword-rules`)
export const saveKeywordRule = (id: number | null, data: any) => id ? request.put(`${base}/keyword-rules/${id}`, data) : request.post(`${base}/keyword-rules`, data)
export const deleteKeywordRule = (id: number) => request.delete(`${base}/keyword-rules/${id}`)
export const listDefaultReplies = () => request.get<DefaultReply[]>(`${base}/default-replies`)
export const saveDefaultReply = (id: number | null, data: any) => id ? request.put(`${base}/default-replies/${id}`, data) : request.post(`${base}/default-replies`, data)
export const deleteDefaultReply = (id: number) => request.delete(`${base}/default-replies/${id}`)
export const listDiaryTemplates = () => request.get<DiaryTemplate[]>(`${base}/diary-templates`)
export const saveDiaryTemplate = (id: number | null, data: any) => id ? request.put(`${base}/diary-templates/${id}`, data) : request.post(`${base}/diary-templates`, data)
export const deleteDiaryTemplate = (id: number) => request.delete(`${base}/diary-templates/${id}`)
