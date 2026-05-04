const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Service API',
      version: '1.0.0',
      description: 'Microservice de gestion des utilisateurs/patients (Node.js + Express + MongoDB)',
      contact: {
        name: 'Mediflow Team',
      },
    },
    servers: [
      { url: 'http://localhost:8081', description: 'Local development' },
    ],
    tags: [
      { name: 'Users', description: 'Gestion des utilisateurs et patients' },
      { name: 'System', description: 'Endpoints système (health, info)' },
    ],
  },
  // Swagger lit les commentaires JSDoc dans ces fichiers
  apis: ['./src/routes/*.js', './src/server.js'],
};

module.exports = swaggerJsdoc(options);