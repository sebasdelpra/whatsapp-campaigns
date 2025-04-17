require('dotenv').config();
const express = require('express');
const path = require('path');
const { initializeDatabase } = require('./models/db');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (IMPORTANTE la configuración correcta)
app.use(express.static(path.join(__dirname, 'public'), {
  index: false, // No servir index.html automáticamente
  extensions: ['html', 'htm'] // Extensiones permitidas
}));

// Configuración de rutas
app.use('/api', require('./routes/api'));

// Ruta principal - MANEJO EXPLÍCITO
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
    if (err) {
      logger.error('Error al servir index.html:', err);
      res.status(500).send('Error al cargar la interfaz');
    }
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  logger.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Inicialización
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      logger.info(`Servidor corriendo en http://localhost:${PORT}`);
      logger.info('Rutas disponibles:');
      logger.info(`- GET  /         → Interfaz web`);
      logger.info(`- GET  /api/*    → Endpoints API`);
      logger.info(`- GET  /*.js/css → Archivos estáticos`);
    });
  } catch (error) {
    logger.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();