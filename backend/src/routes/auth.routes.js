import { Router } from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { validarCampos } from '../middlewares/validar.js';

const router = Router();

// Registro de usuario
router.post(
  '/register',
  [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
    body('email').isEmail().withMessage('Debe ingresar un email valido').normalizeEmail(),
    body('contrasena').isLength({ min: 6 }).withMessage('La contrasena debe tener al menos 6 caracteres'),
    validarCampos
  ],
  async (req, res) => {
    try {
      const { nombre, email, contrasena } = req.body;

      const [existe] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
      if (existe.length > 0) {
        return res.status(400).json({ mensaje: 'El email ya se encuentra registrado' });
      }

      // Encriptar contrasena antes de insertar
      const hash = await bcrypt.hash(contrasena, 10);
      const [result] = await pool.query(
        'INSERT INTO usuarios (nombre, email, contrasena) VALUES (?, ?, ?)',
        [nombre, email, hash]
      );

      res.status(201).json({
        mensaje: 'Usuario registrado correctamente',
        usuario: { id: result.insertId, nombre, email }
      });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al registrar usuario', error: error.message });
    }
  }
);

// Inicio de sesion
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email invalido').normalizeEmail(),
    body('contrasena').notEmpty().withMessage('La contrasena es requerida'),
    validarCampos
  ],
  async (req, res) => {
    try {
      const { email, contrasena } = req.body;

      const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
      if (rows.length === 0) {
        return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
      }

      const usuario = rows[0];
      const claveValida = await bcrypt.compare(contrasena, usuario.contrasena);
      if (!claveValida) {
        return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
      }

      // Token valido por 4 horas segun consigna
      const token = jwt.sign(
        { id: usuario.id, email: usuario.email },
        process.env.JWT_SECRET,
        { expiresIn: '4h' }
      );

      res.json({
        mensaje: 'Sesion iniciada',
        token,
        usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email }
      });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al iniciar sesion', error: error.message });
    }
  }
);

export default router;