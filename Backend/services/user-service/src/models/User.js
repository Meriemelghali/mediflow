const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // ⭐ patientCode = ID numérique simple, utilisé par pharmacy-service via OpenFeign
    patientCode: { type: Number, unique: true, index: true },

    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    email:     { type: String, required: true, unique: true, lowercase: true },
    role: {
      type: String,
      enum: ['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN', 'PHARMACIST'],
      default: 'PATIENT',
    },
    phone: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);