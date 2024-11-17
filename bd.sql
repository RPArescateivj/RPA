-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 17-11-2024 a las 06:41:28
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `bd`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ayuda`
--

CREATE TABLE `ayuda` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `problema` text NOT NULL,
  `fecha` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comentarios`
--

CREATE TABLE `comentarios` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `mensaje` text DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `comentarios`
--

INSERT INTO `comentarios` (`id`, `usuario_id`, `nombre`, `email`, `mensaje`, `fecha`) VALUES
(2, 1, 'valeria', 'vale@gmail.com', 'buenisima', '2024-10-31 04:20:25');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reportes`
--

CREATE TABLE `reportes` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `sexo` enum('Masculino','Femenino','Otro') NOT NULL,
  `edad` int(11) NOT NULL CHECK (`edad` >= 18),
  `tipo_animal` varchar(50) NOT NULL,
  `posible_responsable` varchar(255) DEFAULT NULL,
  `descripcion` text NOT NULL,
  `fecha` date NOT NULL,
  `numero_exterior` varchar(50) DEFAULT NULL,
  `colonia` varchar(100) DEFAULT NULL,
  `municipio` varchar(100) DEFAULT NULL,
  `estado` varchar(100) DEFAULT NULL,
  `codigo_postal` varchar(10) DEFAULT NULL,
  `usuario_id` int(11) NOT NULL,
  `evidencias` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`evidencias`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `reportes`
--

INSERT INTO `reportes` (`id`, `nombre`, `apellido`, `telefono`, `correo`, `sexo`, `edad`, `tipo_animal`, `posible_responsable`, `descripcion`, `fecha`, `numero_exterior`, `colonia`, `municipio`, `estado`, `codigo_postal`, `usuario_id`, `evidencias`, `created_at`) VALUES
(1, 'valeria', 'hernandez', '5652076408', 'vale@gmail.com', 'Femenino', 45, 'perro', 'vecino', 'kjhgfdfghj', '2024-10-05', '5', 'fghjkkjhg', 'tecamac', 'mexico', '55755', 1, '[\"1729485262834.jpg\"]', '2024-10-21 04:34:22'),
(3, 'valeria', 'hernandez', '5652076408', 'vale@gmail.com', 'Femenino', 45, 'perro', 'vecino', 'nuevo reporte', '2024-10-10', '5', 'fghjkkjhg', 'tecamac', 'mexico', '55755', 1, '[\"1729612254440.jpg\"]', '2024-10-22 15:50:54'),
(4, 'armando', 'torres', '5518887607', 'armando@gmail.com', 'Otro', 24, 'perro', 'vecino', 'l', '2024-10-09', '5', 'fghjkkjhg', 'tecamac', 'mexico', '55755', 1, '[\"1729631877363.webp\"]', '2024-10-22 21:17:57'),
(5, 'armando', 'torres', '5518887607', 'armando@gmail.com', 'Femenino', 24, 'perro', 'vecino', 'nuevo reporte pa comprobar :)))', '2024-10-05', '5', 'fghjkkjhg', 'tecamac', 'mexico', '55755', 11, '[\"1729720764323.jpg\"]', '2024-10-23 21:59:24'),
(6, 'juan ', 'perez', '555555555', 'luc@luc.com', 'Otro', 33, 'serpiente', 'desconocido', 'venenosa', '2024-10-31', '5', 'fghjkkjhg', 'tecamac', 'mexico', '55755', 12, '[\"1729721663371.jpg\"]', '2024-10-23 22:14:23');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('usuario','admin') DEFAULT 'usuario',
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_admin` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `apellido`, `email`, `password`, `rol`, `fecha_registro`, `is_admin`) VALUES
(1, 'valeria', 'hernandez', 'valeria@gmail.com', '$2b$10$efjQkOY1XY.YOJVWoj1jZOMk.cV30S7l1.lKxJOgCPnUM5xTZ3tA6', 'usuario', '2024-10-21 04:29:46', 0),
(3, 'danae', 'hernandez', 'danae@gmail.com', '$2b$10$3FvCSAlIZVv2kYwD8mt3eu//bwTXxMmIZ8Eommv47kieGro0gm1Uy', 'usuario', '2024-10-23 17:06:08', 0),
(10, 'Administrador', 'Principal', 'admin@gmail.com', 'admin1234', 'admin', '2024-10-23 20:25:10', 1),
(11, 'danae', 'hernandez', 'danitart@gmail.com', '$2b$10$onHDrshc1ER9.fSVKZCw3OVrTX7sHkdNxQ52Zf5pKAX7dhYA.QtDC', 'usuario', '2024-10-23 21:49:49', 0),
(12, 'luc', 'abi', 'luc@luc.com', '$2b$10$WMxaMXW28Ah0LbTcwYUoB.lfNmP5xB9.xma7wK1DASuOZNpXPJlbO', 'usuario', '2024-10-23 22:09:51', 0);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `ayuda`
--
ALTER TABLE `ayuda`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `comentarios`
--
ALTER TABLE `comentarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `reportes`
--
ALTER TABLE `reportes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `ayuda`
--
ALTER TABLE `ayuda`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `comentarios`
--
ALTER TABLE `comentarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `reportes`
--
ALTER TABLE `reportes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `comentarios`
--
ALTER TABLE `comentarios`
  ADD CONSTRAINT `comentarios_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `reportes`
--
ALTER TABLE `reportes`
  ADD CONSTRAINT `reportes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
