const cron = require('node-cron');
const campaignController = require('../controllers/campaign.controller');
const logger = require('../utils/logger');

class SchedulerService {
  constructor() {
    this.scheduledJobs = {};
  }

  scheduleCampaign(campaignId, message, imagePath, cronExpression) {
    if (this.scheduledJobs[campaignId]) {
      this.scheduledJobs[campaignId].stop();
    }

    const job = cron.schedule(cronExpression, async () => {
      logger.info(`Ejecutando campaña programada: ${campaignId}`);
      try {
        const result = await campaignController.sendCampaign(campaignId, message, imagePath);
        logger.info(`Resultado de la campaña ${campaignId}:`, result);
      } catch (error) {
        logger.error(`Error ejecutando campaña ${campaignId}:`, error);
      }
    });

    this.scheduledJobs[campaignId] = job;
    logger.info(`Campaña ${campaignId} programada con expresión: ${cronExpression}`);
  }

  stopCampaign(campaignId) {
    if (this.scheduledJobs[campaignId]) {
      this.scheduledJobs[campaignId].stop();
      delete this.scheduledJobs[campaignId];
      logger.info(`Campaña ${campaignId} detenida`);
    }
  }
}

module.exports = new SchedulerService();