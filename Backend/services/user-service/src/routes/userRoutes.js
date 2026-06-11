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
 *         patientInfo:
 *           type: object
 *           properties:
 *             cnamNumber: { type: string }
 *             bloodType: { type: string }
 *             medicalHistory:
 *               type: array
 *               items: { type: string }
 *         doctorInfo:
 *           type: object
 *           properties:
 *             specialty: { type: string }
 *             licenseNumber: { type: string }
 *             consultationFee: { type: number }
 *         pharmacistInfo:
 *           type: object
 *           properties:
 *             pharmacyName: { type: string }
 *             licenseNumber: { type: string }
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     UserInput:
 *       type: object
 *       required: [firstName, lastName, email, password]
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
 *         password:
 *           type: string
 *           example: "strongPassword123"
 *         role:
 *           type: string
 *           enum: [PATIENT, DOCTOR, NURSE, ADMIN, PHARMACIST]
 *           example: PATIENT
 *         phone:
 *           type: string
 *           example: 55123456
 *         patientInfo:
 *           type: object
 *           properties:
 *             cnamNumber: { type: string }
 *             bloodType: { type: string }
 *             medicalHistory:
 *               type: array
 *               items: { type: string }
 *         doctorInfo:
 *           type: object
 *           properties:
 *             specialty: { type: string }
 *             licenseNumber: { type: string }
 *             consultationFee: { type: number }
 *         pharmacistInfo:
 *           type: object
 *           properties:
 *             pharmacyName: { type: string }
 *             licenseNumber: { type: string }
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

/**
 * @openapi
 * /api/user/login:
 *   post:
 *     summary: Authentifie un utilisateur et retourne un JWT
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Authentification réussie
 *       401:
 *         description: Identifiants invalides
 */
router.post('/login', userController.login);

/**
 * @openapi
 * /api/user/{id}/password:
 *   put:
 *     summary: Met à jour le mot de passe d'un utilisateur
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: L'ID MongoDB de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: "oldPassword123"
 *               newPassword:
 *                 type: string
 *                 example: "newPassword123"
 *     responses:
 *       200:
 *         description: Mot de passe mis à jour
 *       400:
 *         description: Ancien mot de passe invalide
 */
router.put('/:id/password', userController.updatePassword);

/**
 * @openapi
 * /api/user/forgot-password:
 *   post:
 *     summary: Réinitialise le mot de passe via email
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "john@test.com"
 *               newPassword:
 *                 type: string
 *                 example: "resetPassword123"
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé
 *       404:
 *         description: Utilisateur non trouvé
 */
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

/**
 * @openapi
 * /api/user/{id}/role:
 *   put:
 *     summary: Modifie le rôle d'un utilisateur
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: L'ID MongoDB de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [PATIENT, DOCTOR, NURSE, ADMIN, PHARMACIST]
 *                 example: "DOCTOR"
 *     responses:
 *       200:
 *         description: Rôle mis à jour
 *       400:
 *         description: Rôle invalide
 */
router.put('/:id/role', userController.updateRole);

/**
 * @openapi
 * /api/user/{id}/status:
 *   put:
 *     summary: Active ou désactive un compte utilisateur (Staff, Docteur, Pharmacien...)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: L'ID MongoDB de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 example: false
 *                 description: true pour activer, false pour désactiver
 *     responses:
 *       200:
 *         description: Statut du compte mis à jour
 *       400:
 *         description: Requête invalide
 *       404:
 *         description: Utilisateur non trouvé
 */
router.put('/:id/status', userController.toggleStatus);

module.exports = router;
