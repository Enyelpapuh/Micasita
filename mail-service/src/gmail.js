const nodemailer = require('nodemailer')
const { google } = require('googleapis')

function requireEnv(name) {
  const value = process.env[name]
  if (!value || !value.trim()) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value.trim()
}

function createGmailClient() {
  const clientId = requireEnv('GMAIL_CLIENT_ID')
  const clientSecret = requireEnv('GMAIL_CLIENT_SECRET')
  const refreshToken = requireEnv('GMAIL_REFRESH_TOKEN')
  const redirectUri = process.env.GMAIL_REDIRECT_URI?.trim() || 'https://developers.google.com/oauthplayground'

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  return google.gmail({ version: 'v1', auth: oauth2Client })
}

async function createTransporter() {
  const clientId = requireEnv('GMAIL_CLIENT_ID')
  const clientSecret = requireEnv('GMAIL_CLIENT_SECRET')
  const refreshToken = requireEnv('GMAIL_REFRESH_TOKEN')
  const user = requireEnv('GMAIL_FROM_ADDRESS')

  // 1. Configuramos el cliente OAuth2 para pedir el token dinámico
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'https://developers.google.com/oauthplayground'
  )
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  // 2. Solicitamos el Access Token que se actualiza cada rato
  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        console.error('❌ Error renovando el Access Token:', err)
        reject(err)
      } else {
        resolve(token)
      }
    })
  })

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: user,
      clientId: clientId,
      clientSecret: clientSecret,
      refreshToken: refreshToken,
      accessToken: accessToken, // <--- Pasamos el token recién generado
    },
    tls: {
      rejectUnauthorized: false
    }
  })
}

function extractHeader(headers, name) {
  const header = (headers ?? []).find((item) => item.name?.toLowerCase() === name.toLowerCase())
  return header?.value ?? null
}

function buildContactText({ nombre, correo, asunto, mensaje }) {
  return [
    'Nuevo mensaje desde el formulario de contacto de Micasita.',
    '',
    `Nombre: ${nombre || 'No especificado'}`,
    `Correo: ${correo || 'No especificado'}`,
    `Asunto: ${asunto || 'Sin asunto'}`,
    '',
    'Mensaje:',
    mensaje || 'Sin mensaje',
    '',
    '---',
    'Enviado automáticamente desde el sitio web.',
  ].join('\n')
}

function buildContactHtml({ nombre, correo, asunto, mensaje }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #0f766e; padding: 25px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 24px;">🏫 Nuevo Mensaje de Contacto</h2>
        <p style="margin: 8px 0 0 0; font-size: 15px; color: #ccfbf1;">Has recibido una consulta desde el sitio web de Micasita</p>
      </div>
      <div style="padding: 30px; background-color: #ffffff; color: #334155; line-height: 1.6;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>👤 Nombre:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${nombre || 'No especificado'}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>📧 Correo:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><a href="mailto:${correo}" style="color: #0f766e; text-decoration: none;">${correo || 'No especificado'}</a></td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>🏷️ Asunto:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${asunto || 'Sin asunto'}</td></tr>
        </table>
        
        <h3 style="margin-top: 0; color: #0f766e; font-size: 18px;">📝 Mensaje:</h3>
        <div style="background-color: #f8fafc; padding: 20px; border-left: 4px solid #0f766e; border-radius: 4px; white-space: pre-wrap; color: #475569;">
          ${mensaje || 'Sin mensaje'}
        </div>
      </div>
      <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 13px; color: #64748b;">
        <strong>😋 Cuidando cada paso, estimulando el futuro. 👇🏻</strong><br><br>
        Enviado automáticamente desde el formulario de contacto de <strong>Micasita</strong>.<br>
        Para responder a ${nombre}, utiliza el botón "Responder" en tu correo.
      </div>
    </div>
  `;
}

function buildRecoveryHtml({ nombre, codigo }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #0f766e; padding: 25px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 24px;">🔐 Recuperación de Contraseña</h2>
      </div>
      <div style="padding: 30px; background-color: #ffffff; color: #334155; line-height: 1.6; text-align: center;">
        <p>Hola <strong>${nombre || 'Usuario'}</strong>,</p>
        <p>Hemos recibido una solicitud para restablecer tu contraseña en Micasita.</p>
        <p>Tu código de verificación es:</p>
        <div style="margin: 20px auto; padding: 15px; background-color: #f1f5f9; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f766e; max-width: 200px;">
          ${codigo}
        </div>
        <p style="color: #ef4444; font-size: 14px;">⚠️ Este código expirará en 5 minutos.</p>
        <p style="font-size: 14px; margin-top: 20px;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
      </div>
    </div>
  `;
}

async function sendPasswordRecoveryEmail(payload) {
  ;(async () => {
    try {
      const transporter = await createTransporter()
      const fromAddress = requireEnv('GMAIL_FROM_ADDRESS')
      
      const mailOptions = {
        from: `"Micasita" <${fromAddress}>`,
        to: payload.email,
        subject: '🔐 Código de recuperación de contraseña - Micasita',
        text: `Hola ${payload.nombre || 'Usuario'},\n\nTu código de recuperación es: ${payload.codigo}\n\nEste código expira en 5 minutos.`,
        html: buildRecoveryHtml(payload),
      }

      const info = await transporter.sendMail(mailOptions)
      console.log(`\n✅ [SEGUNDO PLANO] Correo de recuperación enviado. ID: ${info.messageId}`);
    } catch (error) {
      console.error('\n❌ [SEGUNDO PLANO] Error enviando correo de recuperación:', error);
    }
  })()
  return { success: true }
}

async function sendContactMessage(payload) {
  // Ejecutamos la carga y envío del correo en segundo plano (fire-and-forget)
  ;(async () => {
    try {
      const transporter = await createTransporter()
      const fromName = process.env.GMAIL_FROM_NAME?.trim() || 'Micasita'
      const fromAddress = requireEnv('GMAIL_FROM_ADDRESS') 
      const to = requireEnv('CONTACT_INBOX_TO')
      const subjectPrefix = process.env.CONTACT_SUBJECT_PREFIX?.trim() || '[Contacto Micasita]'
      
      const subject = `${subjectPrefix} ${payload.asunto || 'Sin asunto'}`
      const replyToHeader = payload.correo ? `"${payload.nombre || 'Cliente'}" <${payload.correo}>` : undefined
      
      // Mostrar el nombre de la persona que escribe directamente en la bandeja de entrada
      const displayFromName = payload.nombre ? `${payload.nombre} (Página Web)` : fromName
      const text = buildContactText(payload)
      const html = buildContactHtml(payload)
      
      const mailOptions = {
        from: `"${displayFromName}" <${fromAddress}>`,
        to,
        replyTo: replyToHeader,
        subject,
        text,
        html,
      }

      const info = await transporter.sendMail(mailOptions)
      console.log(`\n✅ [SEGUNDO PLANO] Correo de contacto enviado con éxito. ID: ${info.messageId}`);
    } catch (error) {
      console.error('\n❌ [SEGUNDO PLANO] Error enviando correo de contacto:', error);
    }
  })()

  // Retornamos inmediatamente al frontend para no hacerlo esperar
  return {
    id: 'en-proceso',
    threadId: null,
  }
}

function decodeBase64Url(encoded) {
  if (!encoded) return '';
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf-8');
}

function extractBody(payload) {
  if (!payload) return '';
  if (payload.body && payload.body.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.parts && payload.parts.length > 0) {
    let textHtml = '';
    let textPlain = '';
    const traverseParts = (parts) => {
      for (const part of parts) {
        if (part.mimeType === 'text/html' && part.body?.data) textHtml = decodeBase64Url(part.body.data);
        else if (part.mimeType === 'text/plain' && part.body?.data) textPlain = decodeBase64Url(part.body.data);
        else if (part.parts) traverseParts(part.parts);
      }
    }
    traverseParts(payload.parts);
    return textHtml || textPlain;
  }
  return '';
}

function parseGmailMessage(message) {
  const headers = message.payload?.headers ?? []
  const from = extractHeader(headers, 'From')
  const replyTo = extractHeader(headers, 'Reply-To')
  const subject = extractHeader(headers, 'Subject')
  const messageId = extractHeader(headers, 'Message-ID')
  const date = extractHeader(headers, 'Date')

  return {
    id: message.id,
    threadId: message.threadId,
    from,
    replyTo,
    subject,
    messageId,
    date,
    snippet: message.snippet ?? '',
    internalDate: message.internalDate ? Number(message.internalDate) : null,
    body: extractBody(message.payload),
  }
}

async function listContactMessages(query = '', limit = 25) {
  const gmail = createGmailClient()
  
  // En caso de que el primer parámetro sea el límite por uso anterior
  if (typeof query === 'number') {
    limit = query;
    query = '';
  }
  
  const subjectPrefix = process.env.CONTACT_SUBJECT_PREFIX?.trim() || 'Contacto Micasita'
  const searchQuery = query ? query : subjectPrefix.replace(/[\[\]]/g, '')

  const response = await gmail.users.messages.list({
    userId: 'me',
    q: `in:inbox subject:"${searchQuery}"`,
    maxResults: Number(limit) || 25,
  })

  const items = response.data.messages ?? []
  const results = []

  for (const item of items) {
    const details = await gmail.users.messages.get({
      userId: 'me',
      id: item.id,
      format: 'metadata',
      metadataHeaders: ['From', 'Reply-To', 'Subject', 'Message-ID', 'Date'],
    })
    results.push(parseGmailMessage(details.data))
  }

  return results
}

async function getContactMessage(messageId) {
  const gmail = createGmailClient()
  const response = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  })

  return parseGmailMessage(response.data)
}

async function replyToContactMessage(messageId, replyText) {
  const gmail = createGmailClient()
  
  // Obtenemos los metadatos rápido para responder al frontend
  const original = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'metadata',
    metadataHeaders: ['From', 'Reply-To', 'Subject', 'Message-ID', 'Date'],
  })

  // Mandamos al segundo plano el envío real que tarda varios segundos
  ;(async () => {
    try {
      const transporter = await createTransporter()
      
      const headers = original.data.payload?.headers ?? []
      const replyToAddress = extractHeader(headers, 'Reply-To') || extractHeader(headers, 'From')
      const messageIdHeader = extractHeader(headers, 'Message-ID')
      const subject = extractHeader(headers, 'Subject')
      
      const fromName = process.env.GMAIL_FROM_NAME?.trim() || 'Micasita'
      const fromAddress = requireEnv('GMAIL_FROM_ADDRESS')
      const responseSubject = subject?.toLowerCase().startsWith('re:') ? subject : `Re: ${subject || 'Contacto Micasita'}`

      const htmlReply = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #0f766e; padding: 25px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0; font-size: 24px;">🏫 Respuesta de Micasita</h2>
          </div>
          <div style="padding: 30px; background-color: #ffffff; color: #334155; line-height: 1.6;">
            <div style="white-space: pre-wrap; font-size: 15px; color: #475569;">${replyText}</div>
          </div>
          <div style="background-color: #f1f5f9; padding: 25px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 10px 0; font-size: 14px;">Atentamente,</p>
            <strong style="color: #0f766e; font-size: 16px;">El equipo de Micasita</strong><br><br>
            <a href="http://localhost:5173" style="display: inline-block; background-color: #0f766e; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-weight: bold; margin-top: 5px;">Visitar nuestro sitio web</a>
          </div>
        </div>
      `;

      const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: replyToAddress,
        subject: responseSubject,
        text: replyText,
        html: htmlReply,
        inReplyTo: messageIdHeader || undefined,
        references: messageIdHeader || undefined
      }

      const info = await transporter.sendMail(mailOptions)
      console.log(`\n✅ [SEGUNDO PLANO] Respuesta enviada con éxito. ID: ${info.messageId}`);
    } catch (error) {
      console.error('\n❌ [SEGUNDO PLANO] Error enviando respuesta:', error);
    }
  })()

  // Retorno instantáneo
  return {
    id: 'en-proceso',
    threadId: original.data.threadId || null,
  }
}
module.exports = {
  sendContactMessage,
  listContactMessages,
  getContactMessage,
  replyToContactMessage,
  sendPasswordRecoveryEmail,
}
