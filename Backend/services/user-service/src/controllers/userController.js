const userService = require('../services/userService');

// GET tous les users
exports.getAll = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET par patientCode (utilisé par pharmacy-service via OpenFeign)
exports.getByPatientCode = async (req, res) => {
  try {
    const code = parseInt(req.params.id, 10);
    if (isNaN(code)) {
      return res.status(400).json({ message: 'Invalid patient code' });
    }

    const user = await userService.getUserByPatientCode(code);
    console.log(`📥 Patient lookup: code=${code} → ${user.firstName} ${user.lastName}`);
    res.json(user);
  } catch (err) {
    if (err.message === 'Patient not found') {
      return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

// POST créer un user
exports.create = async (req, res) => {
  try {
    if (!req.body.password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const result = await userService.login(email, password);
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Invalid credentials') {
      res.status(401).json({ error: 'Identifiants invalides' });
    } else if (error.message === 'Account disabled') {
      res.status(403).json({ error: 'Compte désactivé' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};

// PUT update password
exports.updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old and new passwords are required' });
    }

    const result = await userService.updatePassword(req.params.id, oldPassword, newPassword);
    res.json(result);
  } catch (err) {
    if (err.message === 'User not found' || err.message === 'Invalid old password') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

// POST forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    const result = await userService.forgotPassword(email, newPassword);
    res.json(result);
  } catch (err) {
    if (err.message === 'User not found') {
      return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

// PUT update role
exports.updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    const user = await userService.updateRole(req.params.id, role);
    res.json(user);
  } catch (err) {
    if (err.message === 'User not found' || err.message === 'Invalid role') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

// PUT toggle status (activate/deactivate)
exports.toggleStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (isActive === undefined) {
      return res.status(400).json({ message: 'isActive (boolean) is required' });
    }

    const user = await userService.toggleStatus(req.params.id, isActive);
    res.json(user);
  } catch (err) {
    if (err.message === 'User not found') {
      return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};