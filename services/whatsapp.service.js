const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const EventEmitter = require('events');
const logger = require('../utils/logger');

class WhatsAppService extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.isReady = false;
    this.qrCode = null;
    this.initialize();
  }

  async initialize() {
    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: './whatsapp-session' }),
      puppeteer: { 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    this.client.on('qr', (qr) => {
      this.qrCode = qr;
      qrcode.generate(qr, { small: true });
      this.emit('qr', qr);
      this.emit('status_change', 'disconnected');
      logger.info('Escanea el código QR');
    });

    this.client.on('ready', () => {
      this.isReady = true;
      this.qrCode = null;
      this.emit('status_change', 'connected');
      logger.info('WhatsApp listo');
    });

    this.client.on('disconnected', () => {
      this.isReady = false;
      this.emit('status_change', 'disconnected');
      logger.warn('WhatsApp desconectado');
    });

    await this.client.initialize();
  }

  getStatus() {
    return this.isReady ? 'connected' : 'disconnected';
  }

  async sendMessage(phone, message) {
    if (!this.isReady) throw new Error('WhatsApp no está conectado');
    
    const formattedPhone = phone.replace('+', '') + '@c.us';
    const sentMsg = await this.client.sendMessage(formattedPhone, message);
    
    return { 
      messageId: sentMsg.id._serialized,
      timestamp: new Date()
    };
  }
}

module.exports = new WhatsAppService();