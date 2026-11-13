import { validationResult } from 'express-validator';

// Corta la peticion con 400 si fallan las validaciones
export const validarCampos = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({
      mensaje: 'Hay errores en los datos enviados',
      errores: errores.array()
    });
  }
  next();
};