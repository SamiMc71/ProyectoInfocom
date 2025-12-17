<?php
// HEADERS PRIMERO
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// INCLUIR CONFIGURACIÓN CORRECTA - USA TU RUTA REAL
include_once '../php/config.php';

$response = [];

try {
    // Obtener conexión
    $conn = getDBConnection();
    
    $response['success'] = true;
    $response['message'] = '✅ Conexión a BD exitosa';
    $response['database'] = DB_NAME;
    $response['host'] = DB_HOST;
    
    $conn->close();
    
} catch (Exception $e) {
    $response['success'] = false;
    $response['error'] = $e->getMessage();
}

echo json_encode($response);
exit;
?>