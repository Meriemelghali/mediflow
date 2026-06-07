const User = require('../models/User');

// GET tous les users
exports.getAll = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ⭐ GET par patientCode (utilisé par pharmacy-service via OpenFeign)
exports.getByPatientCode = async (req, res) => {
  try {
    const code = parseInt(req.params.id, 10);
    if (isNaN(code)) {
      return res.status(400).json({ message: 'Invalid patient code' });
    }

    const user = await User.findOne({ patientCode: code });
    if (!user) return res.status(404).json({ message: 'Patient not found' });

    console.log(`📥 Patient lookup: code=${code} → ${user.firstName} ${user.lastName}`);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST créer un user
exports.create = async (req, res) => {
  try {
    // Auto-incrément du patientCode si non fourni
    if (!req.body.patientCode) {
      const last = await User.findOne().sort('-patientCode');
      req.body.patientCode = last && last.patientCode ? last.patientCode + 1 : 1;
    }

    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};