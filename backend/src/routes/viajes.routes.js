import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { pool } from '../config/db.js';
import { verificarAuth } from '../middlewares/auth.js';
import { validarCampos } from '../middlewares/validar.js';

const router = Router();
router.use(verificarAuth);

// Listar viajes (acepta filtro por vehiculo_id o conductor_id y calcula el total de km)
router.get(
  '/',
  [
    query('vehiculo_id').optional().isInt({ min: 1 }).withMessage('vehiculo_id debe ser numerico'),
    query('conductor_id').optional().isInt({ min: 1 }).withMessage('conductor_id debe ser numerico'),
    validarCampos
  ],
  async (req, res) => {
    try {
      const { vehiculo_id, conductor_id } = req.query;

      let sql = `
        SELECT v.*, 
               ve.marca, ve.modelo, ve.patente,
               c.nombre AS conductor_nombre, c.apellido AS conductor_apellido
        FROM viajes v
        INNER JOIN vehiculos ve ON v.vehiculo_id = ve.id
        INNER JOIN conductores c ON v.conductor_id = c.id
      `;
      const condiciones = [];
      const params = [];

      if (vehiculo_id) {
        condiciones.push('v.vehiculo_id = ?');
        params.push(vehiculo_id);
      }
      if (conductor_id) {
        condiciones.push('v.conductor_id = ?');
        params.push(conductor_id);
      }

      if (condiciones.length > 0) {
        sql += ' WHERE ' + condiciones.join(' AND ');
      }
      sql += ' ORDER BY v.fecha_salida DESC';

      const [viajes] = await pool.query(sql, params);

      // Sumatoria total de kilometros del listado filtrado
      const totalKilometros = viajes.reduce((acc, item) => acc + Number(item.kilometros), 0);

      res.json({
        viajes,
        total_kilometros: Number(totalKilometros.toFixed(2))
      });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al consultar viajes' });
    }
  }
);

// Obtener viaje por ID
router.get(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('ID invalido'), validarCampos],
  async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM viajes WHERE id = ?', [req.params.id]);
      if (rows.length === 0) {
        return res.status(404).json({ mensaje: 'Viaje no encontrado' });
      }
      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al buscar viaje' });
    }
  }
);

const reglasViaje = [
  body('vehiculo_id').isInt({ min: 1 }).withMessage('Debe seleccionar un vehiculo valido'),
  body('conductor_id').isInt({ min: 1 }).withMessage('Debe seleccionar un conductor valido'),
  body('fecha_salida').isISO8601().withMessage('Fecha de salida invalida'),
  body('fecha_llegada').isISO8601().withMessage('Fecha de llegada invalida'),
  body('origen').trim().notEmpty().withMessage('El origen es obligatorio'),
  body('destino').trim().notEmpty().withMessage('El destino es obligatorio'),
  body('kilometros').isFloat({ gt: 0 }).withMessage('Los kilometros deben ser mayores a 0'),
  body('observaciones').optional().isString()
];

// Registrar un viaje nuevo
router.post('/', [...reglasViaje, validarCampos], async (req, res) => {
  try {
    const {
      vehiculo_id,
      conductor_id,
      fecha_salida,
      fecha_llegada,
      origen,
      destino,
      kilometros,
      observaciones
    } = req.body;

    if (new Date(fecha_llegada) < new Date(fecha_salida)) {
      return res.status(400).json({
        mensaje: 'La fecha de llegada no puede ser anterior a la salida'
      });
    }

    // Validar que existan el vehiculo y el conductor
    const [veh] = await pool.query('SELECT id FROM vehiculos WHERE id = ?', [vehiculo_id]);
    if (veh.length === 0) {
      return res.status(404).json({ mensaje: 'El vehiculo indicado no existe' });
    }

    const [cond] = await pool.query('SELECT id FROM conductores WHERE id = ?', [conductor_id]);
    if (cond.length === 0) {
      return res.status(404).json({ mensaje: 'El conductor indicado no existe' });
    }

    const [result] = await pool.query(
      `INSERT INTO viajes 
      (vehiculo_id, conductor_id, fecha_salida, fecha_llegada, origen, destino, kilometros, observaciones) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [vehiculo_id, conductor_id, fecha_salida, fecha_llegada, origen, destino, kilometros, observaciones || null]
    );

    res.status(201).json({
      id: result.insertId,
      vehiculo_id,
      conductor_id,
      fecha_salida,
      fecha_llegada,
      origen,
      destino,
      kilometros,
      observaciones: observaciones || ''
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar viaje' });
  }
});

// Actualizar viaje
router.put(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('ID invalido'), ...reglasViaje, validarCampos],
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        vehiculo_id,
        conductor_id,
        fecha_salida,
        fecha_llegada,
        origen,
        destino,
        kilometros,
        observaciones
      } = req.body;

      const [existe] = await pool.query('SELECT id FROM viajes WHERE id = ?', [id]);
      if (existe.length === 0) {
        return res.status(404).json({ mensaje: 'Viaje no encontrado' });
      }

      if (new Date(fecha_llegada) < new Date(fecha_salida)) {
        return res.status(400).json({
          mensaje: 'La fecha de llegada no puede ser anterior a la salida'
        });
      }

      await pool.query(
        `UPDATE viajes SET 
          vehiculo_id = ?, conductor_id = ?, fecha_salida = ?, fecha_llegada = ?, 
          origen = ?, destino = ?, kilometros = ?, observaciones = ? 
        WHERE id = ?`,
        [vehiculo_id, conductor_id, fecha_salida, fecha_llegada, origen, destino, kilometros, observaciones || null, id]
      );

      res.json({ mensaje: 'Viaje actualizado correctamente' });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al actualizar viaje' });
    }
  }
);

// Eliminar viaje
router.delete(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('ID invalido'), validarCampos],
  async (req, res) => {
    try {
      const [result] = await pool.query('DELETE FROM viajes WHERE id = ?', [req.params.id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ mensaje: 'Viaje no encontrado' });
      }
      res.json({ mensaje: 'Viaje eliminado' });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al eliminar viaje' });
    }
  }
);

export default router;