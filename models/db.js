const sql = require('mssql');
const dbConfig = require('../config/db.config');
const logger = require('../utils/logger');

async function initializeDatabase() {
  try {
    const pool = await sql.connect(dbConfig);
    
    // Verificación y creación de tablas con sintaxis corregida
    await verifyTable(pool, 'Contacts', `
      CREATE TABLE Contacts (
        id INT IDENTITY(1,1) PRIMARY KEY,
        phoneNumber NVARCHAR(20) NOT NULL,
        firstName NVARCHAR(100),
        lastName NVARCHAR(100),
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE(),
        isActive BIT DEFAULT 1,
        customField NVARCHAR(MAX)
      )
    `);

    await verifyTable(pool, 'CampaignLogs', `
      CREATE TABLE CampaignLogs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        contactId INT,
        campaignId NVARCHAR(50) NOT NULL,
        messageText NVARCHAR(MAX),
        imageSent BIT DEFAULT 0,
        status NVARCHAR(20) DEFAULT 'pending',
        sentAt DATETIME,
        errorMessage NVARCHAR(MAX),
        createdAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (contactId) REFERENCES Contacts(id)
      )
    `);

    return pool;
  } catch (err) {
    logger.error('Error crítico en initializeDatabase:', err);
    throw err;
  }
}

// Función auxiliar mejorada
async function verifyTable(pool, tableName, createQuery) {
  try {
    const check = await pool.request()
      .query(`SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${tableName}'`);

    if (check.recordset.length === 0) {
      logger.info(`Creando tabla ${tableName}...`);
      // Ejecutar en transacción para mayor seguridad
      const transaction = new sql.Transaction(pool);
      await transaction.begin();
      
      try {
        const request = new sql.Request(transaction);
        await request.query(createQuery);
        await transaction.commit();
        logger.info(`Tabla ${tableName} creada exitosamente`);
      } catch (txError) {
        await transaction.rollback();
        throw txError;
      }
    } else {
      logger.info(`Tabla ${tableName} ya existe. Omitiendo creación.`);
    }
  } catch (err) {
    logger.error(`Error al verificar/crear tabla ${tableName}:`, err);
    throw err;
  }
}

module.exports = { initializeDatabase, sql };