import passport from 'passport';

export const verificarAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) {
      return res.status(500).json({ mensaje: 'Error al verificar el token' });
    }
    if (!user) {
      return res.status(401).json({ mensaje: 'No autorizado. Token invalido o vencido' });
    }
    req.user = user;
    next();
  })(req, res, next);
};