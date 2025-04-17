const { sql } = require('../models/db');
const whatsappService = require('../services/whatsapp.service');
const logger = require('../utils/logger');

class CampaignController {
  async sendCampaign(campaignId, message, imagePath = null) {
    try {
      const pool = await sql.connect();
      
      // Obtener contactos que no han recibido esta campaña
      const result = await pool.request()
        .input('campaignId', sql.NVarChar, campaignId)
        .query(`
          SELECT c.id, c.phoneNumber 
          FROM Contacts c
          LEFT JOIN CampaignLogs cl ON c.id = cl.contactId AND cl.campaignId = @campaignId
          WHERE c.isActive = 1 AND (cl.id IS NULL OR cl.status <> 'success')
        `);
      
      const contacts = result.recordset;
      let successCount = 0;
      let failCount = 0;
      
      for (const contact of contacts) {
        try {
          // Verificar si ya se envió la imagen en campañas anteriores
          const hasImageSent = await pool.request()
            .input('contactId', sql.Int, contact.id)
            .query(`SELECT TOP 1 1 FROM CampaignLogs WHERE contactId = @contactId AND imageSent = 1`);
          
          const sendImage = imagePath && !hasImageSent.recordset.length;
          
          // Enviar mensaje
          const sendResult = await whatsappService.sendMessage(
            contact.phoneNumber, 
            message, 
            sendImage ? imagePath : null
          );
          
          // Registrar envío
          await pool.request()
            .input('contactId', sql.Int, contact.id)
            .input('campaignId', sql.NVarChar, campaignId)
            .input('messageText', sql.NVarChar, message)
            .input('imageSent', sql.Bit, sendImage ? 1 : 0)
            .input('status', sql.NVarChar, sendResult.success ? 'success' : 'failed')
            .input('errorMessage', sql.NVarChar, sendResult.error || null)
            .query(`
              INSERT INTO CampaignLogs 
              (contactId, campaignId, messageText, imageSent, status, sentAt, errorMessage)
              VALUES 
              (@contactId, @campaignId, @messageText, @imageSent, @status, GETDATE(), @errorMessage)
            `);
            
          if (sendResult.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          logger.error(`Error procesando contacto ${contact.id}:`, error);
          failCount++;
        }
      }
      
      return {
        total: contacts.length,
        success: successCount,
        failed: failCount
      };
    } catch (error) {
      logger.error('Error en sendCampaign:', error);
      throw error;
    }
  }
}

module.exports = new CampaignController();