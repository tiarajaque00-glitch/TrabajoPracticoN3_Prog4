import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { pool } from '../config/db.js';
import { verificarAuth } from '../middlewares/auth.js';
import { validarCampos } from '../middlewares/validar.js';

const router = Router();

// Todas las rutas requieren autenticacion
router.use(verificarAuth);

// Obtener todos los vehiculos (permite filtro opcional por patente)
router.get(
  '/',
  [
    query('patente').optional().isString().trim(),
    validarCampos
  ],
  async (req, res) => {
    try {
      const { patente } = req.query;
      if (patente) {
        const [rows] = await pool.query(
          'SELECT * FROM vehiculos WHERE patente LIKE ? ORDER BY id DESC',
          [`%${patente}%`]
        );
        return res.json(rows);
      }
      const [rows] = await pool.query('SELECT * FROM vehiculos ORDER BY id DESC');
      res.json(rows);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al obtener vehiculos' });
    }
  }
);

// Obtener un vehiculo por ID
router.get(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('ID de vehiculo invalido'), validarCampos],
  async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM vehiculos WHERE id = ?', [req.params.id]);
      if (rows.length === 0) {
        return res.status(404).json({ mensaje: 'Vehiculo no encontrado' });
      }
      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al buscar vehiculo' });
    }
  }
);

// Crear vehiculo
router.post(
  '/',
  [
    body('marca').trim().notEmpty().withMessage('La marca es obligatoria'),
    body('modelo').trim().notEmpty().withMessage('El modelo es obligatorio'),
    body('patente').trim().notEmpty().toUpperCase().withMessage('La patente es obligatoria'),
    body('anio').isInt({ min: 1950, max: 2030 }).withMessage('Anio invalido'),
    body('capacidad_carga').isFloat({ gt: 0 }).withMessage('La capacidad de carga debe ser mayor a 0'),
    validarCampos
  ],
  async (req, res) => {
    try {
      const { marca, modelo, patente, anio, capacidad_carga } = req.body;

      const [dup] = await pool.query('SELECT id FROM vehiculos WHERE patente = ?', [patente]);
      if (dup.length > 0) {
        return res.status(400).json({ mensaje: 'Ya existe un vehiculo con esa patente' });
      }

      const [result] = await pool.query(
        'INSERT INTO vehiculos (marca, modelo, patente, anio, capacidad_carga) VALUES (?, ?, ?, ?, ?)',
        [marca, modelo, patente, anio, capacidad_carga]
      );

      res.status(201).json({
        id: result.insertId,
        marca,
        modelo,
        patente,
        anio,
        capacidad_carga
      });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al crear vehiculo' });
    }
  }
);

// Actualizar vehiculo
router.put(
  '/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('ID invalido'),
    body('marca').trim().notEmpty().withMessage('La marca es obligatoria'),
    body('modelo').trim().notEmpty().withMessage('El modelo es obligatorio'),
    body('patente').trim().notEmpty().toUpperCase().withMessage('La patente es obligatoria'),
    body('anio').isInt({ min: 1950, max: 2030 }).withMessage('Anio invalido'),
    body('capacidad_carga').isFloat({ gt: 0 }).withMessage('La capacidad debe ser mayor a 0'),
    validarCampos
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { marca, modelo, patente, anio, capacidad_carga } = req.body;

      const [existe] = await pool.query('SELECT id FROM vehiculos WHERE id = ?', [id]);
      if (existe.length === 0) {
        return res.status(404).json({ mensaje: 'Vehiculo no encontrado' });
      }

      const [dup] = await pool.query(
        'SELECT id FROM vehiculos WHERE patente = ? AND id != ?',
        [patente, id]
      );
      if (dup.length > 0) {
        return res.status(400).json({ mensaje: 'Otra unidad ya tiene esa patente' });
      }

      await pool.query(
        'UPDATE vehiculos SET marca = ?, modelo = ?, patente = ?, anio = ?, capacidad_carga = ? WHERE id = ?',
        [marca, modelo, patente, anio, capacidad_carga, id]
      );

      res.json({ id: Number(id), marca, modelo, patente, anio, capacidad_carga });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al actualizar vehiculo' });
    }
  }
);

// Eliminar vehiculo
router.delete(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('ID invalido'), validarCampos],
  async (req, res) => {
    try {
      const { id } = req.params;
      const [existe] = await pool.query('SELECT id FROM vehiculos WHERE id = ?', [id]);
      if (existe.length === 0) {
        return res.status(404).json({ mensaje: 'Vehiculo no encontrado' });
      }

      // Evitar borrar si tiene viajes asociados
      const [viajes] = await pool.query('SELECT id FROM viajes WHERE vehiculo_id = ?', [id]);
      if (viajes.length > 0) {
        return res.status(403).json({
          mensaje: 'Accion denegada: el vehiculo tiene viajes registrados en su historial'
        });
      }

      await pool.query('DELETE FROM vehiculos WHERE id = ?', [id]);
      res.json({ mensaje: 'Vehiculo eliminado correctamente' });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al eliminar vehiculo' });
    }
  }
);

export default router;