module.exports = {
    server: 'localhost',
    database: 'algo',
    user: 'sa',
    password: '142857',
    options: {
      encrypt: false,
      trustServerCertificate: true
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
};