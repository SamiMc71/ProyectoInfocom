<?php
error_reporting(0); // <-- CORRECCIÓN IMPORTANTE
ini_set('display_errors', 0); // <-- CORRECCIÓN IMPORTANTE

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include '../php/config.php'; // Usa tu config estándar

$tipo_documento = $_GET['tipo_documento'] ?? '';
$numero_documento = $_GET['numero_documento'] ?? '';

if (empty($tipo_documento) || empty($numero_documento)) {
    http_response_code(400);
    echo json_encode(['error' => 'Tipo y número de documento requeridos']);
    exit;
}

$conn = getDBConnection();

if ($conn === null) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexión a la base de datos']);
    exit;
}

try {
    // Asumimos que tu tabla clientes tiene 'estado', si no, quita "AND estado = 'activo'"
    $sql = "SELECT id, tipo_documento, numero_documento, nombres, apellidos, telefono, email 
            FROM clientes 
            WHERE tipo_documento = ? AND numero_documento = ?";
            
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $tipo_documento, $numero_documento);
    $stmt->execute();
    $result = $stmt->get_result();
    $cliente = $result->fetch_assoc();
    
    if ($cliente) {
        $cliente['nombre_completo'] = trim($cliente['nombres'] . ' ' . ($cliente['apellidos'] ?? ''));
        echo json_encode($cliente);
    } else {
        echo json_encode(['error' => 'Cliente no encontrado']);
    }
    
    $stmt->close();
    $conn->close();
    
} catch(Exception $e) {
    echo json_encode(['error' => 'Error en la base de datos: ' . $e->getMessage()]);
}
?>