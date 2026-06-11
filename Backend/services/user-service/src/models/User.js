const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // ⭐ patientCode = ID numérique simple, utilisé par pharmacy-service via OpenFeign
    patientCode: { type: Number, unique: true, index: true },

    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    email:     { type: String, required: true, unique: true, lowercase: true },
    password:  { type: String, required: true },
    roles: [{
      type: String,
      enum: ['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN', 'PHARMACIST']
    }],
    activeRole: {
      type: String,
      enum: ['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN', 'PHARMACIST'],
      default: 'PATIENT'
    },
    isActive: { type: Boolean, default: true },
    phone: String,

    // --- Champs spécifiques par rôle ---
    patientInfo: {
      cnamNumber: String,
      bloodType: String,
      medicalHistory: [String]
    },
    doctorInfo: {
      specialty: String,
      licenseNumber: String,
      consultationFee: Number
    },
    pharmacistInfo: {
      pharmacyName: String,
      licenseNumber: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);