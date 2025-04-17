const express = require('express');
const router = express.Router();
const whatsapp = require('../services/whatsapp.service');

// Event Stream para actualizaciones en tiempo real
router.get('/whatsapp-events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  
  // Eventos iniciales
  sendEvent('status_change', { 
    status: whatsapp.getStatus(),
    qr: whatsapp.qrCode 
  });
  
  // Listeners
  const onStatusChange = (status) => {
    sendEvent('status_change', { status, qr: whatsapp.qrCode });
  };
  
  const onQR = (qr) => {
    sendEvent('status_change', { status: 'disconnected', qr });
  };
  
  whatsapp.on('status_change', onStatusChange);
  whatsapp.on('qr', onQR);
  
  req.on('close', () => {
    whatsapp.off('status_change', onStatusChange);
    whatsapp.off('qr', onQR);
  });
});

// Obtener estado actual
router.get('/whatsapp-status', (req, res) => {
  res.json({
    status: whatsapp.getStatus(),
    qr: whatsapp.qrCode
  });
});

// Iniciar campaña
router.post('/start-campaign', async (req, res) => {
  if (!whatsapp.isReady) {
    return res.status(400).json({ 
      success: false, 
      error: 'WhatsApp no está conectado',
      requiresQR: true 
    });
  }

  const { phone, message } = req.body;
  
  if (!phone || !message) {
    return res.status(400).json({ 
      success: false, 
      error: 'Teléfono y mensaje son requeridos' 
    });
  }

  try {
    const result = await whatsapp.sendMessage(phone, message);
    res.json({ success: true, messageId: result.messageId });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;