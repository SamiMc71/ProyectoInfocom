<?php
// api/guardar_venta.php

// Headers CORS completos
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400');

// Manejar preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar que sea POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido. Se esperaba POST.']);
    exit;
}

// Incluir configuración de la base de datos
require_once '../php/config.php'; // config.php ya inicia la sesión

// Obtener el contenido raw del POST
$input = file_get_contents('php://input');
error_log("Input recibido: " . $input);

if (empty($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'No se recibieron datos']);
    exit;
}

$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Error JSON: ' . json_last_error_msg()]);
    exit;
}

// --- INICIO DE MODIFICACIÓN ---
// Obtener el ID del usuario de la sesión
$usuario_id = $_SESSION['user_id'] ?? null;
if ($usuario_id === null) {
    http_response_code(401); // No autorizado
    echo json_encode(['error' => 'No hay sesión de usuario activa para registrar la venta.']);
    exit;
}
// --- FIN DE MODIFICACIÓN ---

// Obtener conexión a la base de datos
$conn = getDBConnection();

if ($conn === null) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexión a la base de datos']);
    exit;
}

try {
    // Iniciar transacción
    $conn->begin_transaction();
    
    // 1. Buscar o crear cliente
    $cliente_id = null;
    if (isset($data['cliente']) && !empty($data['cliente']['numero_documento'])) {
        $cliente = $data['cliente'];
        
        // Verificar si el cliente ya existe
        $stmt = $conn->prepare("SELECT id FROM clientes WHERE numero_documento = ?");
        $numero_doc = $cliente['numero_documento'];
        $stmt->bind_param("s", $numero_doc);
        $stmt->execute();
        $result = $stmt->get_result();
        $cliente_existente = $result->fetch_assoc();
        $stmt->close();
        
        if ($cliente_existente) {
            $cliente_id = $cliente_existente['id'];
            error_log("Cliente existente encontrado: " . $cliente_id);
        } else {
            
            $stmt = $conn->prepare("INSERT INTO clientes (tipo_documento, numero_documento, nombres, apellidos, telefono, email, direccion, fecha_creacion) 
                                   VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
            
            $tipo_doc = $cliente['tipo_documento'] ?? 'DNI';
            $numero_doc = $cliente['numero_documento'];
            $nombres = $cliente['nombres'] ?? '';
            $apellidos = $cliente['apellidos'] ?? '';
            $telefono = $cliente['telefono'] ?? '';
            $email = $cliente['email'] ?? '';
            $direccion = $cliente['direccion'] ?? '';
            
            $stmt->bind_param("sssssss", $tipo_doc, $numero_doc, $nombres, $apellidos, $telefono, $email, $direccion);
            
            $stmt->execute();
            $cliente_id = $conn->insert_id;
            $stmt->close();
            error_log("Nuevo cliente creado: " . $cliente_id);
        }
    }
    
    // 2. Generar número de comprobante
    $year = date('Y');
    $tipo_comprobante = $data['tipo_comprobante'] ?? 'BOLETA';
    
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM ventas WHERE YEAR(fecha_venta) = ? AND tipo_comprobante = ?");
    $stmt->bind_param("ss", $year, $tipo_comprobante);
    $stmt->execute();
    $result = $stmt->get_result();
    $count_data = $result->fetch_assoc();
    $stmt->close();
    
    $correlativo = str_pad($count_data['count'] + 1, 8, '0', STR_PAD_LEFT);
    $numero_comprobante = ($tipo_comprobante == 'FACTURA' ? 'F' : 'B') . $year . "-" . $correlativo;
    
    error_log("Generando comprobante: " . $numero_comprobante);
    
    // 3. Insertar venta
    // --- INICIO DE MODIFICACIÓN ---
    $stmt = $conn->prepare("INSERT INTO ventas (cliente_id, usuario_id, tipo_comprobante, numero_comprobante, subtotal, igv, total, estado) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    
    $subtotal = $data['subtotal'] ?? 0;
    $igv = $data['igv'] ?? 0;
    $total = $data['total'] ?? 0;
    $estado = 'COMPLETADA'; 
    
    $stmt->bind_param("iissddds", $cliente_id, $usuario_id, $tipo_comprobante, $numero_comprobante, $subtotal, $igv, $total, $estado);
    // --- FIN DE MODIFICACIÓN ---
    
    $stmt->execute();
    $venta_id = $conn->insert_id;
    $stmt->close();
    
    error_log("Venta creada: " . $venta_id . " por Usuario ID: " . $usuario_id);
    
    // 4. Insertar detalles de venta (PRODUCTOS)
    if (isset($data['productos']) && is_array($data['productos'])) {
        $stmt_detalle = $conn->prepare("INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal) 
                                       VALUES (?, ?, ?, ?, ?)");
        
        foreach ($data['productos'] as $producto) {
            $producto_id = $producto['id'] ?? null;
            $cantidad = $producto['cantidad'] ?? 1;
            $precio_unitario = $producto['precio'] ?? 0;
            $subtotal_detalle = $producto['subtotal'] ?? 0;
            
            $stmt_detalle->bind_param("isidd", $venta_id, $producto_id, $cantidad, $precio_unitario, $subtotal_detalle);
            $stmt_detalle->execute();
            
            error_log("Producto agregado: " . $producto_id . " - Cantidad: " . $cantidad);
            
            // Actualizar stock en productos
            $stmt_update = $conn->prepare("UPDATE productos SET stock = stock - ? WHERE id = ?");
            $stmt_update->bind_param("is", $cantidad, $producto_id);
            $stmt_update->execute();
            $stmt_update->close();
        }
        $stmt_detalle->close();
    }
    
    // 5. Insertar detalles de venta (SERVICIOS)
    if (isset($data['servicios']) && is_array($data['servicios'])) {
        $stmt_servicio = $conn->prepare("INSERT INTO detalle_venta_servicios (venta_id, servicio_id, cantidad, precio_unitario, subtotal) 
                                       VALUES (?, ?, ?, ?, ?)");
        
        if (!$stmt_servicio) {
            throw new Exception("Error al preparar la consulta de servicios: " . $conn->error);
        }

        foreach ($data['servicios'] as $servicio) {
            $servicio_id = $servicio['id'] ?? null;
            $cantidad = $servicio['cantidad'] ?? 1;
            $precio_unitario = $servicio['precio'] ?? 0;
            $subtotal_detalle = $servicio['subtotal'] ?? 0;
            
            $stmt_servicio->bind_param("iiidd", $venta_id, $servicio_id, $cantidad, $precio_unitario, $subtotal_detalle);
            $stmt_servicio->execute();
            
            error_log("Servicio agregado: " . $servicio_id . " - Cantidad: " . $cantidad);
        }
        $stmt_servicio->close();
    }
    
    // Confirmar transacción
    $conn->commit();
    
    // Respuesta exitosa
    $response = [
        'success' => true,
        'venta_id' => $venta_id,
        'numero_comprobante' => $numero_comprobante,
        'subtotal' => $subtotal,
        'igv' => $igv,
        'total' => $total,
        'mensaje' => 'Venta guardada exitosamente en la base de datos'
    ];
    
    error_log("Venta completada exitosamente: " . $numero_comprobante);
    echo json_encode($response);
    
} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollback();
    }
    
    error_log("Error al guardar venta: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error del servidor: ' . $e->getMessage()]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>