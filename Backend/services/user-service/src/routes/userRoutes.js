const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID MongoDB
 *           example: 507f1f77bcf86cd799439011
 *         patientCode:
 *           type: integer
 *           description: Code numérique utilisé par les autres microservices via OpenFeign
 *           example: 1
 *         firstName:
 *           type: string
 *           example: John
 *         lastName:
 *           type: string
 *           example: Doe
 *         email:
 *           type: string
 *           example: john@test.com
 *         role:
 *           type: string
 *           enum: [PATIENT, DOCTOR, NURSE, ADMIN, PHARMACIST]
 *           example: PATIENT
 *         phone:
 *           type: string
 *           example: 55123456
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     UserInput:
 *       type: object
 *       required: [firstName, lastName, email]
 *       properties:
 *         firstName:
 *           type: string
 *           example: John
 *         lastName:
 *           type: string
 *           example: Doe
 *         email:
 *           type: string
 *           example: john@test.com
 *         role:
 *           type: string
 *           enum: [PATIENT, DOCTOR, NURSE, ADMIN, PHARMACIST]
 *           example: PATIENT
 *         phone:
 *           type: string
 *           example: 55123456
 */

/**
 * @openapi
 * /api/user:
 *   get:
 *     summary: Liste tous les utilisateurs
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Liste retournée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/', userController.getAll);

/**
 * @openapi
 * /api/user/{id}:
 *   get:
 *     summary: Récupère un patient par son patientCode (utilisé par pharmacy-service via OpenFeign)
 *     description: Endpoint critique appelé par les autres microservices Spring Boot via OpenFeign + Eureka
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Le patientCode numérique du patient
 *         example: 1
 *     responses:
 *       200:
 *         description: Patient trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Patient non trouvé
 */
router.get('/:id', userController.getByPatientCode);

/**
 * @openapi
 * /api/user:
 *   post:
 *     summary: Crée un nouvel utilisateur
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Données invalides
 */
router.post('/', userController.create);

module.exports = router;