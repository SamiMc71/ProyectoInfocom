<?php
// Headers PRIMERO
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// Response array
$response = array();

try {
    // Incluir configuración
    include_once 'config.php';
    
    // Probar conexión
    $conn = getDBConnection();
    
    if ($conn->connect_error) {
        throw new Exception("Error conectando a la BD: " . $conn->connect_error);
    }
    
    $response['success'] = true;
    $response['message'] = '✅ Conexión a BD exitosa';
    $response['database'] = DB_NAME;
    $response['host'] = DB_HOST;
    
    $conn->close();
    
} catch (Exception $e) {
    $response['success'] = false;
    $response['error'] = $e->getMessage();
    $response['database'] = defined('DB_NAME') ? DB_NAME : 'No definida';
}

echo json_encode($response);
exit;
?>