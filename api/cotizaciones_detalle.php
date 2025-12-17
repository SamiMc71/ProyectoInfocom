<?php
// api/cotizaciones_detalle.php
// Suprimimos advertencias para evitar que rompan el JSON
error_reporting(0); 
ini_set('display_errors', 0);

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

// --- INICIO DE LA CORRECCIÓN DE CONEXIÓN ---
if ($db === null) {
    http_response_code(500);
    echo json_encode(["error" => "Error fatal: No se pudo conectar a la base de datos."]);
    exit();
}
// --- FIN DE LA CORRECCIÓN DE CONEXIÓN ---

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    getCotizacionDetalle($db);
} else {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
}

function getCotizacionDetalle($db) {
    $cotizacion_id = $_GET['id'] ?? '';
    
    if (empty($cotizacion_id)) {
        http_response_code(400);
        echo json_encode(["error" => "ID de cotización requerido"]);
        return;
    }
    
    // === CORRECCIÓN APLICADA: Se usa la columna 'fecha' directamente y se elimina subtotal/igv de la query.
    $query_cotizacion = "SELECT 
                            id,
                            cliente_nombre,
                            cliente_tipo_doc,
                            cliente_num_doc,
                            cliente_telefono,
                            fecha,
                            total,
                            estado
                         FROM cotizaciones 
                         WHERE id = ?";
    // === FIN CORRECCIÓN APLICADA ===
    
    $stmt_cotizacion = $db->prepare($query_cotizacion);
    
    if (!$stmt_cotizacion) {
        // En caso de que haya un error de SQL, lo arrojamos para depuración.
        throw new Exception("Error en la preparación: " . $db->error);
    }
    
    $stmt_cotizacion->bind_param("s", $cotizacion_id);
    $stmt_cotizacion->execute();
    $result_cotizacion = $stmt_cotizacion->get_result();
    $cotizacion = $result_cotizacion->fetch_assoc();
    
    if (!$cotizacion) {
        http_response_code(404);
        echo json_encode(["error" => "Cotización no encontrada"]);
        return;
    }
    
    $query_detalles = "SELECT 
                        cd.id,
                        cd.producto_id,
                        p.nombre as producto_nombre,
                        p.marca as producto_marca,
                        p.imagen as producto_imagen, 
                        cd.cantidad,
                        cd.precio_unitario,
                        cd.subtotal
                       FROM cotizacion_detalles cd
                       LEFT JOIN productos p ON cd.producto_id = p.id
                       WHERE cd.cotizacion_id = ?";
    
    $stmt_detalles = $db->prepare($query_detalles);
    
    if (!$stmt_detalles) {
        throw new Exception("Error en la preparación de detalles: " . $db->error);
    }
    
    $stmt_detalles->bind_param("s", $cotizacion_id);
    $stmt_detalles->execute();
    $result_detalles = $stmt_detalles->get_result();
    
    $detalles = [];
    while($row = $result_detalles->fetch_assoc()) {
        $row['cantidad'] = (int)$row['cantidad'];
        $row['precio_unitario'] = (float)$row['precio_unitario'];
        $row['subtotal'] = (float)$row['subtotal'];
        $detalles[] = $row;
    }
    
    $cotizacion['detalles'] = $detalles;
    
    $cotizacion['total'] = (float)$cotizacion['total'];
    // === LÓGICA DE CÁLCULO INYECTADA PARA EVITAR CRASH DEL JS ===
    $cotizacion['subtotal'] = $cotizacion['total'] / 1.18; 
    $cotizacion['igv'] = $cotizacion['total'] - $cotizacion['subtotal'];
    
    echo json_encode($cotizacion, JSON_UNESCAPED_UNICODE);
    
    $stmt_cotizacion->close();
    if (isset($stmt_detalles)) $stmt_detalles->close();
}
?>