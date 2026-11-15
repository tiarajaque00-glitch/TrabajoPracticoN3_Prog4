import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import { configurarPassport } from './src/config/passport.js';
import authRoutes from './src/routes/auth.routes.js';
import vehiculosRoutes from './src/routes/vehiculos.routes.js';
import conductoresRoutes from './src/routes/conductores.routes.js';
import viajesRoutes from './src/routes/viajes.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(passport.initialize());
configurarPassport(passport);

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/conductores', conductoresRoutes);
app.use('/api/viajes', viajesRoutes);

app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});