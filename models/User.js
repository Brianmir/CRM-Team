const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetPasswordToken:   String,
  resetPasswordExpires: Date
}, { timestamps: true });

// Si ya existe mongoose.models.User, reutilízalo; si no, créalo
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
