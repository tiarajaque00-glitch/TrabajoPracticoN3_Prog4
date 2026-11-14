import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { pool } from '../config/db.js';
import { verificarAuth } from '../middlewares/auth.js';
import { validarCampos } from '../middlewares/validar.js';

const router = Router();
router.use(verificarAuth);

// Listar conductores
router.get(
  '/',
  [query('apellido').optional().isString().trim(), validarCampos],
  async (req, res) => {
    try {
      const { apellido } = req.query;
      if (apellido) {
        const [rows] = await pool.query(
          'SELECT * FROM conductores WHERE apellido LIKE ? ORDER BY id DESC',
          [`%${apellido}%`]
        );
        return res.json(rows);
      }
      const [rows] = await pool.query('SELECT * FROM conductores ORDER BY id DESC');
      res.json(rows);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al obtener conductores' });
    }
  }
);

// Obtener conductor por ID
router.get(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('ID invalido'), validarCampos],
  async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM conductores WHERE id = ?', [req.params.id]);
      if (rows.length === 0) {
        return res.status(404).json({ mensaje: 'Conductor no encontrado' });
      }
      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al buscar conductor' });
    }
  }
);

const reglasConductor = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('apellido').trim().notEmpty().withMessage('El apellido es obligatorio'),
  body('numero_documento').trim().notEmpty().withMessage('El numero de documento es obligatorio'),
  body('numero_licencia').trim().notEmpty().withMessage('El numero de licencia es obligatorio'),
  body('fecha_alta_licencia').isISO8601().withMessage('Fecha de alta invalida (YYYY-MM-DD)'),
  body('fecha_vencimiento_licencia').isISO8601().withMessage('Fecha de vencimiento invalida (YYYY-MM-DD)')
];

// Crear conductor
router.post('/', [...reglasConductor, validarCampos], async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      numero_documento,
      numero_licencia,
      fecha_alta_licencia,
      fecha_vencimiento_licencia
    } = req.body;

    if (new Date(fecha_vencimiento_licencia) <= new Date(fecha_alta_licencia)) {
      return res.status(400).json({
        mensaje: 'La fecha de vencimiento debe ser posterior a la fecha de alta'
      });
    }

    const [dup] = await pool.query(
      'SELECT id FROM conductores WHERE numero_documento = ? OR numero_licencia = ?',
      [numero_documento, numero_licencia]
    );
    if (dup.length > 0) {
      return res.status(400).json({ mensaje: 'Ya existe un conductor con ese documento o licencia' });
    }

    const [result] = await pool.query(
      `INSERT INTO conductores 
      (nombre, apellido, numero_documento, numero_licencia, fecha_alta_licencia, fecha_vencimiento_licencia) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, numero_documento, numero_licencia, fecha_alta_licencia, fecha_vencimiento_licencia]
    );

    res.status(201).json({
      id: result.insertId,
      nombre,
      apellido,
      numero_documento,
      numero_licencia,
      fecha_alta_licencia,
      fecha_vencimiento_licencia
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar conductor' });
  }
});

// Actualizar conductor
router.put(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('ID invalido'), ...reglasConductor, validarCampos],
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        nombre,
        apellido,
        numero_documento,
        numero_licencia,
        fecha_alta_licencia,
        fecha_vencimiento_licencia
      } = req.body;

      const [existe] = await pool.query('SELECT id FROM conductores WHERE id = ?', [id]);
      if (existe.length === 0) {
        return res.status(404).json({ mensaje: 'Conductor no encontrado' });
      }

      if (new Date(fecha_vencimiento_licencia) <= new Date(fecha_alta_licencia)) {
        return res.status(400).json({
          mensaje: 'La fecha de vencimiento debe ser posterior a la de alta'
        });
      }

      const [dup] = await pool.query(
        'SELECT id FROM conductores WHERE (numero_documento = ? OR numero_licencia = ?) AND id != ?',
        [numero_documento, numero_licencia, id]
      );
      if (dup.length > 0) {
        return res.status(400).json({ mensaje: 'Documento o licencia duplicados en otro conductor' });
      }

      await pool.query(
        `UPDATE conductores SET 
          nombre = ?, apellido = ?, numero_documento = ?, numero_licencia = ?, 
          fecha_alta_licencia = ?, fecha_vencimiento_licencia = ? 
        WHERE id = ?`,
        [nombre, apellido, numero_documento, numero_licencia, fecha_alta_licencia, fecha_vencimiento_licencia, id]
      );

      res.json({
        id: Number(id),
        nombre,
        apellido,
        numero_documento,
        numero_licencia,
        fecha_alta_licencia,
        fecha_vencimiento_licencia
      });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al actualizar conductor' });
    }
  }
);

// Eliminar conductor
router.delete(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('ID invalido'), validarCampos],
  async (req, res) => {
    try {
      const { id } = req.params;
      const [existe] = await pool.query('SELECT id FROM conductores WHERE id = ?', [id]);
      if (existe.length === 0) {
        return res.status(404).json({ mensaje: 'Conductor no encontrado' });
      }

      const [viajes] = await pool.query('SELECT id FROM viajes WHERE conductor_id = ?', [id]);
      if (viajes.length > 0) {
        return res.status(403).json({
          mensaje: 'Accion denegada: el conductor tiene viajes asignados'
        });
      }

      await pool.query('DELETE FROM conductores WHERE id = ?', [id]);
      res.json({ mensaje: 'Conductor eliminado correctamente' });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al eliminar conductor' });
    }
  }
);

export default router;