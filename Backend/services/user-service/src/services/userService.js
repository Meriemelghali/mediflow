const bcrypt = require('bcryptjs');
const User = require('../models/User');

class UserService {
  async getAllUsers() {
    // On exclut le mot de passe de la liste
    return await User.find().select('-password');
  }

  async getUserByPatientCode(code) {
    const user = await User.findOne({ patientCode: code }).select('-password');
    if (!user) throw new Error('Patient not found');
    return user;
  }

  async createUser(userData) {
    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Auto-incrément du patientCode si non fourni
    if (!userData.patientCode) {
      const last = await User.findOne().sort('-patientCode');
      userData.patientCode = last && last.patientCode ? last.patientCode + 1 : 1;
    }

    // Nettoyage de sécurité : on gère les infos par rôle
    const role = userData.role || 'PATIENT';
    if (role !== 'PATIENT') delete userData.patientInfo;
    if (role !== 'DOCTOR') delete userData.doctorInfo;
    if (role !== 'PHARMACIST') delete userData.pharmacistInfo;

    // Convert input role to roles array and activeRole for the new schema
    userData.roles = [role];
    userData.activeRole = role;

    // Hachage du mot de passe
    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);

    const user = await User.create(userData);
    
    // On ne renvoie pas le mot de passe
    const userObj = user.toObject();
    delete userObj.password;

    // Appel au Notification Service pour envoyer l'email de bienvenue
    try {
      // Notification service port is 8086 based on its .env
      const response = await fetch('http://localhost:8086/api/notifications/email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userObj.email,
          firstName: userObj.firstName
        })
      });
      if (!response.ok) {
        console.warn('Echec envoi email de bienvenue:', await response.text());
      } else {
        console.log('Email de bienvenue envoyé via Notification Service');
      }
    } catch (err) {
      console.warn('Erreur lors de lajout de l\'appel notification-service:', err.message);
    }

    return userObj;
  }

  async updatePassword(userId, oldPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new Error('Invalid old password');

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return { message: 'Password updated successfully' };
  }

  async forgotPassword(email, newPassword) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) throw new Error('User not found');

    // Dans un vrai système, on validerait un token envoyé par email.
    // Ici, on met à jour directement.
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return { message: 'Password reset successfully' };
  }

  async updateRole(userId, newRole) {
    const validRoles = ['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN', 'PHARMACIST'];
    if (!validRoles.includes(newRole)) {
      throw new Error('Invalid role');
    }

    const user = await User.findById(userId).select('-password');
    if (!user) throw new Error('User not found');

    user.activeRole = newRole;
    if (!user.roles.includes(newRole)) {
      user.roles.push(newRole);
    }
    await user.save();

    return user;
  }

  async toggleStatus(userId, isActive) {
    const user = await User.findById(userId).select('-password');
    if (!user) throw new Error('User not found');

    user.isActive = isActive;
    await user.save();

    return user;
  }

  async login(email, password) {
    const jwt = require('jsonwebtoken');
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) throw new Error('Invalid credentials');
    if (!user.isActive) throw new Error('Account disabled');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');

    // Create JWT Payload
    const payload = {
      id: user._id,
      patientCode: user.patientCode,
      activeRole: user.activeRole,
      roles: user.roles,
      firstName: user.firstName,
      lastName: user.lastName
    };

    // Use a secret from env or fallback
    const secret = process.env.JWT_SECRET || 'supersecret_mediflow_2026';
    
    // Sign token for 6 hours
    const token = jwt.sign(payload, secret, { expiresIn: '6h' });

    // Return token and user info
    const userObj = user.toObject();
    delete userObj.password;
    
    return { token, user: userObj };
  }
}

module.exports = new UserService();
