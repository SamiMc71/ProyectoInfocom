<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../php/config.php';

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!isset($data['venta_id'])) {
    echo json_encode(['success' => false, 'error' => 'ID de venta no proporcionado']);
    exit;
}

$conn = getDBConnection();

// --- INICIO DE LA CORRECCIÓN ---
if ($conn === null) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Error fatal: No se pudo conectar a la base de datos."]);
    exit();
}
// --- FIN DE LA CORRECCIÓN ---

try {
    // Aquí deberíamos también devolver el stock de productos, pero
    // por simplicidad solo anulamos la venta.
    
    $sql = "UPDATE ventas SET estado = 'ANULADA' WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $data['venta_id']);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'mensaje' => 'Venta anulada correctamente']);
    } else {
        throw new Exception('Error al actualizar la venta');
    }
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error al anular venta: ' . $e->getMessage()
    ]);
}
?>