<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../php/config.php';

$conn = getDBConnection();

if ($conn === null) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Error fatal: No se pudo conectar a la base de datos."]);
    exit();
}

try {
    // --- INICIO DE MODIFICACIÓN: Capturar parámetro user_id y construir WHERE ---
    $usuario_id = $_GET['usuario_id'] ?? null;
    $where_clause = '';
    $bind_types = '';
    $bind_params = [];

    if ($usuario_id !== null && $usuario_id !== 'all') {
        // Aseguramos que el usuario_id es un entero para la consulta
        $usuario_id_int = (int)$usuario_id;
        $where_clause = "WHERE v.usuario_id = ?";
        $bind_types = 'i';
        $bind_params[] = &$usuario_id_int;
    }
    // --- FIN DE MODIFICACIÓN ---

    $sql = "
        SELECT 
            v.id,
            v.tipo_comprobante,
            v.numero_comprobante,
            v.subtotal,
            v.igv,
            v.total,
            v.fecha_venta,
            v.estado,
            c.tipo_documento as cliente_tipo_documento,
            c.numero_documento as cliente_documento,
            CONCAT(c.nombres, ' ', c.apellidos) as cliente_nombres,
            c.telefono as cliente_telefono,
            c.email as cliente_email,
            u.nombre_completo as vendedor_nombre
        FROM ventas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        LEFT JOIN usuarios u ON v.usuario_id = u.id
        $where_clause -- <-- Cláusula WHERE aplicada
        ORDER BY v.fecha_venta DESC
    ";
    
    // Ejecutar consulta principal
    if ($usuario_id !== null && $usuario_id !== 'all') {
        $stmt_main = $conn->prepare($sql);
        // Usamos call_user_func_array para bind_param dinámico
        call_user_func_array([$stmt_main, 'bind_param'], array_merge([$bind_types], $bind_params));
        $stmt_main->execute();
        $result = $stmt_main->get_result();
    } else {
        $result = $conn->query($sql);
    }

    $ventas = [];
    
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $detalles_sql = "
                SELECT 
                    dv.producto_id,
                    p.nombre as producto_nombre,
                    dv.cantidad,
                    dv.precio_unitario,
                    dv.subtotal
                FROM detalle_venta dv
                LEFT JOIN productos p ON dv.producto_id = p.id
                WHERE dv.venta_id = ?
            ";
            
            $stmt = $conn->prepare($detalles_sql);
            $stmt->bind_param("i", $row['id']);
            $stmt->execute();
            $detalles_result = $stmt->get_result();
            
            $detalles = [];
            while($detalle = $detalles_result->fetch_assoc()) {
                $detalles[] = $detalle;
            }
            $stmt->close();
            
            // Convertir valores numéricos a float para consistencia en JSON
            $row['subtotal'] = floatval($row['subtotal']);
            $row['igv'] = floatval($row['igv']);
            $row['total'] = floatval($row['total']);
            
            $row['detalles'] = $detalles;
            $ventas[] = $row;
        }
    }
    
    if (isset($stmt_main)) $stmt_main->close();
    
    $conn->close();
    
    echo json_encode([
        'success' => true,
        'ventas' => $ventas
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener ventas: ' . $e->getMessage()
    ]);
}
?>