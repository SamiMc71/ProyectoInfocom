<?php
// api/servicios_tecnicos_detalle.php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../php/config.php';

$db = getDBConnection();

if ($db === null) {
    http_response_code(500);
    echo json_encode(["error" => "Error fatal: No se pudo conectar a la base de datos."]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    getServicioDetalle($db);
} else {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
}

function getServicioDetalle($db) {
    $servicio_id = $_GET['id'] ?? '';
    
    if (empty($servicio_id)) {
        http_response_code(400);
        echo json_encode(["error" => "ID de servicio requerido"]);
        return;
    }
    
    // --- INICIO DE MODIFICACIÓN (Añadir JOIN para obtener nombre) ---
    $query_servicio = "SELECT s.*, u.nombre_completo as vendedor_nombre 
                       FROM servicios_tecnicos s
                       LEFT JOIN usuarios u ON s.usuario_id = u.id
                       WHERE s.id = ?";
    // --- FIN DE MODIFICACIÓN ---
    
    $stmt_servicio = $db->prepare($query_servicio);
    
    if (!$stmt_servicio) {
        throw new Exception("Error en la preparación: " . $db->error);
    }
    
    $stmt_servicio->bind_param("i", $servicio_id);
    $stmt_servicio->execute();
    $result_servicio = $stmt_servicio->get_result();
    $servicio = $result_servicio->fetch_assoc();
    
    if (!$servicio) {
        http_response_code(404);
        echo json_encode(["error" => "Servicio no encontrado"]);
        return;
    }
    
    $query_productos = "SELECT 
                        sp.id,
                        sp.producto_id,
                        p.nombre as producto_nombre,
                        p.marca as producto_marca,
                        sp.cantidad,
                        sp.precio_unitario,
                        sp.subtotal
                       FROM servicio_productos sp
                       LEFT JOIN productos p ON sp.producto_id = p.id
                       WHERE sp.servicio_id = ?";
    
    $stmt_productos = $db->prepare($query_productos);
    
    if (!$stmt_productos) {
        throw new Exception("Error en la preparación de productos: " . $db->error);
    }
    
    $stmt_productos->bind_param("i", $servicio_id);
    $stmt_productos->execute();
    $result_productos = $stmt_productos->get_result();
    
    $productos = [];
    while($row = $result_productos->fetch_assoc()) {
        $row['cantidad'] = (int)$row['cantidad'];
        $row['precio_unitario'] = (float)$row['precio_unitario'];
        $row['subtotal'] = (float)$row['subtotal'];
        $productos[] = $row;
    }
    
    $servicio['productos'] = $productos;
    
    $servicio['costo_servicio'] = (float)$servicio['costo_servicio'];
    $servicio['subtotal_productos'] = (float)$servicio['subtotal_productos'];
    $servicio['total'] = (float)$servicio['total'];
    
    echo json_encode($servicio, JSON_UNESCAPED_UNICODE);
    
    $stmt_servicio->close();
    if (isset($stmt_productos)) $stmt_productos->close();
}
?>