const crypto = require('crypto');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

async function forgotPassword(req, res) {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

  // Genera token y fecha de expiración (1 hora)
  const token = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken   = token;
  user.resetPasswordExpires = Date.now() + 3600000;
  await user.save();

  // Configura transporte de email
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;
  const mailOptions = {
    to: user.email,
    from: process.env.SMTP_USER,
    subject: 'Recuperar contraseña',
    text: `Hola,\n\n    Para restablecer tu contraseña, haz clic en:\n${resetLink}\n\nSi no lo solicitaste, ignora este correo.\n`
  };

  await transporter.sendMail(mailOptions);
  res.json({ msg: 'Email de recuperación enviado' });
}

async function resetPassword(req, res) {
  const { token, password } = req.body;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) return res.status(400).json({ msg: 'Token inválido o expirado' });

  // Hashea y guarda nueva contraseña, limpia el token
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ msg: 'Contraseña restablecida con éxito' });
}

module.exports = { forgotPassword, resetPassword };
