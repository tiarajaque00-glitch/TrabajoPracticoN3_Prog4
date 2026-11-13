import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import dotenv from 'dotenv';
import { pool } from './db.js';

dotenv.config();

const opciones = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

export const configurarPassport = (passport) => {
  passport.use(
    new JwtStrategy(opciones, async (payload, done) => {
      try {
        const [rows] = await pool.query(
          'SELECT id, nombre, email FROM usuarios WHERE id = ?',
          [payload.id]
        );

        if (rows.length === 0) {
          return done(null, false);
        }

        return done(null, rows[0]);
      } catch (error) {
        return done(error, false);
      }
    })
  );
};