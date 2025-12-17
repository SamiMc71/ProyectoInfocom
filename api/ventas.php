<?php
// api/ventas.php
// Incluir la configuración de la base de datos
require_once '../php/config.php'; // Ajusta la ruta según tu estructura

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

// Obtener la acción
$action = $_POST['action'] ?? '';

if ($action === 'obtener_boletas_rango') {
    obtenerBoletasPorRango();
} elseif ($action === 'obtener_boletas_mes') {
    obtenerBoletasPorMes();
} else {
    echo json_encode(['success' => false, 'message' => 'Acción no válida']);
}

// Función base para obtener datos (modificada para combinar)
function obtenerDatos($fecha_inicio, $fecha_fin) {
    $conn = getDBConnection();
    $boletas = [];

    // --- 1. OBTENER VENTAS DE PRODUCTOS (CON VENDEDOR) ---
    $sql_ventas = "
        SELECT 
            v.id,
            v.tipo_comprobante,
            v.numero_comprobante,
            v.subtotal,
            v.igv,
            v.total,
            v.fecha_venta,
            v.estado,
            c.nombres as cliente_nombres,
            c.apellidos as cliente_apellidos,
            c.numero_documento as cliente_documento,
            c.tipo_documento as cliente_tipo_documento,
            c.telefono as cliente_telefono,
            u.nombre_completo as vendedor_nombre  -- <-- Campo añadido
        FROM ventas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        LEFT JOIN usuarios u ON v.usuario_id = u.id   -- <-- JOIN añadido
        WHERE DATE(v.fecha_venta) BETWEEN ? AND ?
        AND v.estado = 'COMPLETADA'
    ";
    
    $stmt_ventas = $conn->prepare($sql_ventas);
    $stmt_ventas->bind_param("ss", $fecha_inicio, $fecha_fin);
    $stmt_ventas->execute();
    $result_ventas = $stmt_ventas->get_result();
    
    while ($venta = $result_ventas->fetch_assoc()) {
        $detalles_sql = "
            SELECT dv.cantidad, dv.precio_unitario, dv.subtotal, p.nombre as producto_nombre
            FROM detalle_venta dv
            LEFT JOIN productos p ON dv.producto_id = p.id
            WHERE dv.venta_id = ?
        ";
        $detalles_stmt = $conn->prepare($detalles_sql);
        $detalles_stmt->bind_param("i", $venta['id']);
        $detalles_stmt->execute();
        $detalles_result = $detalles_stmt->get_result();
        $productos = [];
        while ($detalle = $detalles_result->fetch_assoc()) {
            $productos[] = [
                'nombre' => $detalle['producto_nombre'],
                'cantidad' => $detalle['cantidad'],
                'precio_unitario' => floatval($detalle['precio_unitario']),
                'subtotal' => floatval($detalle['subtotal'])
            ];
        }
        $detalles_stmt->close();
        
        $fecha = new DateTime($venta['fecha_venta']);
        $cliente_nombre = trim($venta['cliente_nombres'] . ' ' . $venta['cliente_apellidos']);
        
        $boletas[] = [
            'tipo_venta' => 'producto', // Flag para JS
            'id' => $venta['id'],
            'numero_comprobante' => $venta['numero_comprobante'],
            'tipo_comprobante' => $venta['tipo_comprobante'],
            'fecha_venta' => $venta['fecha_venta'],
            'fecha_venta_formateada' => $fecha->format('d/m/Y H:i'),
            'estado' => $venta['estado'],
            'subtotal' => floatval($venta['subtotal']),
            'igv' => floatval($venta['igv']),
            'total' => floatval($venta['total']),
            'cliente_nombre' => $cliente_nombre,
            'cliente_documento' => $venta['cliente_documento'],
            'cliente_tipo_documento' => $venta['cliente_tipo_documento'],
            'cliente_telefono' => $venta['cliente_telefono'],
            'productos' => $productos,
            'vendedor_nombre' => $venta['vendedor_nombre'] ?? 'N/A' // <-- Campo añadido
        ];
    }
    $stmt_ventas->close();

    // --- 2. OBTENER VENTAS DE SERVICIOS (CON VENDEDOR) ---
    $sql_servicios = "
        SELECT 
            s.id,
            s.tipo_comprobante,
            s.total,
            s.costo_servicio,
            s.subtotal_productos,
            s.fecha_ingreso as fecha_venta,
            s.estado,
            s.cliente_nombre,
            s.cliente_num_doc as cliente_documento,
            s.cliente_tipo_doc as cliente_tipo_documento,
            s.cliente_telefono,
            s.equipo_tipo,
            s.equipo_nombre,
            s.equipo_problema,
            u.nombre_completo as vendedor_nombre  -- <-- Campo añadido
        FROM servicios_tecnicos s
        LEFT JOIN usuarios u ON s.usuario_id = u.id   -- <-- JOIN añadido
        WHERE DATE(s.fecha_ingreso) BETWEEN ? AND ?
        AND (s.estado = 'entregado' OR s.estado = 'completado')
    ";
    
    $stmt_servicios = $conn->prepare($sql_servicios);
    $stmt_servicios->bind_param("ss", $fecha_inicio, $fecha_fin);
    $stmt_servicios->execute();
    $result_servicios = $stmt_servicios->get_result();
    
    while ($servicio = $result_servicios->fetch_assoc()) {
        $detalles_sql = "
            SELECT sp.cantidad, sp.precio_unitario, sp.subtotal, p.nombre as producto_nombre
            FROM servicio_productos sp
            LEFT JOIN productos p ON sp.producto_id = p.id
            WHERE sp.servicio_id = ?
        ";
        $detalles_stmt = $conn->prepare($detalles_sql);
        $detalles_stmt->bind_param("i", $servicio['id']);
        $detalles_stmt->execute();
        $detalles_result = $detalles_stmt->get_result();
        $productos = [];
        while ($detalle = $detalles_result->fetch_assoc()) {
            $productos[] = [
                'nombre' => $detalle['producto_nombre'],
                'cantidad' => $detalle['cantidad'],
                'precio_unitario' => floatval($detalle['precio_unitario']),
                'subtotal' => floatval($detalle['subtotal'])
            ];
        }
        $detalles_stmt->close();
        
        $fecha = new DateTime($servicio['fecha_venta']);
        
        // Asignar un número de comprobante si no lo tiene, para consistencia
        $numero_comprobante = 'SERV-' . str_pad($servicio['id'], 6, '0', STR_PAD_LEFT);
        
        $boletas[] = [
            'tipo_venta' => 'servicio', // Flag para JS
            'id' => $servicio['id'],
            'numero_comprobante' => $numero_comprobante,
            'tipo_comprobante' => $servicio['tipo_comprobante'],
            'fecha_venta' => $servicio['fecha_venta'],
            'fecha_venta_formateada' => $fecha->format('d/m/Y H:i'),
            'estado' => $servicio['estado'],
            // Calculamos subtotal e igv para servicios (asumiendo que el total lo incluye si es factura)
            'subtotal' => (float)($servicio['tipo_comprobante'] === 'factura' ? $servicio['total'] / 1.18 : $servicio['total']),
            'igv' => (float)($servicio['tipo_comprobante'] === 'factura' ? $servicio['total'] - ($servicio['total'] / 1.18) : 0),
            'total' => floatval($servicio['total']),
            'cliente_nombre' => $servicio['cliente_nombre'],
            'cliente_documento' => $servicio['cliente_documento'],
            'cliente_tipo_documento' => $servicio['cliente_tipo_documento'],
            'cliente_telefono' => $servicio['cliente_telefono'],
            'productos' => $productos,
            // Datos extra de servicio
            'costo_servicio' => floatval($servicio['costo_servicio']),
            'subtotal_productos' => floatval($servicio['subtotal_productos']),
            'equipo_nombre' => $servicio['equipo_tipo'] . ' ' . $servicio['equipo_nombre'],
            'equipo_problema' => $servicio['equipo_problema'],
            'vendedor_nombre' => $servicio['vendedor_nombre'] ?? 'N/A' // <-- Campo añadido
        ];
    }
    $stmt_servicios->close();
    
    // --- 3. ORDENAR TODO POR FECHA ---
    usort($boletas, function($a, $b) {
        return strtotime($b['fecha_venta']) - strtotime($a['fecha_venta']);
    });
    
    $conn->close();
    return $boletas;
}

function obtenerBoletasPorRango() {
    $fecha_inicio = $_POST['fecha_inicio'] ?? '';
    $fecha_fin = $_POST['fecha_fin'] ?? '';
    
    if (empty($fecha_inicio) || empty($fecha_fin)) {
        echo json_encode(['success' => false, 'message' => 'Fechas no válidas']);
        return;
    }
    
    $boletas = obtenerDatos($fecha_inicio, $fecha_fin);
    
    echo json_encode([
        'success' => true,
        'boletas' => $boletas,
        'total' => count($boletas)
    ]);
}

function obtenerBoletasPorMes() {
    $mes = $_POST['mes'] ?? '';
    
    if (empty($mes)) {
        echo json_encode(['success' => false, 'message' => 'Mes no válido']);
        return;
    }
    
    // Calcular primer y último día del mes
    $primer_dia = $mes . '-01';
    $ultimo_dia = date('Y-m-t', strtotime($primer_dia));
    
    $boletas = obtenerDatos($primer_dia, $ultimo_dia);
    
    echo json_encode([
        'success' => true,
        'boletas' => $boletas,
        'total' => count($boletas)
    ]);
}
?>