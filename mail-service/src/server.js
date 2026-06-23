require('dotenv').config({ path: '/home/vegebalto/Micasita/mail-service/.env' })

const express = require('express')
const cors = require('cors')
const {
  sendContactMessage,
  listContactMessages,
  getContactMessage,
  replyToContactMessage,
  sendPasswordRecoveryEmail,
} = require('./gmail')

const app = express()
const port = Number(process.env.PORT || 4000)
const corsOrigin = process.env.CORS_ORIGIN || 'http://34.45.135.19/mail/api'

app.use(cors({ origin: corsOrigin }))
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'micasita-mail-service' })
})

app.post('/api/contact/messages', async (req, res) => {
  try {
    const { nombre, correo, asunto, mensaje } = req.body ?? {}

    if (!nombre || !correo || !asunto || !mensaje) {
      return res.status(400).json({ message: 'nombre, correo, asunto y mensaje son obligatorios' })
    }

    const result = await sendContactMessage({
      nombre: String(nombre).trim(),
      correo: String(correo).trim(),
      asunto: String(asunto).trim(),
      mensaje: String(mensaje).trim(),
    })

    res.status(201).json({
      message: 'Mensaje enviado al buzón interno',
      id: result.id,
      threadId: result.threadId,
    })
  } catch (error) {
    console.error('Error sending contact message:', error)
    res.status(500).json({ message: 'No se pudo enviar el mensaje' })
  }
})

app.get('/api/contact/messages', async (_req, res) => {
  try {
    const messages = await listContactMessages(25)
    res.json({ items: messages })
  } catch (error) {
    console.error('Error listing contact messages:', error)
    res.status(500).json({ message: 'No se pudo cargar la bandeja de mensajes' })
  }
})

app.get('/api/contact/messages/:messageId', async (req, res) => {
  try {
    const message = await getContactMessage(req.params.messageId)
    res.json(message)
  } catch (error) {
    console.error('Error getting contact message:', error)
    res.status(500).json({ message: 'No se pudo leer el mensaje' })
  }
})

app.post('/api/contact/messages/:messageId/reply', async (req, res) => {
  try {
    const replyText = String(req.body?.replyText ?? '').trim()
    if (!replyText) {
      return res.status(400).json({ message: 'replyText es obligatorio' })
    }

    const result = await replyToContactMessage(req.params.messageId, replyText)
    res.json({
      message: 'Respuesta enviada',
      id: result.id,
      threadId: result.threadId,
    })
  } catch (error) {
    console.error('Error replying to contact message:', error)
    res.status(500).json({ message: 'No se pudo enviar la respuesta' })
  }
})

app.post('/api/auth/recover-password', async (req, res) => {
  try {
    const { email, nombre, codigo } = req.body ?? {}
    if (!email || !codigo) {
      return res.status(400).json({ message: 'email y codigo son obligatorios' })
    }
    await sendPasswordRecoveryEmail({ email, nombre, codigo })
    res.status(200).json({ message: 'Correo enviado' })
  } catch (error) {
    console.error('Error sending recovery email:', error)
    res.status(500).json({ message: 'No se pudo enviar el correo' })
  }
})

app.listen(port, () => {
  console.log(`Mail service listening on http://localhost:${port}`)
})
