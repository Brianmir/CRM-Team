require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1️⃣ Servir assets estáticos (CSS, JS, imágenes) desde /public
app.use(express.static(path.join(__dirname, 'public')));

// 2️⃣ Servir vistas HTML como estáticos en la raíz (/views)
app.use('/', express.static(path.join(__dirname, 'views')));

// Configuración de sesión
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Cambiar a true en producción con HTTPS
}));

// Conexión a MongoDB
mongoose.connect(
  process.env.MONGODB_URI || 'mongodb://localhost:27017/auth-system',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error de conexión a MongoDB:', err));

// Modelo de Usuario
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date
});
const User = mongoose.model('User', UserSchema);

// Middleware para proteger rutas
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
};

// Rutas de vistas
app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'views', 'register.html')));
app.get('/forgot', (req, res) => res.sendFile(path.join(__dirname, 'views', 'forgot.html')));
app.get('/reset-password', (req, res) => res.sendFile(path.join(__dirname, 'views', 'reset-password.html')));
app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// APIs de autenticación
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario o email ya existe' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    req.session.userId = user._id;
    req.session.username = user.username;
    res.json({ message: 'Inicio de sesión exitoso', username: user.username });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: 'Error al cerrar sesión' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Sesión cerrada exitosamente' });
  });
});

// APIs para restablecimiento de contraseña
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
    await user.save();
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await transporter.sendMail({
      to: user.email,
      from: process.env.SMTP_USER,
      subject: 'Recuperar contraseña',
      text: `Para restablecer tu contraseña, visita:\n${resetLink}`
    });
    res.json({ message: 'Email de recuperación enviado' });
  } catch (err) {
    console.error('Error en forgot-password:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ message: 'Token inválido o expirado' });
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: 'Contraseña restablecida con éxito' });
  } catch (err) {
    console.error('Error en reset-password:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// API para obtener datos de usuario
app.get('/api/user', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    console.error('Error al obtener usuario:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
