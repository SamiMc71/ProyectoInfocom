-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 17-12-2025 a las 04:29:03
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
-- Base de datos: `inventario_digital`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id` int(11) NOT NULL,
  `tipo_documento` enum('DNI','RUC','CE') NOT NULL,
  `numero_documento` varchar(20) NOT NULL,
  `nombres` varchar(255) NOT NULL,
  `apellidos` varchar(255) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `estado` enum('activo','inactivo') DEFAULT 'activo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`id`, `tipo_documento`, `numero_documento`, `nombres`, `apellidos`, `telefono`, `email`, `direccion`, `fecha_creacion`, `estado`) VALUES
(1, 'DNI', '74651760', 'Nicolee Villacorta', '', '944938419', '', '', '2025-11-19 19:37:39', 'activo'),
(2, 'DNI', '60735793', 'Ashly Gomez', '', '945689740', '', '', '2025-11-19 19:39:06', 'activo'),
(3, 'DNI', '72409719', 'Lucero Mejia Tapia', '', '964535679', '', '', '2025-11-19 19:41:10', 'activo'),
(4, 'DNI', '71509902', 'Walter Cespedes', '', '955287074', '', '', '2025-11-19 19:42:07', 'activo'),
(5, 'DNI', '74923923', 'Samira Montesinos', '', '982117555', '', '', '2025-11-19 19:43:37', 'activo'),
(6, 'DNI', '74923924', 'Naysha Montesinos', '', '915762852', '', '', '2025-11-19 19:45:04', 'activo'),
(7, 'DNI', '40299875', 'Rosa Carrillo', '', '921778266', '', '', '2025-11-19 19:46:41', 'activo'),
(8, 'DNI', '04645241', 'John Montesinos', '', '974769077', '', '', '2025-11-19 19:48:34', 'activo'),
(9, 'DNI', '55555151', 'Joaquin Aragon ', '', '25222', '', '', '2025-12-12 15:31:33', 'activo'),
(10, 'DNI', '18481585', 'Rosa Carrillo ', '', '921778266', '', '', '2025-12-12 15:56:41', 'activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cotizaciones`
--

CREATE TABLE `cotizaciones` (
  `id` varchar(20) NOT NULL,
  `cliente_nombre` varchar(255) NOT NULL,
  `cliente_tipo_doc` enum('DNI','RUC','CE') NOT NULL,
  `cliente_num_doc` varchar(20) NOT NULL,
  `cliente_telefono` varchar(15) DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `igv` decimal(10,2) NOT NULL DEFAULT 0.00,
  `fecha` date NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `estado` enum('pending','approved','rejected') DEFAULT 'pending',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cotizaciones`
--

INSERT INTO `cotizaciones` (`id`, `cliente_nombre`, `cliente_tipo_doc`, `cliente_num_doc`, `cliente_telefono`, `subtotal`, `igv`, `fecha`, `total`, `estado`, `fecha_creacion`, `fecha_actualizacion`) VALUES
('COT-001', 'Samira Montesinos Carrillo', 'DNI', '74923923', '982117555', 1094.00, 196.92, '2025-11-19', 1290.92, 'pending', '2025-11-19 20:04:59', '2025-11-19 20:04:59'),
('COT-002', 'Marcelo Copa', 'DNI', '36547891', '962285727', 195.00, 35.10, '2025-12-12', 230.10, 'pending', '2025-12-12 16:56:47', '2025-12-12 16:56:47'),
('COT-003', 'Samira Montesinos Carrillo', 'DNI', '74923923', '982117555', 195.00, 35.10, '2025-12-12', 230.10, 'pending', '2025-12-12 17:06:50', '2025-12-12 17:06:50');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cotizacion_detalles`
--

CREATE TABLE `cotizacion_detalles` (
  `id` int(11) NOT NULL,
  `cotizacion_id` varchar(20) NOT NULL,
  `producto_id` varchar(10) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cotizacion_detalles`
--

INSERT INTO `cotizacion_detalles` (`id`, `cotizacion_id`, `producto_id`, `cantidad`, `precio_unitario`, `subtotal`) VALUES
(1, 'COT-001', 'P083', 1, 299.00, 299.00),
(2, 'COT-001', 'P080', 1, 225.00, 225.00),
(3, 'COT-001', 'P071', 1, 570.00, 570.00),
(4, 'COT-002', 'P082', 1, 195.00, 195.00),
(5, 'COT-003', 'P082', 1, 195.00, 195.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_venta`
--

CREATE TABLE `detalle_venta` (
  `id` int(11) NOT NULL,
  `venta_id` int(11) DEFAULT NULL,
  `producto_id` varchar(10) DEFAULT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `detalle_venta`
--

INSERT INTO `detalle_venta` (`id`, `venta_id`, `producto_id`, `cantidad`, `precio_unitario`, `subtotal`) VALUES
(1, 1, 'P081', 1, 1235.00, 1235.00),
(2, 2, 'P075', 1, 590.00, 590.00),
(3, 3, 'P072', 1, 610.00, 610.00),
(4, 4, 'P058', 1, 365.00, 365.00),
(5, 5, 'P053', 1, 155.00, 155.00),
(6, 6, 'P046', 1, 60.00, 60.00),
(7, 7, 'P046', 1, 60.00, 60.00),
(8, 8, 'P047', 1, 45.00, 45.00),
(9, 8, 'P051', 1, 165.00, 165.00),
(10, 8, 'P048', 1, 105.00, 105.00),
(12, 9, 'P082', 1, 195.00, 195.00),
(14, 10, 'P082', 1, 195.00, 195.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_venta_servicios`
--

CREATE TABLE `detalle_venta_servicios` (
  `id` int(11) NOT NULL,
  `venta_id` int(11) NOT NULL,
  `servicio_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` varchar(10) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `marca` varchar(100) NOT NULL,
  `categoria` varchar(50) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `precio` decimal(10,2) NOT NULL,
  `imagen` varchar(500) DEFAULT 'https://via.placeholder.com/150',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `estado` enum('activo','inactivo') DEFAULT 'activo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `nombre`, `descripcion`, `marca`, `categoria`, `stock`, `precio`, `imagen`, `fecha_creacion`, `fecha_actualizacion`, `estado`) VALUES
('002', 'Mouse Inalámbrico', 'Mouse óptico inalámbrico ergonómico', 'Logitech', 'Perifericos', 25, 49.99, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=150', '2025-11-19 05:00:42', '2025-11-19 15:34:51', 'inactivo'),
('004', 'Cámara Seguridad', 'Cámara IP 1080p con visión nocturna', 'D-Link', 'camaras de seguridad', 5, 199.99, 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=150', '2025-11-19 05:00:42', '2025-11-19 15:34:59', 'inactivo'),
('005', 'Memoria RAM 8GB', 'Memoria RAM DDR4 8GB 2666MHz', 'Kingston', 'Componentes', 30, 89.99, 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=150', '2025-11-19 05:00:42', '2025-11-19 15:34:49', 'inactivo'),
('P038', 'Monitor Curvo 27\" Samsung LS27DG300 33', '**Especificaciones del Producto 33:**\r\n- SKU Interno: SKU0033\r\n- 27\" FHD, 165Hz, Panel VA, 1ms, Freesync.\r\n- Stock Inicial: 5 unidades\r\n- Precio de Referencia: S/ 899.00', 'Samsung', 'Monitor', 5, 839.90, 'https://i.ibb.co/Gdk09X8/monitor-samsung.jpg', '2025-11-19 06:05:47', '2025-11-19 06:52:38', 'inactivo'),
('P039', 'Memoria RAM DDR4 Kingston Fury 16GB 34', '**Especificaciones del Producto 34:**\r\n- SKU Interno: SKU0034\r\n- DDR4 3200MHz, CL16, Voltaje 1.35V. Ideal para Gaming.\r\n- Stock Inicial: 3 unidades\r\n- Precio de Referencia: S/ 185.00', 'Kingston', 'Componentes', 3, 177.90, 'https://i.ibb.co/VMyh5zZ/ram-kingston.jpg', '2025-11-19 06:05:47', '2025-11-19 06:52:31', 'inactivo'),
('P040', 'Mouse Óptico Inalámbrico Logitech G305 35', '**Especificaciones del Producto 35:**\r\n- SKU Interno: SKU0035\r\n- Sensor óptico HERO, 12000 DPI, 6 botones, 2.4GHz Lightspeed.\r\n- Stock Inicial: 5 unidades\r\n- Precio de Referencia: S/ 149.00', 'Logitech', 'Perifericos', 5, 152.90, 'https://i.ibb.co/Wz0Xb50/logitech-mouse.jpg', '2025-11-19 06:05:47', '2025-11-19 06:52:29', 'inactivo'),
('P041', 'Impresora Multifuncional Epson L3250 EcoTank 36', '**Especificaciones del Producto 36:**\r\n- SKU Interno: SKU0036\r\n- Tanque de tinta, Wi-Fi, Imprime, copia y escanea a bajo costo.\r\n- Stock Inicial: 1 unidades\r\n- Precio de Referencia: S/ 749.00', 'Epson', 'Impresoras', 1, 762.29, 'https://i.ibb.co/gSTw2M8/epson-l3250.jpg', '2025-11-19 06:05:47', '2025-11-19 06:52:37', 'inactivo'),
('P042', 'Disco Duro SSD M.2 NVMe Seagate 1TB Firecuda 37', '**Especificaciones del Producto 37:**\r\n- SKU Interno: SKU0037\r\n- Velocidad de lectura 7000MB/s, PCIe Gen4. Alta velocidad.\r\n- Stock Inicial: 5 unidades\r\n- Precio de Referencia: S/ 399.00', 'Seagate', 'Almacenamiento', 5, 419.90, 'https://i.ibb.co/jR0H2yZ/ssd-nvme.jpg', '2025-11-19 06:05:47', '2025-11-19 06:52:34', 'inactivo'),
('P043', 'Cámara de Seguridad Teros Wi-Fi 1080P 38', '**Especificaciones del Producto 38:**\r\n- SKU Interno: SKU0038\r\n- Resolución 1080P, Visión Nocturna, Audio bidireccional, Gira 360°.\r\n- Stock Inicial: 3 unidades\r\n- Precio de Referencia: S/ 199.00', 'Teros', 'camaras de seguridad', 3, 201.90, 'https://i.ibb.co/8Ym8F2h/camara-teros.jpg', '2025-11-19 06:05:47', '2025-11-19 06:52:27', 'inactivo'),
('P044', 'MOUSE PAD TEROS TE-3011S TAMAÑO L', '* **Dimensiones:* 45 cm de largo x 40 cm de ancho x 0.3 cm de grosor.\n* **Material:*Superficie de tela lisa que permite un deslizamiento fluido del mouse.\n* **Base:*Goma antideslizante que asegura estabilidad durante el uso.\n* **Bordes:* Cosidos para evitar el desgaste y aumentar la durabilidad.\n* **Diseño:* Color negro con detalles multicolor que aportan un estilo moderno.\n* **Presentación:* Viene en un estuche plástico, ideal para almacenamiento o transporte.\n* **Compatibilidad:* Compatible con mouses ópticos y láser.\n* **Uso recomendado:*Ideal para gaming, oficina, diseño gráfico y otras actividades que requieren precisión y comodidad en el movimiento del mouse.', 'TEROS', 'Perifericos', 10, 30.00, 'https://mesajil.com/wp-content/uploads/2025/07/123624.webp', '2025-11-19 07:14:35', '2025-11-19 07:14:35', 'activo'),
('P045', 'MOUSE PAD MM350 Champion Series TAMAÑO L', '* **Superficie de tela tejida:** Control preciso y baja fricción para una máxima velocidad.\n* **Grosor de 5 mm:** Comodidad superior y suavizado de superficies irregulares.\n* **Bordes cosidos a 360°:** Resistencia al deshilachado y larga vida útil.\n* **Base de goma antideslizante:** Firmeza total en cualquier escritorio.\n* **Diseño minimalista:** Superficie negra sólida, optimizada para el rendimiento.', 'CORSAIR', 'Perifericos', 15, 85.00, 'https://smartbusiness.pe/cdn/shop/files/pad-mouse-corsair-mm350-champion-series-xl-450mm-x-400mm-tela-antidesgaste-color-negro-ch-9413560-ww-smart-business-1.png?v=1740118392', '2025-11-19 07:15:39', '2025-11-19 07:15:39', 'activo'),
('P046', 'MOUSE INALAMBRICO DUAL TEROS TE-1230CS', '* **Conectividad Dual:** Inalámbrico, soporta conexión a través de 2.4 GHz (con receptor USB) y Bluetooth 5.0 (BT1 5.0 + BT2 5.0), permitiendo cambiar entre dispositivos.\n* **Botones:** 3 botones (izquierdo, derecho y rueda clicable).\n* **Resolución (DPI):** 1200 DPI, adecuado para tareas diarias y de oficina.\n* **Frecuencia de Escaneo:** 3000 FPS.\n* **Durabilidad:** 5 millones de clics.\n* **Alcance:** Cobertura de 15 a 20 metros.\n* **Batería:** Recargable con capacidad de 600 mAh.\n* **Diseño:** Compacto y ergonómico, ligero (aprox. 64 gramos).\n* **Compatibilidad:** Windows (8, 10, 11) y otros sistemas operativos como macOS y Linux.', 'TEROS', 'Perifericos', 3, 60.00, 'https://imagenes.deltron.com.pe//images/productos/on-line/items/large/ms/wb/mswbkte1230cs.jpg', '2025-11-19 07:16:15', '2025-11-19 19:46:41', 'activo'),
('P047', 'PARLANTE CYBERTEL CYBORG CYB S100', '* **Tipo de producto:** Parlantes estéreo 2.0\n* **Modelo:** Cyborg CYB S100\n* **Potencia de salida:** 6 W RMS (3 W x 2)\n* **Conectividad:** Entrada de audio jack de 3.5 mm\n* **Alimentación:** Conexión USB\n* **Controles:** Perilla de volumen en uno de los satélites\n* **Compatibilidad:** Computadoras, laptops y otros dispositivos de audio\n* **Diseño:** Acabado brillante de lujo\n* **Dimensiones:** Aproximadamente 8 cm x 15.5 cm x 9.3 cm\n* **Color:** Negro\n* **Contenido del paquete:** Parlantes, cable USB, guía de usuario', 'CYBERTEL', 'Perifericos', 1, 45.00, 'https://hdcompany.pe/uploads/Parlante-CYBERTEL-cyborg-CYB-S100-6w-24082023145450.png', '2025-11-19 07:17:05', '2025-11-19 19:48:34', 'activo'),
('P048', ' PARLANTE GAMER CYBERTEL EXXPERT CBX S500', '* **Tipo de producto:** Sistema de sonido 2.1 para gaming\n* **Modelo:** Exxpert CBX S500\n* **Potencia de salida:** 2 W x 2 (satélites) + 3 W (woofer)\n* **Sistema de audio:** 2.1 canales\n* **Woofer:** 3 pulgadas\n* **Satélites:** 2 unidades de 2 pulgadas cada una\n* **Iluminación:** LED RGB con efectos dinámicos\n* **Controles:** Perillas frontales para volumen, bajos y agudos; botón de encendido\n* **Conectividad:** Entrada de audio jack de 3.5 mm\n* **Alimentación:** Conexión USB\n* **Compatibilidad:** PC, laptops, televisores, reproductores de DVD y otros dispositivos de audio\n* **Dimensiones del empaque:** Alto: 17.7 cm | Ancho: 12.3 cm | Largo: 23.2 cm', 'CYBERTEL', 'laptops', 5, 105.00, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTokl-xPWRdK3NQn0AroW_K-fasqvcA5xdQnw&s', '2025-11-19 07:17:56', '2025-11-19 19:48:34', 'activo'),
('P049', 'MICROFONO KROM KAPSULE HQ + BRAZO Y FILTRO', '* **Tipo de micrófono:** Condensador de doble cápsula\n* **Patrones de grabación:** Cardioide y omnidireccional\n* **Frecuencia de respuesta:** 20 Hz – 20 kHz\n* **Tasa de muestreo:** 96 kHz\n* **Resolución:** 24 bits\n* **Sensibilidad:** 4.5 mV/Pa (1 kHz)\n* **Conectividad:** USB y salida de auriculares de 3.5 mm\n* **Voltaje:** DC 5V\n* **Consumo de corriente:** 150 mA\n* **Longitud del cable:** 2 metros\n* **Dimensiones:** 45 x 45 x 150 mm\n* **Peso:** 1000 g\n* **Compatibilidad:** Windows y macOS', 'KROM', 'Perifericos', 10, 350.00, 'https://api.kromgaming.com/uploads/product/image-with-hot-points/images/yz362ursd4-krom_kapsule_hotspots_base.png', '2025-11-19 07:18:43', '2025-11-19 07:18:43', 'activo'),
('P050', 'MICROFONO FIFINE A6T +BRAZO PARA ESCRITORIO', '* **Tipo de micrófono:** Condensador\n* **Patrón polar:** Cardioide\n* **Frecuencia de respuesta:** 60 Hz – 18 kHz\n* **Frecuencia de muestreo:** 44.1 kHz\n* **Resolución:** 16 bits\n* **Sensibilidad:** -40 ±3 dB\n* **Relación señal/ruido:** 70 dB\n* **Conectividad:** USB tipo C (micrófono) a USB tipo A (PC/Mac)\n* **Voltaje de operación:** 4.75 V – 5.25 V\n* **Compatibilidad:** Windows, macOS y PlayStation 4/5\n* **Funciones adicionales:** Iluminación RGB con gradiente automático, botón táctil para silenciar, control de volumen integrado', 'FIFINE', 'Perifericos', 20, 235.00, 'https://www.pcfactory.com.pe/public/foto/2356/1_1000.jpg?t=1738875806201', '2025-11-19 07:19:33', '2025-11-19 07:19:33', 'activo'),
('P051', 'Webcam TEROS TE-9073N, 4K, micrófono incorporado, USB 2.0', '* **Resolución de video:** 4K UHD (3840 × 2160) a 30 fps\n* **Micrófono:** integrado, omnidireccional, con cancelación de ruido\n* **Interfaz / conexión:** USB 2.0, plug & play\n* **Ángulo de visión del lente:** ~ 80.53°\n* **Longitud del cable:** aprox. 1.5 m\n* **Compatibilidad:** Windows, macOS, Linux\n* **Formatos de captura:** video en MP4 / foto JPG', 'TEROS', 'Perifericos', 24, 165.00, 'https://promart.vteximg.com.br/arquivos/ids/9410160-1000-1000/imageUrl_1.jpg?v=638945518177800000', '2025-11-19 07:20:36', '2025-11-19 19:48:34', 'activo'),
('P052', 'ROUTER TL- WR840N 2.4 GHz -300Mpbs', '* **Estándar Wi-Fi:** N300 (Wi-Fi 4)\n* **Banda de Frecuencia:** 2.4 GHz (es banda única)\n* **Velocidad Inalámbrica:** Hasta 300 Mbps (802.11n)\n* **Antenas:** 2 antenas fijas (generalmente de 5 dBi)\n* **Puertos Ethernet:** 4 puertos LAN 10/100 Mbps y 1 puerto WAN 10/100 Mbps (Fast Ethernet)\n* **Modos de Operación:** Router, Punto de Acceso (AP) y Extensor de Rango (Repetidor)\n* **Características Adicionales:** QoS (Control de Ancho de Banda basado en IP), Controles Parentales, Red de Invitados, Soporte para IPv6', 'TL', 'Modem / Repetidores', 5, 90.00, 'https://casemotions.pe/wp-content/uploads/2024/04/TL-WR840N_000.jpg', '2025-11-19 07:21:38', '2025-11-19 07:21:38', 'activo'),
('P053', 'Router TP-Link Archer C20', '* **Estándar Wi-Fi:** AC750 (IEEE 802.11ac). Wi-Fi de Doble Banda Simultánea.\n* **Velocidad Total:** Hasta 733 Mbps combinados.\n* **Banda 2.4 GHz:** Hasta 300 Mbps (802.11n). Para tareas básicas como navegación y correo.\n* **Banda 5 GHz:** Hasta 433 Mbps (802.11ac). Para tareas intensivas como streaming HD y juegos.\n* **Antenas:** 3 antenas fijas (2x 2.4GHz, 1x 5GHz) para una cobertura omnidireccional estable.\n* **Puertos Ethernet:** 4 puertos LAN 10/100 Mbps y 1 puerto WAN 10/100 Mbps (Fast Ethernet).\n* **Puerto USB:** 1 puerto USB 2.0 (Permite compartir archivos o una impresora en red).\n* **Modos de Trabajo:** Router, Punto de Acceso (Access Point) y Extensor de Rango (Range Extender).\n* **Funciones Adicionales:** Red de Invitados (Guest Network), Control Parental, compatible con IPv6, gestión sencilla mediante la App Tether.', 'TP-LINK', 'Modem / Repetidores', 1, 155.00, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRIcAhqS5MADfgXSSVRPuELFZgxuxg4eKoaw&s', '2025-11-19 07:22:35', '2025-11-19 19:43:37', 'activo'),
('P054', 'CÁMARA FOCO SMART UHD 2K TE-90604W', '\nResolución de 3 MP (UHD 2K): Proporciona imágenes claras y detalladas para una vigilancia efectiva.\n\nGiro de Seguimiento 360° e Inclinación Automática: Ofrece una cobertura completa del entorno, reduciendo los puntos ciegos.\n\nLuz LED de 5W: Proporciona iluminación adicional, mejorando la visibilidad y disuadiendo posibles intrusos.\n\nVisión Nocturna: Permite una vigilancia eficaz incluso en condiciones de poca luz.\n\nComunicación de 2 Vías: Micrófono y altavoz integrados que permiten la comunicación en tiempo real.\n\nConectividad Wi-Fi: Compatible con redes Wi-Fi de 2.4 GHz, facilitando su integración en sistemas domésticos inteligentes.\n\nAlmacenamiento Flexible: Admite tarjetas microSD de hasta 128 GB y ofrece la opción de almacenamiento en la nube.\n\nCompatibilidad con Asistentes de Voz: Integración con Amazon Alexa y Google Home para control por voz.\n\nFácil Instalación: Diseñada para ser instalada en sockets estándar E27, sin necesidad de herramientas adicionales.', 'TEROS', 'camaras de seguridad', 5, 145.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/68765815/thumb/1079/1079?1760625986', '2025-11-19 07:29:40', '2025-11-19 07:31:22', 'activo'),
('P055', 'LAPTOP HP CORE i3-N305 /8GB /256GB', '\nPantalla: 15.6\" HD SVA (1366 x 758) antirreflejo.\n\nProcesador: Intel® Core™ i3 N305\n\nMemoria RAM: 8 GB de RAM DDR4, expandible hasta 32 GB en total.\n\nAlmacenamiento: SSD PCIe ® NVMe™de 256 GB. \n\nGráficos: Gráficos integrados Intel® UHD Graphics.\n\nPuertos: 01 USB-C, 02 USB 3.2 Gen 1, 01 HDMI 1.4b.\n\nCámara: Cámara HD 720p con un obturador de privacidad, con microfono digital integrado.\n\nConectividad: Wi-Fi 6  y Bluetooth® 5.3.\n\nSistema Operativo: Sin sistema operativo preinstalado (FreeDOS 3.0), lo que te permite elegir el que prefieras.\n\nDiseño: De color gris oscuro, tiene un diseño delgado y discreto, ideal para trabajo o estudio.\n\nPeso: Con un peso de 1.52 kg. Lo que lo hace ligero y facil de transportar.\n\nCertificacion: MIL-STD-810H Grado militar.', 'HP', 'laptops', 11, 1480.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/67478008/thumb/1079/1079?1757548580', '2025-11-19 07:32:32', '2025-11-19 14:18:15', 'activo'),
('P056', 'KIT 4 CÁMARAS HIKVISION FHD 2MP CON AUDIO - VISION NOCTURNA COLORES', 'KIT 4 CÁMARAS NEGOCIO + INSTALACION\n\nTu Kit de 4 cámaras FHD COLORVU HIKVISION Incluye:\n\n01 Grabador DVR de 4 Canales FHD\n\n02 Cámaras Tubo Exterior FHD 2MP – COLORVU\n\n02 Cámaras Domo FHD 2MP – FULL COLORVU\n\n01 Disco Duro de 1TB SATA\n\nIncluye un rollo de cable UTP CAT6 de 60 metros\n\n✅ FULL COLOR DE DIA Y DE NOCHE\n✅ 2MPX-FHD\n✅ Más tranquilidad a tu hogar y negocio\n✅ Prevención de actividades delictivas.\n✅ Ayuda en la prevención de delitos.\n✅ Más control.\n✅ Recomendamos usar estos equipos con un UPS\n✅ Puedes aún blindarte más con un Kit de Alarma anti-robo', 'HIKVISION', 'camaras de seguridad', 10, 1350.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/68615328/thumb/1079/1079?1760372324', '2025-11-19 15:00:11', '2025-11-19 15:01:44', 'activo'),
('P057', 'KIT 4 CÁMARAS HIKVISION FHD 5MP CON AUDIO', '\nKIT 4 CÁMARAS HIKVISION FHD 5MP CON AUDIO VISION NOCTURNA COLORES. COLOR VU\n\nTu Kit de 4 cámaras FHD COLORVU HIKVISION Incluye:\n\n- 01 Grabador DVR de 4 Canales FHD\n\n- 02 Cámaras Tubo Exterior FHD 5MP – COLORVU\n\n- 02 Cámaras Domo FHD 5MP – FULL COLORVU\n\n- 01 Disco Duro de 1TB SATA\n\n- Incluye un rollo de cable UTP CAT6 de 60 metros\n\n\n✅ FULL COLOR DE DIA Y DE NOCHE\n✅ 5MPX-FHD\n✅ Más tranquilidad a tu hogar y negocio\n✅ Prevención de actividades delictivas.\n✅ Ayuda en la prevención de delitos.\n✅ Más control.\n✅ Recomendamos usar estos equipos con un UPS\n✅ Puedes aún blindarte más con un Kit de Alarma anti-robo', 'HIKVISION', 'camaras de seguridad', 10, 1550.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/68615376/thumb/1079/1079?1760372419', '2025-11-19 15:27:49', '2025-11-19 15:28:37', 'activo'),
('P058', 'CÁMARA EXT. GIRA. H9C 2K. 3MP', '\n- Tipo de cámara: Doble lente (fija + PTZ)\n\n- Resolución: Dual 2K (2304 × 1296) 3MP\n\n- Movimiento PTZ: 240° horizontal / 360° vertical\n\n- Detección inteligente: Personas y vehículos con IA\n\n- Seguimiento automático: Coordinación entre lentes fija y PTZ\n\n- Defensa activa: Sirena y luz estroboscópica disuasoria\n\n- Audio: Bidireccional (micrófono y altavoz integrados)\n\n- Visión nocturna: Alcance de hasta 30 m por infrarrojos\n\n- Conectividad: Wi-Fi 2.4 GHz (antenas duales) y puerto RJ45\n\n- Almacenamiento: MicroSD hasta 512 GB + nube EZVIZ CloudPlay\n\n- Uso: Exterior, resistente a la intemperie', 'EZVIZ', 'camaras de seguridad', 9, 365.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/68765418/thumb/1079/1079?1760999315', '2025-11-19 15:30:49', '2025-11-19 19:42:07', 'activo'),
('P059', 'CÁMARA EXT. GIRA. H8C FHD. 2MP', 'Resolución: Full HD 1080p (2MP)\n\n- Cobertura: Panorámica de 360° (350° horizontal / 80° vertical)\n\n- Visión nocturna: En color, hasta 30 m\n\n- Detección inteligente: Personas con IA y seguimiento automático\n\n- Defensa activa: Sirena y luz estroboscópica\n\n- Audio: Bidireccional (micrófono y altavoz integrados)\n\n- Almacenamiento: MicroSD hasta 512 GB + nube EZVIZ CloudPlay\n\n- Conectividad: Wi-Fi 2.4 GHz y cable Ethernet RJ45\n\n- Uso: Exterior, resistente a la intemperie\n\n- Control: Compatible con app EZVIZ (iOS, Android y PC)', 'EZVIZ', 'camaras de seguridad', 5, 265.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/68765497/thumb/1079/1079?1761000923', '2025-11-19 15:33:04', '2025-11-19 15:33:04', 'activo'),
('P060', 'CÁMARA EXT. GIRA. H9C 3K. 5MP', '- Tipo de cámara: Doble lente (fija + PTZ)\n\n- Resolución: Dual 3K  - 5MP\n\n- Movimiento PTZ: 240° horizontal / 360° vertical\n\n- Detección inteligente: ersonas, vehículos, seguimiento automático (“Smart Tracking”).\n\n- Seguimiento automático: Coordinación entre lentes fija y PTZ\n\n- Defensa activa: Sirena y luz estroboscópica disuasoria\n\n- Audio: Bidireccional (micrófono y altavoz integrados)\n\n- Visión nocturna: Alcance de hasta 30 m por infrarrojos\n\n- Conectividad: Wi-Fi 2.4 GHz (antenas duales) y puerto RJ45\n\n- Almacenamiento: MicroSD hasta 512 GB + nube EZVIZ CloudPlay\n\n- Uso: Exterior, resistente a la intemperie', 'EZVIZ', 'camaras de seguridad', 2, 405.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/68765544/thumb/1079/1079?1761000066', '2025-11-19 15:34:40', '2025-11-19 15:34:40', 'activo'),
('P061', 'CÁMARA EXT. C3TN FHD - 2MP', '\nCÁMARA EXTERIOR FIJA C3TN\n\nResolución Full HD 1080p (2MP): Ofrece imágenes claras y detalladas para una vigilancia efectiva.\n\nVisión Nocturna Infrarroja de hasta 30 metros: Permite una vigilancia eficaz incluso en la oscuridad.\n\nÁngulo de Visión Amplio: Lente de 2.8 mm con un ángulo de visión horizontal de 106°, cubriendo amplias áreas.\n\nAudio Unidireccional: Micrófono integrado que permite escuchar el entorno monitoreado.\n\nDetección de Movimiento: Recibe alertas en tiempo real cuando se detecta movimiento en el área monitoreada.\n\nConectividad Versátil: Compatible con Wi-Fi de 2.4 GHz y conexión por cable Ethernet RJ45.\n\nAlmacenamiento Flexible: Admite tarjetas microSD de hasta 256 GB y ofrece la opción de almacenamiento en la nube a través de EZVIZ CloudPlay (requiere suscripción).\n\nResistencia al Clima: Clasificación IP67 que garantiza protección contra polvo y agua, adecuada para uso en exteriores.\n\nCompatibilidad con Aplicaciones: Se puede gestionar mediante la aplicación EZVIZ para iOS y Android, así como EZVIZ Studio para PC.', 'EZVIZ', 'camaras de seguridad', 10, 225.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/68765598/thumb/1079/1079?1760625448', '2025-11-19 15:36:23', '2025-11-19 15:36:23', 'activo'),
('P062', 'CÁMARA INT. EZVIZ H7C 2K', 'CÁMARA INTERIOR EZVIZ-H7C 2K+2K DUAL\n\nResolución Dual 2K+ (2560 x 1440 píxeles): Equipada con dos lentes de alta resolución que proporcionan imágenes claras y detalladas.\n\nCobertura Panorámica de 360°: Gracias a su capacidad de giro horizontal de 360° y vertical de 130°, ofrece una visión completa del entorno.\n\nVisión Nocturna en Color: Permite una vigilancia eficaz incluso en la oscuridad.\n\nDetección de Movimiento Humano con IA: Identifica y sigue automáticamente a personas en movimiento, reduciendo las falsas alarmas.\n\nDetección de Sonidos Fuertes: Alerta sobre ruidos inusuales en el entorno.\n\nAudio Bidireccional: Micrófono y altavoz integrados que permiten la comunicación en tiempo real.\n\nModos de Patrullaje Automático: Configura rutas de vigilancia predefinidas para una supervisión constante.\n\nModo de Privacidad: Desactiva temporalmente la grabación y el monitoreo para proteger tu privacidad.\n\nConectividad Versátil: Compatible con Wi-Fi de 2.4/5 GHz y conexión por cable Ethernet RJ45.\n\nAlmacenamiento Flexible: Admite tarjetas microSD de hasta 512 GB y ofrece la opción de almacenamiento en la nube a través de EZVIZ CloudPlay (requiere suscripción).\n\nCompatibilidad con Asistentes de Voz: Integración con Amazon Alexa y Google Assistant para control por voz.', 'EZVIZ', 'camaras de seguridad', 5, 275.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/68765698/thumb/1079/1079?1761005353', '2025-11-19 15:41:37', '2025-11-19 15:41:37', 'activo'),
('P063', 'CÁMARA INT. GIRA. EZVIZ - H6C FHD. 2MP', 'CÁMARA INTERIOR GIRAT EZVIZ -H6C FHD\nResolución Full HD 1080p (2MP): Proporciona imágenes nítidas y detalladas para una vigilancia efectiva.\n\nCobertura Panorámica de 360°: Gracias a su capacidad de giro horizontal de 340° y vertical de 55°, ofrece una visión completa del entorno, reduciendo los puntos ciegos.\n\nVisión Nocturna Infrarroja: Alcance de hasta 10 metros, permitiendo una vigilancia eficaz incluso en la oscuridad.\n\nDetección Inteligente de Movimiento: Identifica y sigue automáticamente a personas en movimiento, reduciendo las falsas alarmas.\n\nAudio Bidireccional: Micrófono y altavoz integrados que permiten la comunicación en tiempo real.\n\nModo de Patrullaje Personalizado: Configura rutas de vigilancia predefinidas para una supervisión constante.\n\nModo de Privacidad: Desactiva temporalmente la grabación y el monitoreo para proteger tu privacidad.\n\nConectividad Versátil: Compatible con Wi-Fi de 2.4 GHz y conexión por cable Ethernet RJ45.\n\nAlmacenamiento Flexible: Admite tarjetas microSD de hasta 256 GB y ofrece la opción de almacenamiento en la nube a través de EZVIZ CloudPlay (requiere suscripción).\n\nCompatibilidad con Aplicaciones: Se puede gestionar mediante la aplicación EZVIZ para iOS y Android, así como EZVIZ Studio para PC', 'EZVIZ', 'camaras de seguridad', 2, 195.00, 'https://via.placeholder.com/150', '2025-11-19 15:42:44', '2025-11-19 15:44:01', 'inactivo'),
('P064', 'CÁMARA INT. GIRA. EZVIZ - H6C FHD. 2MP', 'CÁMARA INTERIOR GIRAT EZVIZ -H6C FHD\n\nResolución Full HD 1080p (2MP): Proporciona imágenes nítidas y detalladas para una vigilancia efectiva.\n\nCobertura Panorámica de 360°: Gracias a su capacidad de giro horizontal de 340° y vertical de 55°, ofrece una visión completa del entorno, reduciendo los puntos ciegos.\n\nVisión Nocturna Infrarroja: Alcance de hasta 10 metros, permitiendo una vigilancia eficaz incluso en la oscuridad.\n\nDetección Inteligente de Movimiento: Identifica y sigue automáticamente a personas en movimiento, reduciendo las falsas alarmas.\n\nAudio Bidireccional: Micrófono y altavoz integrados que permiten la comunicación en tiempo real.\n\nModo de Patrullaje Personalizado: Configura rutas de vigilancia predefinidas para una supervisión constante.\n\nModo de Privacidad: Desactiva temporalmente la grabación y el monitoreo para proteger tu privacidad.\n\nConectividad Versátil: Compatible con Wi-Fi de 2.4 GHz y conexión por cable Ethernet RJ45.\n\nAlmacenamiento Flexible: Admite tarjetas microSD de hasta 256 GB y ofrece la opción de almacenamiento en la nube a través de EZVIZ CloudPlay (requiere suscripción).\n\nCompatibilidad con Aplicaciones: Se puede gestionar mediante la aplicación EZVIZ para iOS y Android, así como EZVIZ Studio para PC', 'EZVIZ', 'camaras de seguridad', 2, 195.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/68765780/thumb/1079/1079?1760625870', '2025-11-19 15:44:50', '2025-11-19 15:44:50', 'activo'),
('P065', 'CÁMARA INT. TE-90602W. 2K. 3MP', 'CÁMARA PARA INTERIOR TE-90602W\n\nResolución de 3 MP (UHD 2K): Ofrece imágenes claras y detalladas para una vigilancia efectiva.\n\nTecnología PTZ (Pan-Tilt-Zoom): Permite un giro horizontal de hasta 355° y una inclinación vertical de 65°, ofreciendo una cobertura amplia del entorno.\n\nVisión Nocturna Infrarroja: Alcance de hasta 10 metros, garantizando una vigilancia eficaz incluso en condiciones de poca luz.\n\nDetección de Movimiento y Sonido: Incluye alarmas avanzadas para detección de movimiento, humana y sirena con notificaciones en tiempo real.\n\nAudio Bidireccional: Micrófono y altavoz integrados que permiten la comunicación en tiempo real.\n\nConectividad Wi-Fi: Compatible con redes Wi-Fi de 2.4 GHz, facilitando su integración en sistemas domésticos inteligentes.\n\nAlmacenamiento Flexible: Admite tarjetas microSD de hasta 128 GB y ofrece la opción de almacenamiento en la nube.\n\nCompatibilidad con Asistentes de Voz: Integración con Amazon Alexa y Google Home para control por voz.\n\nFácil Instalación: Diseñada para ser instalada en techos o paredes, con un diseño compacto y elegante en color blanco.', 'TEROS', 'laptops', 10, 125.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/68765926/thumb/1079/1079?1761004562', '2025-11-19 15:46:52', '2025-11-19 15:46:52', 'activo'),
('P066', 'LAPTOP LENOVO CORE i3-1315U /8GB /256Gb', 'Pantalla: 15.6\" Full HD (1920 x 1080) antirreflejo.\n\nProcesador: Intel® Core™ i3-1315U de 13.ª generación.\n\nMemoria RAM: 8 GB de RAM DDR4, expandible hasta 16 GB en total.\n\nAlmacenamiento: SSD PCIe 4.0® NVMe™de 256 GB. (SOPORTA 1 x 2.5\" SLOT + 1 x M.2 SSD)\nGráficos: Gráficos integrados Intel® UHD Graphics.\n\nPuertos: 01 USB-C, 01 USB 3.2 Gen 1,  01 USB 2.0, 01 HDMI 1.4b y Ethernet RJ-45.\n\nCámara: Cámara HD 720p con un obturador de privacidad para mayor seguridad.\n\nConectividad: Wi-Fi 6 (802.11ax) y Bluetooth® 5.2.\n\nSistema Operativo: Sin sistema operativo preinstalado (FreeDOS), lo que te permite elegir el que prefieras.\n\nDiseño: Construcción de plástico (PC-ABS) en color Gris Hierro (\"Iron Grey\") y un peso a partir de 1.65 kg, haciéndola ligera y portátil.\n\nPeso: Con un peso de 1.65 kg. Lo que lo hace ligero y facil de transportar.\n\nCertificacion: MIL-STD-810H Grado militar.', 'LENOVO', 'laptops', 4, 1280.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/67485945/thumb/1079/1079?1757554598', '2025-11-19 15:49:16', '2025-11-19 15:49:16', 'activo'),
('P067', 'LAPTOP LENOVO CORE i3-1315U /8GB /SSD512GB', 'Pantalla: 15.6\" Full HD (1920 x 1080) antirreflejo.\n\nProcesador: Intel® Core™ i3-1315U de 13.ª generación.\n\nMemoria RAM: 8 GB de RAM DDR4, expandible hasta 16 GB en total.\n\nAlmacenamiento: SSD PCIe 4.0® NVMe™de 512 GB. (SOPORTA 1 x 2.5\" SLOT + 1 x M.2 SSD)\n\nGráficos: Gráficos integrados Intel® UHD Graphics.\n\nPuertos: 01 USB-C, 01 USB 3.2 Gen 1,  01 USB 2.0, 01 HDMI 1.4b y Ethernet RJ-45.\n\nCámara: Cámara HD 720p con un obturador de privacidad para mayor seguridad.\n\nConectividad: Wi-Fi 6 (802.11ax) y Bluetooth® 5.2.\n\nSistema Operativo: Sin sistema operativo preinstalado (FreeDOS), lo que te permite elegir el que prefieras.\n\nDiseño: Construcción de plástico (PC-ABS) en color Gris Hierro (\"Iron Grey\") y un peso a partir de 1.65 kg, haciéndola ligera y portátil.\n\nPeso: Con un peso de 1.65 kg. Lo que lo hace ligero y facil de transportar.\n\nCertificacion: MIL-STD-810H Grado militar.', 'LENOVO', 'laptops', 4, 1450.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/67486802/thumb/1079/1079?1757555225', '2025-11-19 15:50:31', '2025-11-19 15:50:31', 'activo'),
('P068', 'LAPTOP LENOVO CORE !3-N305 /8GB LPDDR5 /512 GB', '\nPantalla: 15.6\" Full HD TN (1920 x 1080) antirreflejo.\n\nProcesador: Intel® Core™ i3-N305.\n\nMemoria RAM: 8 GB de RAM LPDDR5 4800 MHZ.\n\nAlmacenamiento: SSD PCIe 4.0® NVMe™de 512 GB. \n\nLector de memoria: Lector de tarjetas SD multiformato.\n\nGráficos: Gráficos integrados Intel® UHD Graphics.\n\nPuertos: 01 USB-C (Soporta transferencia protocolo DisplayPort 1.2), 02 USB 3.2 Gen 1,  01 HDMI 1.4b. \n\nCámara: Cámara FHD 720p con un obturador de privacidad para mayor seguridad con micrófono incorporado.\n\nConectividad: Wi-Fi 6 (802.11ax) y Bluetooth® 5.1.\n\nSistema Operativo: Sin sistema operativo preinstalado (FreeDOS), lo que te permite elegir el que prefieras.\n\nDiseño: Un diseño delgado y minimalista. Con un chasis de plástico de color gris escarcha, tiene una apariencia moderna y funcional.\n\nPeso: Con un peso de 1.55 kg. Lo que lo hace ligero y facil de transportar.', 'LENOVO', 'laptops', 6, 1300.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/67678577/thumb/1079/1079?1758213467', '2025-11-19 15:51:58', '2025-11-19 15:51:58', 'activo'),
('P069', 'LAPTOP ASUS VIVOBOOK 16 / CORE i5-13420H / 16GB DDR4 / 512 GB', 'Pantalla: 16\" WUXGA  (1920 x 1200) antirreflejo.\nProcesador: Intel® Core™ i5-13420H de 13.ª generación.\nMemoria RAM: 16 GB de RAM DDR4.\nAlmacenamiento: SSD PCIe 4.0® NVMe™de 512 GB. \nGráficos: Gráficos integrados Intel® UHD Graphics.\nPuertos: 01 USB-C, 02 USB 3.2 Gen 1, 01 USB 2.0, 01 HDMI 1.4b \nCámara: Cámara HD 720p on un obturador de privacidad para mayor seguridad.\nConectividad: Wi-Fi 6 (802.11ax) y Bluetooth® 5.3.\nSistema Operativo: Sin sistema operativo preinstalado (FreeDOS), lo que te permite elegir el que prefieras.\nDiseño: Un diseño elegante y moderno, ligero y minimalista. A pesar de su pantalla grande de 16 pulgadas, es compacta gracias a sus delgados biseles, lo que facilita su portabilidad.\nPeso: Con un peso de 1.88 kg. Lo que lo hace facil de transportar.', 'ASUS', 'laptops', 10, 2040.00, 'https://via.placeholder.com/150', '2025-11-19 16:19:13', '2025-11-19 16:19:25', 'inactivo'),
('P070', 'LAPTOP ASUS VIVOBOOK 16 / CORE i5-13420H / 16GB DDR4 / 512 GB', 'Pantalla: 16\" WUXGA  (1920 x 1200) antirreflejo.\n\nProcesador: Intel® Core™ i5-13420H de 13.ª generación.\n\nMemoria RAM: 16 GB de RAM DDR4.\n\nAlmacenamiento: SSD PCIe 4.0® NVMe™de 512 GB. \n\nGráficos: Gráficos integrados Intel® UHD Graphics.\n\nPuertos: 01 USB-C, 02 USB 3.2 Gen 1, 01 USB 2.0, 01 HDMI 1.4b \n\nCámara: Cámara HD 720p on un obturador de privacidad para mayor seguridad.\n\nConectividad: Wi-Fi 6 (802.11ax) y Bluetooth® 5.3.\n\nSistema Operativo: Sin sistema operativo preinstalado (FreeDOS), lo que te permite elegir el que prefieras.\n\nDiseño: Un diseño elegante y moderno, ligero y minimalista. A pesar de su pantalla grande de 16 pulgadas, es compacta gracias a sus delgados biseles, lo que facilita su portabilidad.\n\nPeso: Con un peso de 1.88 kg. Lo que lo hace facil de transportar.', 'ASUS', 'laptops', 10, 2040.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/67677797/thumb/1079/1079?1758210137', '2025-11-19 16:20:53', '2025-11-19 16:20:53', 'activo'),
('P071', 'MONITOR GAMER MSI G244F E2, 23.8\", IPS, 180HZ, FHD', 'Tamaño de pantalla: 23.8 pulgadas\n\nResolución: Full HD (1920 x 1080) \n\nFormato de panel: Plano \n\nRelación de aspecto: 16:9\n\nTipo de panel: Rapid IPS – Colores precisos y ángulos de visión de 178°\n\nFrecuencia de actualización: 180 Hz – Imágenes más fluidas\nTiempo de respuesta: 1 ms (GTG) – Ideal para videojuegos y video en tiempo real\n\nBrillo: 300 cd/m²\n\nContraste estático: 1000:1\n\nGama de colores: sRGB 118%, Adobe RGB 91%\n\nTecnologías: Adaptive Sync, Flicker-Free, Low Blue Light\n\nConectividad: 2x HDMI 2.0b, 1x DisplayPort 1.2a, salida para auriculares\n\nMontaje VESA: Sí, 75 x 75 mm\n\nDiseño: Sin bordes (frameless), ideal para configuraciones múltiples', 'MSI', 'Monitor', 5, 570.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/63546968/thumb/1079/1079?1747503005', '2025-11-19 17:30:30', '2025-11-19 17:30:30', 'activo'),
('P072', 'MONITOR GAMER TEROS TE-2752G – 27\", IPS, 165HZ, FHD', 'Tamaño de pantalla: 27 pulgadas\n\nResolución: Full HD (1920 x 1080) \n\nFormato de panel: Plano \n\nRelación de aspecto: 16:9\n\nColor: Negro\n\nTipo de panel: IPS – Colores precisos y amplios ángulos de visión\n\nFrecuencia de actualización: 165 Hz – Imágenes ultra fluidas\n\nTiempo de respuesta: 1 ms – Ideal para videojuegos y video en tiempo real\n\nBrillo: 300 cd/m²\n\nContraste estático: 1,000:1\n\nÁngulos de visión: 178° (horizontal) / 178° (vertical)\n\nTecnologías: HDR10, AMD FreeSync, Flicker-Free, Low Blue Light\n\nConectividad: 2x HDMI, 1x DisplayPort, salida para auriculares\n\nMontaje VESA: Sí, 100 x 100 mm\n\nAjustes ergonómicos: Inclinación: -5° a +15°, Pivot: ±90°\n\nConsumo de energía: Operando ≤ 36W; Reposo ≤ 1W\n\nVoltaje de alimentación: 100 - 240 VAC', 'TEROS', 'Monitor', 9, 610.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/63547681/thumb/1079/1079?1747503776', '2025-11-19 17:32:41', '2025-11-19 19:41:10', 'activo'),
('P073', 'ALARMA COMPLETA (SOPORTA: CAMÁRAS SEG, PERIFONEO, SENSORES Y CHAPA ELÉCTRICA)', 'Kit de Alarma Residencial/Negocio Completo HSX Smart – Hagroy\nCaracterísticas técnicas:\n\nPanel de control: Hagroy Smart HSX\nZonas: 8 cableadas / 24 inalámbricas\nSalidas programables (PGM): 2 alámbricas\nUsuarios personalizados: Hasta 16\nControles inalámbricos: Hasta 32 (2 por usuario)\nSalidas domóticas: 3 cableadas y 13 inalámbricas\nConectividad: Ethernet TCP/IP, GSM/GPRS/SMS\nFrecuencia RF: 433 MHz\nSensibilidad del receptor: -118 dBm\nVelocidad de datos: 4.6 Kbps\nAntena RF: 17.5 cm\nAlcance: Hasta 100 metros en línea de vista\nProcesador: ARM Cortex M4 con acelerador adaptivo en tiempo real (ART)\nEficiencia de CPU: 25 DMIPS/MHz / 3.42 CoreMark/MHz\nRango de temperatura de trabajo: -40°C a 125°C\nConfiguración: Vía entorno web, software configurador, teclado frontal y comandos SMS\nPuerto de red: Para conexión a PC, configuración y actualización de firmware\nControl mediante aplicación: iHagroy (1 usuario master y hasta 15 usuarios adicionales)\nMonitoreo: Desde plataforma web\nNotificaciones: Alertas, alarmas, supervisiones y eventos al aplicativo y plataforma web\nIdentificación y programación: Por tipo de zonas (instantáneo)\nComponentes incluidos en el kit:\n1 Panel Smart Hagroy HSX\n1 Sensor infrarrojo COMET PIR (cableado)\n1 Contacto magnético de sobreponer (cableado)\n1 Sirena cableada de 30W\n1 Batería de respaldo de 12V/4A\nFunciones adicionales:\nAlerta de intrusión\nVideoverificación\nControl y automatización de puertas y dispositivos electrónicos\nAutomonitoreo y perifoneo desde smartphone (hasta 100W)\nTeclado frontal multipropósito\nPuerto para teclado externo (próximamente)\nNotificaciones de alertas, alarmas, supervisiones y eventos al aplicativo y plataforma web\nIdentificación, etiquetado y programación por tipo de zonas (instantáneo)\nAplicaciones recomendadas:\nSeguridad residencial y empresarial\nMonitoreo y control de accesos\nIntegración con sistemas de automatización del hogar', 'HAGROY', 'Alarmas', 10, 1650.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/63646469/thumb/1079/1079?1747846602', '2025-11-19 19:17:04', '2025-11-19 19:17:04', 'activo'),
('P074', 'EPSON ECOTANK M1120', 'Características principales:\n\nFunciones: Impresión monocromática\nTecnología de impresión: Inyección de tinta MicroPiezo® Heat-Free\nResolución máxima de impresión: Hasta 1440 x 720 dpi\nVelocidad de impresión (ISO): Hasta 15 ppm en negro\nVelocidad de impresión (modo borrador): Hasta 32 ppm en negro\nConectividad: USB 2.0 Hi-Speed, Wi-Fi (802.11 b/g/h), Wi-Fi Direct®\nCompatibilidad móvil: Epson iPrint™, Apple AirPrint™, Google Cloud Print™, Mopria Print Service\nPantalla: Indicadores LED\nBandeja de entrada: Hasta 150 hojas\nImpresión a doble cara: Manual\nTinta incluida: Botellas de tinta negra Epson T534 (2 unidades)\nRendimiento de tinta (aproximado): Hasta 6,000 páginas en negro con botellas de reemplazo\nDimensiones: 375 x 267 x 161 mm\nPeso: Aproximadamente 3.5 kg\nPresentación: Caja\nFunciones adicionales:\n\nSistema EcoTank con tanques de tinta recargables de alta capacidad\nTecnología Heat-Free para una impresión eficiente y de alta calidad\nConectividad inalámbrica para impresión desde dispositivos móviles\nDiseño compacto y elegante, ideal para espacios reducidos\nAplicaciones recomendadas:\n\nOficinas y hogares que requieren impresión frecuente y económica\nUsuarios que buscan una solución de impresión monocromática de alta calidad\nEntornos que necesitan conectividad inalámbrica y soporte para impresión móvil', 'EPSON', 'Impresoras', 10, 700.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/63834773/thumb/1079/1079?1748367805', '2025-11-19 19:20:28', '2025-11-19 19:20:28', 'activo'),
('P075', 'EPSON ECOTANK L1250 SOLO IMPRIME', 'Características principales:\n\nFunciones: Impresión monocromática\nTecnología de impresión: Inyección de tinta Heat-Free MicroPiezo de 4 colores (CMYK)\nResolución máxima de impresión: Hasta 5760 x 1440 dpi\nVelocidad de impresión (ISO): Hasta 10 ppm en negro\nVelocidad de impresión (modo borrador): Hasta 33 ppm en negro\nConectividad: USB 2.0 Hi-Speed, Wi-Fi (802.11 b/g/n), Wi-Fi Direct\nCompatibilidad móvil: Aplicación Epson Smart Panel, Apple AirPrint, Mopria Print Service\nPantalla: Indicadores LED\nBandeja de entrada: Hasta 100 hojas\nImpresión a doble cara: Manual\nTinta incluida: Botellas de tinta negra, cian, magenta y amarilla\nRendimiento de tinta (aproximado): Negro: hasta 4,500 páginas / Color: hasta 7,500 páginas\nDimensiones: 375 x 347 x 179 mm\nPeso: Aproximadamente 3.9 kg\nPresentación: Caja\nFunciones adicionales:\n\nSistema EcoTank con tanques frontales para fácil monitoreo y recarga sin derrames\nTecnología de impresión sin calor para mayor eficiencia energética\nCompatibilidad con impresión desde dispositivos móviles y servicios en la nube\nDiseño compacto y elegante, ideal para espacios reducidos\nAplicaciones recomendadas:\n\nHogares y pequeñas oficinas que requieren impresión frecuente y económica\nUsuarios que buscan una solución de impresión monocromática de alta calidad\nEntornos que necesitan conectividad inalámbrica y soporte para impresión móvil', 'EPSON', 'Impresoras', 9, 590.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/63834875/thumb/1079/1079?1748367940', '2025-11-19 19:21:43', '2025-11-19 19:39:06', 'activo'),
('P076', 'Impresora AiO de tinta HP DeskJet Ink Advantage 2874 (Imprime/Escanea/Copia/Wi-Fi/USB 2.0)', 'Funciones: Impresión, copia y escaneo\nTecnología de impresión: Inyección térmica de tinta HP\nResolución máxima de impresión (Negro): Hasta 1200 x 1200 ppp de reproducción\nResolución máxima de impresión (Color): Resolución optimizada de hasta 4800 x 1200 dpi\nVelocidad de impresión (ISO): Hasta 7.5 ppm en negro / hasta 5.5 ppm a color\nVelocidad de impresión (modo borrador): Hasta 20 ppm en negro / hasta 16 ppm a color\nConectividad: 1 USB 2.0 de alta velocidad, Wi-Fi (802.11b/g/n, banda única)\nCompatibilidad móvil: Aplicación HP Smart, Apple AirPrint, Chrome OS\nPantalla: iCON Display (Sin pantalla táctil, con indicadores)\nBandeja de entrada: Hasta 60 hojas\nImpresión a doble cara: Manual (compatible con controlador)\nTinta incluida: Cartuchos de instalación HP 667 (Negro y Tricolor)\nRendimiento de cartuchos (Versión XL): Negro: hasta 480 páginas / Color: hasta 150-200 páginas (varía según el cartucho inicial o XL)\nDimensiones (mínimas): 42.5 x 30.4 x 15.4 cm\nPeso: Aproximadamente 3.42 kg\nPresentación: Caja\nFunciones adicionales:\nUtiliza cartuchos de tinta HP Ink Advantage, que ofrecen un costo por página más bajo que los cartuchos estándar.\nDiseño compacto y simple, ideal para escritorios con espacio limitado.\nFácil configuración Wi-Fi a través de la aplicación HP Smart.\nFabricada con un 60% de plástico reciclado posconsumo.\nAplicaciones recomendadas:\nHogares y estudiantes con bajos volúmenes de impresión (50 a 100 páginas mensuales recomendadas).\nUsuarios que necesitan una solución \"Todo en Uno\" sencilla con conexión inalámbrica.\nAmbientes que buscan el ahorro ofrecido por la línea Ink Advantage.', 'HP', 'laptops', 2, 370.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/68571957/thumb/1079/1079?1760225417', '2025-11-19 19:22:45', '2025-11-19 19:22:45', 'activo'),
('P077', 'EPSON ECOTANK L5590 Multif', 'Características principales:\n\nMultifunción 4 en 1: Imprime, Escanea, Copia y Envía/Recibe Fax.\nSistema EcoTank: Utiliza tanques de tinta recargables de gran capacidad en lugar de cartuchos, lo que se traduce en un costo por página extremadamente bajo.\nADF (Alimentador Automático de Documentos): Incluye un ADF con capacidad para hasta 30 hojas (A4/Carta) o 10 hojas (Oficio) para facilitar la copia, escaneo y envío de fax de múltiples páginas.\nTecnología de Impresión: Inyección de tinta Heat-Free® PrecisionCore de 4 colores (CMYK).\nResolución Máxima de Impresión: Hasta 4.800 dpi×1.200 dpi optimizada.\nVelocidad de Impresión ISO:\nNegro: 15 ppm (páginas por minuto)\nColor: 8 ppm\nVelocidad de Impresión Máxima (Borrador):\nNegro: 33 ppm\nColor: 20 ppm\nTipo de Escáner: Cama plana con sensor de líneas CIS de color.\nResolución Máxima de Escaneo (Óptica): 1.200 dpi×2.400 dpi.\nVelocidad de Copiado ISO:\nNegro: 10,8 cpm (copias por minuto)\nColor: 5,5 cpm\nTamaño Máximo de Copiado: Oficio (a través del ADF).\nConectividad Estándar:\nUSB de alta velocidad (compatible con USB 2.0).\nWi-Fi 4® (IEEE 802.11 b/g/n).\nWi-Fi Direct® (para impresión sin red).\nEthernet 10/100 (LAN cableada).\nImpresión Inalámbrica desde Dispositivos Inteligentes:\nEpson Smart Panel™ App (iOS, Android).\nEpson Email Print®, Remote Print Driver.\nApple AirPrint®, Chromebook Native Print, Mopria Print Service™.\nPantalla: LCD a color de 1,44 pulgadas.\nCapacidad de Carga: Alimentación trasera de hasta 100 hojas (A4/Carta/Oficio).\nTamaño Máximo de Impresión: 215,9 mm×1.200 mm (definido por el usuario).\nImpresión Sin Bordes: Sí, hasta 10×15 cm.', 'EPSON', 'Impresoras', 5, 1030.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/63833217/thumb/1079/1079?1748366404', '2025-11-19 19:23:44', '2025-11-19 19:23:44', 'activo'),
('P078', 'HP SMART TANK 720', '\nFunciones: Impresión, escaneo y copia (Inalámbrica)\nTecnología de impresión: Inyección térmica de tinta HP\nResolución máxima de impresión (Negro): Hasta 1200 x 1200 ppp de reproducción\nResolución máxima de impresión (Color): Hasta 4800 x 1200 dpi optimizados\nVelocidad de impresión (ISO): Hasta 15 ppm en negro / hasta 9 ppm a color\nVelocidad de impresión (modo borrador): Hasta 23 ppm en negro / hasta 22 ppm a color\nConectividad: 2 Hi-Speed USB 2.0, Wi-Fi (Doble Banda), Wi-Fi Direct, Bluetooth LE\nCompatibilidad móvil: Aplicación HP Smart, Apple AirPrint, Mopria\nPantalla: iCON Display (Botones inteligentes retroiluminados y sensores de tinta/papel)\nBandeja de entrada: Hasta 250 hojas (Alta capacidad)\nImpresión a doble cara: Automática (Dúplex)\nTinta incluida: Botellas de tinta negra (GT53), cian, magenta y amarilla (GT52)\nRendimiento de tinta (aproximado): Negro: hasta 12,000 páginas / Color: hasta 8,000 páginas\nDimensiones (mínimas): 42.75 x 36.40 x 19.86 cm\nPeso: Aproximadamente 6.38 kg\nPresentación: Caja\nFunciones adicionales:\nDiseño con tanques de tinta transparentes y cerrados para rellenado limpio y fácil.\nImpresión dúplex automática para ahorrar tiempo y papel en documentos de doble cara.\nConectividad Wi-Fi de doble banda (2.4/5G) para una conexión más rápida y confiable.\nIdeal para el hogar y oficinas pequeñas que necesitan impresión fotográfica sin bordes.\nAplicaciones recomendadas:\nOficinas en casa y pequeños negocios que requieren alto rendimiento y bajo costo operativo.\nUsuarios que imprimen frecuentemente y necesitan dúplex automático y gran capacidad de papel (250 hojas).\nEntornos que valoran la velocidad (15 ppm) y la conectividad inalámbrica robusta para imprimir y escanear desde dispositivos móviles.', 'HP', 'Impresoras', 6, 770.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/68574382/thumb/1079/1079?1760233760', '2025-11-19 19:25:28', '2025-11-19 19:25:28', 'activo'),
('P079', 'TARJETA DE VIDEO GIGABYTE / NVIDIA GEOFORCE GT 1030 / 2GB DDR4 / 64 BITS', 'Núcleos CUDA: 384 unidades. \nMemoria: 2GB DDR4.\nBus de Memoria: 64 bits.\nVelocidad de Reloj : 1177 MHz.\nVelocidad de Memoria: 2100 MHz\nInterfaz: PCI Express 3.0 x16 slot.\nSalidas de video: 1 x HDMI. 1 x DVI-I (Dual-link).\nSoporte Máximo: 2 Monitores.\nDimensiones: 149.9 x 68.9 x 14.7 mm.\nAPI: OpenGL 4.5 DirectX 12.\nConsumo: 20 Watt\nFUENTE RECOMENDADA: 300 Watt\nResolución Máxima: DIGITAL 4096x2160.\nGigabyte NVIDIA GeForce GT 1030 2GB DDR4 es una tarjeta de video económica y de bajo perfil, perfecta para tareas multimedia, de oficina y actualizaciones básicas de sistemas antiguos. Sin embargo, su rendimiento en juegos se ve limitado por el tipo de memoria DDR4, siendo notablemente inferior a las versiones con GDDR5.', 'GIGABYTE', 'Componentes', 2, 370.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/65507537/thumb/1079/1079?1752971638', '2025-11-19 19:27:18', '2025-11-19 19:27:18', 'activo'),
('P080', 'TARJETA DE VIDEO MSI / NVIDIA GEOFORCE GT 710 2GD3 LP / 2GB DDR3 / 64 BITS', 'Núcleos CUDA: 192 unidades. \nVelocidad de Reloj (Boost): 954 MHz (efectivos).\nMemoria: 2GB DDR3.\nBus de Memoria: 64 bits.\nAncho de Banda de Memoria: 12.8 GB/s.\nInterfaz: PCI Express x16, modo PCIe 2.0 x8.\nSalidas de video: 1 x HDMI. 1 x DVI-D, 1 x VGA.\nSoporte Máximo: 2 Monitores.\nResolución Máxima: DIGITAL 4096x2160.\nAPI: OpenGL 4.5 DirectX 12.\nConsumo: 19 Watt\nFUENTE RECOMENDADA: 300 Watt\nNUMERO DE FANS: 1', 'MSI', 'Componentes', 5, 225.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/65497980/thumb/1079/1079?1752889227', '2025-11-19 19:32:23', '2025-11-19 19:32:23', 'activo'),
('P081', 'TARJETA DE VIDEO ASUS AMD DUAL RX 7600 / 8GB GDDR6 / 128 BITS', 'Núcleos CUDA: 2048 unidades. \nVelocidad de Reloj (Boost): 2695  MHz ( overclock de fábrica).\nReloj de Juego (Game Clock): 2280  MHz.\nVelocidad de Memoria: 18 Gbps.\nMemoria: 8GB GDDR6.\nBus de Memoria: 128 bits.\nInterfaz: PCI Express x16 slot, PCIe 4.0.\nSalidas de video:  3 x DisplayPort 2.1, (1 x HDMI).\nSoporte Máximo: 4 Monitores.\nResolución Máxima: DIGITAL 7680 x 4320.\nAPI: OpenGL 4.6\nConsumo: 165 Watt\nFUENTE RECOMENDADA: 550 Watt\nLa ASUS DUAL-RX7600-O8G-EVO ofrece características de construcción y software propias de ASUS que pueden ser un valor añadido para algunos usuarios, como la tecnología 0dB y la fabricación Auto-Extreme.', 'ASUS', 'laptops', 8, 1235.00, 'https://cdnx.jumpseller.com/infocom-tecnology1/image/69525929/thumb/1079/1079?1762797101', '2025-11-19 19:33:38', '2025-11-19 22:11:53', 'activo'),
('P082', 'DISCO DURO SOLIDO DE 480 GB SATA KINGSTON A400', 'Capacidad: 480 GB\nInterfaz: SATA III 6 Gb/s (compatible con SATA II)\nFactor de forma: 2.5″, grosor 7 mm\nTipo de memoria: 3D NAND (TLC)\n\nRendimiento\n\nLectura: hasta 500 MB/s\nEscritura: hasta 450 MB/s\n\nConsumo de energía\n\nReposo: 0.195 W\n\nPromedio: 0.279 W\n\nMáximo lectura: 0.642 W\n\nMáximo escritura: 1.535 W\n\nTemperaturas\n\nOperación: 0 °C a 70 °C\n\nAlmacenamiento: –40 °C a 85 °C\n\nDurabilidad\n\nMTBF: 1,000,000 horas\n\nResistencia de escritura (TBW): 160 TBW\n\nGarantía: 3 años\n\nOtras características\n\nResistente a golpes y vibraciones\n\nArranca y carga programas mucho más rápido que un HDD\n\nDiseño delgado compatible con la mayoría de laptops y PCs', 'KINGSTON', 'Componentes', 5, 195.00, 'https://media.falabella.com/falabellaPE/132238379_01/w=800,h=800,fit=pad', '2025-11-19 19:59:45', '2025-12-12 15:56:41', 'activo'),
('P083', 'Disco Duro Sólido 1 TB Sandisk PLUS', 'Capacidad: 1 TB\nInterfaz: SATA III 6 Gb/s\nFormato: 2.5″, 7 mm de grosor\nMemoria: 3D NAND\nTipo de controlador: sin DRAM (usa caché SLC)\n\nRendimiento\n\nLectura secuencial: hasta 535–545 MB/s\nEscritura secuencial: hasta 450–515 MB/s\n\nResistencia y fiabilidad\n\nMTTF aproximado: 2 millones de horas\nResistencia a choques: hasta 1,500 G\nVibración operativa: 5.0 gRMS\n\nTemperatura\n\nOperación: 0 °C a 70 °C\n\nOtros detalles\n\nPeso aproximado: 32.7 g\nDimensiones: 100.5 × 69.85 × 7 mm\nMás rápido y silencioso que un disco duro mecánico\nOptimizado para tareas de uso general (ofimática, navegación, multimedia y arranque rápido)', 'SANDIK', 'Componentes', 11, 299.00, 'https://media.falabella.com/falabellaPE/146063951_01/w=800,h=800,fit=pad', '2025-11-19 20:02:53', '2025-11-19 21:31:57', 'inactivo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicios_tecnicos`
--

CREATE TABLE `servicios_tecnicos` (
  `id` int(11) NOT NULL,
  `cliente_tipo_doc` varchar(10) NOT NULL,
  `cliente_num_doc` varchar(20) NOT NULL,
  `cliente_nombre` varchar(255) NOT NULL,
  `cliente_telefono` varchar(20) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `equipo_tipo` varchar(100) NOT NULL,
  `equipo_nombre` varchar(255) NOT NULL,
  `equipo_problema` text NOT NULL,
  `costo_servicio` decimal(10,2) NOT NULL DEFAULT 0.00,
  `subtotal_productos` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tipo_comprobante` enum('ninguno','boleta','factura') DEFAULT 'ninguno',
  `estado` varchar(50) DEFAULT 'pendiente',
  `fecha_ingreso` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `servicios_tecnicos`
--

INSERT INTO `servicios_tecnicos` (`id`, `cliente_tipo_doc`, `cliente_num_doc`, `cliente_nombre`, `cliente_telefono`, `usuario_id`, `equipo_tipo`, `equipo_nombre`, `equipo_problema`, `costo_servicio`, `subtotal_productos`, `total`, `tipo_comprobante`, `estado`, `fecha_ingreso`, `fecha_actualizacion`) VALUES
(1, 'DNI', '74923923', 'Samira Montesinos', '982117555', 1, 'Impresora', 'Epson l4260', 'Atasco de papel', 40.00, 0.00, 40.00, 'boleta', 'entregado', '2025-11-19 06:16:41', '2025-11-19 20:06:07'),
(2, 'DNI', '40299875', 'Rosa Carrillo Sanchez', '921778266', 1, 'Laptop', 'Laptop Lenovo Core 5', 'Cambio de pantalla', 100.00, 0.00, 100.00, 'boleta', 'entregado', '2025-11-19 06:20:38', '2025-11-19 20:06:00'),
(3, 'DNI', '40299875', 'Rosa Carrillo Sanchez', '921778266', 1, 'Laptop', 'Laptop lenovo core 3 - Negro', 'Mantenimiento y formateo', 100.00, 0.00, 118.00, 'factura', 'entregado', '2025-11-19 19:51:17', '2025-11-19 20:05:53'),
(4, 'DNI', '04645241', 'John Montesinos Zea', '974769077', 1, 'PC Escritorio', 'PC core 7 ', 'Mantenimiento general\nImplementacion de tarjeta de video', 60.00, 1235.00, 1295.00, 'boleta', 'pendiente', '2025-11-19 19:54:59', '2025-11-19 21:40:26'),
(5, 'DNI', '71704053', 'sami', '997479444', 1, 'Laptop', 'lenovo', 'no ingresa windows', 50.00, 0.00, 50.00, 'boleta', 'pendiente', '2025-12-09 18:30:28', '2025-12-09 18:30:28');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicio_productos`
--

CREATE TABLE `servicio_productos` (
  `id` int(11) NOT NULL,
  `servicio_id` int(11) NOT NULL,
  `producto_id` varchar(10) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `servicio_productos`
--

INSERT INTO `servicio_productos` (`id`, `servicio_id`, `producto_id`, `cantidad`, `precio_unitario`, `subtotal`) VALUES
(3, 4, 'P081', 1, 1235.00, 1235.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipos_servicios`
--

CREATE TABLE `tipos_servicios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio_base` decimal(10,2) NOT NULL,
  `tiempo_estimado` int(11) DEFAULT NULL,
  `categoria` varchar(50) DEFAULT NULL,
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre_completo` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol_solicitado` enum('admin','support','sales') NOT NULL,
  `rol_asignado` enum('admin','soporte','ventas') DEFAULT NULL,
  `estado` enum('pendiente','aprobado','rechazado') DEFAULT 'pendiente',
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `ultimo_acceso` timestamp NULL DEFAULT NULL,
  `acepto_terminos` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre_completo`, `email`, `username`, `password`, `rol_solicitado`, `rol_asignado`, `estado`, `fecha_registro`, `ultimo_acceso`, `acepto_terminos`) VALUES
(1, 'Edson Franco Tarapa', 'admin@infocom.com', 'Edson', 'admin123', 'admin', 'admin', 'aprobado', '2025-11-19 05:04:30', '2025-12-17 02:42:49', 1),
(3, 'Diego Lopez Pilco', 'idecrack123@gmail.com', 'Diego', 'diego123', '', 'soporte', 'aprobado', '2025-11-19 16:54:04', '2025-11-19 19:52:06', 1),
(5, 'Samira Montesinos Carrillo', 'carrillosami04@gmail.com', 'sami', 'sami123', '', 'ventas', 'aprobado', '2025-11-19 22:10:05', NULL, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas`
--

CREATE TABLE `ventas` (
  `id` int(11) NOT NULL,
  `cliente_id` int(11) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `tipo_comprobante` enum('BOLETA','FACTURA') DEFAULT 'BOLETA',
  `numero_comprobante` varchar(20) DEFAULT NULL,
  `subtotal` decimal(10,2) DEFAULT 0.00,
  `igv` decimal(10,2) DEFAULT 0.00,
  `total` decimal(10,2) DEFAULT 0.00,
  `fecha_venta` timestamp NOT NULL DEFAULT current_timestamp(),
  `estado` enum('PENDIENTE','COMPLETADA','ANULADA') DEFAULT 'COMPLETADA'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ventas`
--

INSERT INTO `ventas` (`id`, `cliente_id`, `usuario_id`, `tipo_comprobante`, `numero_comprobante`, `subtotal`, `igv`, `total`, `fecha_venta`, `estado`) VALUES
(1, 1, 1, 'BOLETA', 'B2025-00000001', 1235.00, 0.00, 1235.00, '2025-11-19 19:37:39', 'COMPLETADA'),
(2, 2, 1, 'BOLETA', 'B2025-00000002', 590.00, 0.00, 590.00, '2025-11-19 19:39:06', 'COMPLETADA'),
(3, 3, 1, 'FACTURA', 'F2025-00000001', 610.00, 109.80, 719.80, '2025-11-19 19:41:10', 'COMPLETADA'),
(4, 4, 1, 'FACTURA', 'F2025-00000002', 365.00, 65.70, 430.70, '2025-11-19 19:42:07', 'COMPLETADA'),
(5, 5, 1, 'FACTURA', 'F2025-00000003', 155.00, 27.90, 182.90, '2025-11-19 19:43:37', 'COMPLETADA'),
(6, 6, 1, 'BOLETA', 'B2025-00000003', 60.00, 0.00, 60.00, '2025-11-19 19:45:04', 'COMPLETADA'),
(7, 7, 1, 'FACTURA', 'F2025-00000004', 60.00, 10.80, 70.80, '2025-11-19 19:46:41', 'COMPLETADA'),
(8, 8, 1, 'FACTURA', 'F2025-00000005', 315.00, 56.70, 371.70, '2025-11-19 19:48:34', 'COMPLETADA'),
(9, 9, 1, 'BOLETA', 'B2025-00000004', 195.00, 0.00, 195.00, '2025-12-12 15:31:33', 'COMPLETADA'),
(10, 10, 1, 'BOLETA', 'B2025-00000005', 195.00, 0.00, 195.00, '2025-12-12 15:56:41', 'COMPLETADA');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero_documento` (`numero_documento`);

--
-- Indices de la tabla `cotizaciones`
--
ALTER TABLE `cotizaciones`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `cotizacion_detalles`
--
ALTER TABLE `cotizacion_detalles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cotizacion_id` (`cotizacion_id`),
  ADD KEY `producto_id` (`producto_id`);

--
-- Indices de la tabla `detalle_venta`
--
ALTER TABLE `detalle_venta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `venta_id` (`venta_id`),
  ADD KEY `producto_id` (`producto_id`);

--
-- Indices de la tabla `detalle_venta_servicios`
--
ALTER TABLE `detalle_venta_servicios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `venta_id` (`venta_id`),
  ADD KEY `servicio_id` (`servicio_id`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `servicios_tecnicos`
--
ALTER TABLE `servicios_tecnicos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `servicio_productos`
--
ALTER TABLE `servicio_productos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `servicio_id` (`servicio_id`),
  ADD KEY `producto_id` (`producto_id`);

--
-- Indices de la tabla `tipos_servicios`
--
ALTER TABLE `tipos_servicios`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indices de la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero_comprobante` (`numero_comprobante`),
  ADD KEY `cliente_id` (`cliente_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `cotizacion_detalles`
--
ALTER TABLE `cotizacion_detalles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `detalle_venta`
--
ALTER TABLE `detalle_venta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `detalle_venta_servicios`
--
ALTER TABLE `detalle_venta_servicios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `servicios_tecnicos`
--
ALTER TABLE `servicios_tecnicos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `servicio_productos`
--
ALTER TABLE `servicio_productos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `tipos_servicios`
--
ALTER TABLE `tipos_servicios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `ventas`
--
ALTER TABLE `ventas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `cotizacion_detalles`
--
ALTER TABLE `cotizacion_detalles`
  ADD CONSTRAINT `cotizacion_detalles_ibfk_1` FOREIGN KEY (`cotizacion_id`) REFERENCES `cotizaciones` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cotizacion_detalles_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `detalle_venta`
--
ALTER TABLE `detalle_venta`
  ADD CONSTRAINT `detalle_venta_ibfk_1` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`),
  ADD CONSTRAINT `detalle_venta_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`);

--
-- Filtros para la tabla `detalle_venta_servicios`
--
ALTER TABLE `detalle_venta_servicios`
  ADD CONSTRAINT `detalle_venta_servicios_ibfk_1` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`),
  ADD CONSTRAINT `detalle_venta_servicios_ibfk_2` FOREIGN KEY (`servicio_id`) REFERENCES `tipos_servicios` (`id`);

--
-- Filtros para la tabla `servicio_productos`
--
ALTER TABLE `servicio_productos`
  ADD CONSTRAINT `servicio_productos_ibfk_1` FOREIGN KEY (`servicio_id`) REFERENCES `servicios_tecnicos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `servicio_productos_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD CONSTRAINT `ventas_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
