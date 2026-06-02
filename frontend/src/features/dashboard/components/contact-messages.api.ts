import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_CONTACT_API_URL ?? 'http://localhost:4000/api'

export type ContactMessage = {
  id: string
  threadId: string | null
  from: string | null
  replyTo: string | null
  subject: string | null
  messageId: string | null
  date: string | null
  snippet: string
  internalDate: number | null
  body?: string
}

// Se añade un parámetro 'query' por defecto para buscar correos sobre "mi casita"
export async function listContactMessages(query: string = 'Contacto Micasita'): Promise<ContactMessage[]> {
  try {
    // Pasamos el query string como parámetro a nuestro mail-service
    const response = await axios.get<{ items: ContactMessage[] }>(`${API_BASE_URL}/contact/messages`, {
      params: { q: query }
    })
    console.log('Lista de mensajes:', JSON.stringify(response.data.items, null, 2))
    return response.data.items ?? []
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'No fue posible completar la operación')
  }
}

export async function getContactMessage(messageId: string): Promise<ContactMessage> {
  try {
    const response = await axios.get<ContactMessage>(`${API_BASE_URL}/contact/messages/${encodeURIComponent(messageId)}`)
    console.log('Detalle del mensaje:', JSON.stringify(response.data, null, 2))
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'No fue posible completar la operación')
  }
}

export async function replyToContactMessage(messageId: string, replyText: string): Promise<{ id: string; threadId: string | null }> {
  try {
    const response = await axios.post<{ id: string; threadId: string | null }>(`${API_BASE_URL}/contact/messages/${encodeURIComponent(messageId)}/reply`, { replyText })
    console.log('Respuesta de envío:', JSON.stringify(response.data, null, 2))
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'No fue posible completar la operación')
  }
}
