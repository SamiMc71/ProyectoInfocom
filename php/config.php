<?php
// --- INICIO DE CORRECCIÓN DE ZONA HORARIA ---
// Forzamos que PHP use la zona horaria de Lima (UTC-5)
// Esto es VITAL para que date('Y-m-d') funcione correctamente.
date_default_timezone_set('America/Lima');
// --- FIN DE CORRECCIÓN ---

// Configuración de la base de datos
define('DB_HOST', 'localhost');
define('DB_USER', 'root'); // Tu usuario de MySQL
define('DB_PASS', ''); // Tu contraseña de MySQL
define('DB_NAME', 'inventario_digital');

// Función para conexión a la base de datos
function getDBConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    // Verificar error de conexión ANTES de continuar
    if ($conn->connect_error) {
        // No usar 'die' en una API, solo registrar el error
        error_log("Error de conexión: " . $conn->connect_error);
        return null; // Devolver null para que el script que llama pueda manejarlo
    }
    
    $conn->set_charset("utf8");
    
    // --- INICIO DE CORRECCIÓN DE ZONA HORARIA (MySQL) ---
    // Le decimos a MySQL que esta conexión también debe usar UTC-5
    // Esto asegura que NOW() y CURRENT_TIMESTAMP usen la hora de Lima
    $conn->query("SET time_zone = '-05:00'");
    // --- FIN DE CORRECCIÓN ---
    
    return $conn;
}

// Iniciar sesión
// Verificamos si la sesión NO está iniciada antes de iniciarla
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
?>