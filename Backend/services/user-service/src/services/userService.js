const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');

class UserService {
  async getAllUsers() {
    return await User.find().select('-password -resetPasswordToken -resetPasswordExpires');
  }

  async getUserByPatientCode(code) {
    const user = await User.findOne({ patientCode: code }).select('-password -resetPasswordToken -resetPasswordExpires');
    if (!user) throw new Error('Patient not found');
    return user;
  }

  async createUser(userData) {
    const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
    if (existingUser) {
      throw new Error('Email already exists');
    }

    if (!userData.patientCode) {
      const last = await User.findOne().sort('-patientCode');
      userData.patientCode = last && last.patientCode ? last.patientCode + 1 : 1;
    }

    const role = userData.role || 'PATIENT';
    if (role !== 'PATIENT') delete userData.patientInfo;
    if (role !== 'DOCTOR') delete userData.doctorInfo;
    if (role !== 'PHARMACIST') delete userData.pharmacistInfo;

    userData.roles = [role];
    userData.activeRole = role;

    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);

    const user = await User.create(userData);

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.resetPasswordToken;
    delete userObj.resetPasswordExpires;

    try {
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
        console.log('Email de bienvenue envoye via Notification Service');
      }
    } catch (err) {
      console.warn("Erreur lors de l'appel notification-service:", err.message);
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

  async forgotPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return { message: 'If this email exists, a reset link has been sent' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    try {
      const response = await fetch('http://localhost:8086/api/notifications/email/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          firstName: user.firstName,
          resetUrl
        })
      });
      if (!response.ok) {
        console.warn('Echec envoi email reset password:', await response.text());
      }
    } catch (err) {
      console.warn("Erreur lors de l'appel notification-service reset password:", err.message);
      console.log('Reset password link:', resetUrl);
    }

    return { message: 'If this email exists, a reset link has been sent' };
  }

  async resetPassword(token, newPassword) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) throw new Error('Invalid or expired reset token');

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return { message: 'Password reset successfully' };
  }

  async updateRole(userId, newRole) {
    const validRoles = ['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN', 'PHARMACIST'];
    if (!validRoles.includes(newRole)) {
      throw new Error('Invalid role');
    }

    const user = await User.findById(userId).select('-password -resetPasswordToken -resetPasswordExpires');
    if (!user) throw new Error('User not found');

    user.activeRole = newRole;
    if (!user.roles.includes(newRole)) {
      user.roles.push(newRole);
    }
    await user.save();

    return user;
  }

  async toggleStatus(userId, isActive) {
    const user = await User.findById(userId).select('-password -resetPasswordToken -resetPasswordExpires');
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

    const payload = {
      id: user._id,
      patientCode: user.patientCode,
      activeRole: user.activeRole,
      roles: user.roles,
      firstName: user.firstName,
      lastName: user.lastName
    };

    const secret = process.env.JWT_SECRET || 'supersecret_mediflow_2026';
    const token = jwt.sign(payload, secret, { expiresIn: '6h' });

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.resetPasswordToken;
    delete userObj.resetPasswordExpires;

    return { token, user: userObj };
  }
}

module.exports = new UserService();
