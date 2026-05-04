require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const connectDB = require('./config/db');
const swaggerSpec = require('./config/swagger');
const { registerWithEureka, deregisterFromEureka } = require('./config/eureka');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 8081;

app.use(cors());
app.use(express.json());

// 📚 Swagger UI — accessible sur les MÊMES paths que tes services Spring Boot
app.use('/swagger-ui.html', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'User Service - API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
}));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// JSON brut de la spec OpenAPI
app.get('/v3/api-docs', (req, res) => res.json(swaggerSpec));

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check (utilisé par Eureka)
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service UP
 */
app.get('/health', (req, res) => res.json({ status: 'UP' }));

/**
 * @openapi
 * /info:
 *   get:
 *     summary: Informations sur le service
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Infos du service
 */
app.get('/info', (req, res) => res.json({ app: 'user-service', version: '1.0.0' }));

/**
 * @openapi
 * /:
 *   get:
 *     summary: Endpoint racine
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Message de bienvenue
 */
app.get('/', (req, res) => {
  res.json({
    message: 'User Service is running 🚀',
    documentation: 'http://localhost:' + PORT + '/swagger-ui.html',
  });
});

// Routes utilisateurs
app.use('/api/user', userRoutes);

// Démarrage
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📚 Swagger UI: http://localhost:${PORT}/swagger-ui.html`);
    registerWithEureka();
  });
};

start();

// Graceful shutdown
process.on('SIGINT', () => {
  deregisterFromEureka();
  setTimeout(() => process.exit(0), 1000);
});
process.on('SIGTERM', () => {
  deregisterFromEureka();
  setTimeout(() => process.exit(0), 1000);
});