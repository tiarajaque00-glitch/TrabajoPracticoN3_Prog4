CREATE DATABASE IF NOT EXISTS transporte_tp3 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE transporte_tp3;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL
);

CREATE TABLE vehiculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    marca VARCHAR(60) NOT NULL,
    modelo VARCHAR(60) NOT NULL,
    patente VARCHAR(15) NOT NULL UNIQUE,
    anio INT NOT NULL,
    capacidad_carga DECIMAL(10, 2) NOT NULL
);

CREATE TABLE conductores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    apellido VARCHAR(80) NOT NULL,
    numero_documento VARCHAR(20) NOT NULL UNIQUE,
    numero_licencia VARCHAR(30) NOT NULL UNIQUE,
    fecha_alta_licencia DATE NOT NULL,
    fecha_vencimiento_licencia DATE NOT NULL
);

CREATE TABLE viajes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehiculo_id INT NOT NULL,
    conductor_id INT NOT NULL,
    fecha_salida DATETIME NOT NULL,
    fecha_llegada DATETIME NOT NULL,
    origen VARCHAR(120) NOT NULL,
    destino VARCHAR(120) NOT NULL,
    kilometros DECIMAL(10, 2) NOT NULL,
    observaciones TEXT,
    CONSTRAINT fk_viaje_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE RESTRICT,
    CONSTRAINT fk_viaje_conductor FOREIGN KEY (conductor_id) REFERENCES conductores(id) ON DELETE RESTRICT
);

-- Datos iniciales de prueba
INSERT INTO vehiculos (marca, modelo, patente, anio, capacidad_carga) VALUES
('Mercedes-Benz', 'Actros 2042', 'AE452KL', 2021, 28000.00),
('Iveco', 'Daily 70C17', 'AF109MP', 2022, 4500.00);

INSERT INTO conductores (nombre, apellido, numero_documento, numero_licencia, fecha_alta_licencia, fecha_vencimiento_licencia) VALUES
('Carlos', 'Gomez', '32456789', 'LIC-99812', '2020-05-10', '2028-05-10'),
('Lucia', 'Fernandez', '35112233', 'LIC-77431', '2021-08-15', '2027-08-15');