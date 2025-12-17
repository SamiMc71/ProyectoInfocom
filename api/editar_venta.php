<?php
// Silenciar cualquier error o advertencia de PHP para garantizar una respuesta JSON pura.
error_reporting(0);
ini_set('display_errors', 0);

// Encabezados para permitir la comunicación y definir el tipo de contenido
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar la solicitud pre-vuelo OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../php/config.php';

// Leer los datos JSON enviados desde el frontend
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Validar que el ID de la venta fue proporcionado
if (!isset($data['venta_id'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'ID de venta no proporcionado.']);
    exit;
}

try {
    $conn = getDBConnection();
    if (!$conn) {
        throw new Exception("No se pudo conectar a la base de datos.");
    }
    
    $conn->begin_transaction();
    
    $venta_id = $data['venta_id'];
    
    // 1. Actualizar o crear la información del cliente
    if (isset($data['cliente'])) {
        $cliente = $data['cliente'];
        
        // Asignar valores con el operador de fusión de null para evitar errores
        $tipo_documento = $cliente['tipo_documento'] ?? 'DNI';
        $numero_documento = $cliente['numero_documento'] ?? null;
        $nombres = $cliente['nombres'] ?? '';
        $telefono = $cliente['telefono'] ?? '';
        $email = $cliente['email'] ?? '';

        if ($numero_documento) {
            // Buscar si el cliente ya existe por número de documento
            $stmt = $conn->prepare("SELECT id FROM clientes WHERE numero_documento = ?");
            $stmt->bind_param("s", $numero_documento);
            $stmt->execute();
            $result = $stmt->get_result();
            $cliente_existente = $result->fetch_assoc();
            $stmt->close();
            
            $cliente_id = null;
            if ($cliente_existente) {
                // Si existe, actualizamos sus datos
                $cliente_id = $cliente_existente['id'];
                $stmt = $conn->prepare("UPDATE clientes SET tipo_documento = ?, nombres = ?, telefono = ?, email = ? WHERE id = ?");
                $stmt->bind_param("ssssi", $tipo_documento, $nombres, $telefono, $email, $cliente_id);
                $stmt->execute();
                $stmt->close();
            } else {
                // Si no existe, creamos un nuevo cliente
                $stmt = $conn->prepare("INSERT INTO clientes (tipo_documento, numero_documento, nombres, telefono, email) VALUES (?, ?, ?, ?, ?)");
                $stmt->bind_param("sssss", $tipo_documento, $numero_documento, $nombres, $telefono, $email);
                $stmt->execute();
                $cliente_id = $conn->insert_id;
                $stmt->close();
            }
            
            // Actualizar la venta con el ID del cliente
            if ($cliente_id) {
                $stmt = $conn->prepare("UPDATE ventas SET cliente_id = ? WHERE id = ?");
                $stmt->bind_param("ii", $cliente_id, $venta_id);
                $stmt->execute();
                $stmt->close();
            }
        }
    }
    
    // 2. Actualizar la información principal de la venta
    $stmt = $conn->prepare("UPDATE ventas SET tipo_comprobante = ?, subtotal = ?, igv = ?, total = ? WHERE id = ?");
    $stmt->bind_param("sdddi", 
        $data['tipo_comprobante'],
        $data['subtotal'],
        $data['igv'],
        $data['total'],
        $venta_id
    );
    $stmt->execute();
    $stmt->close();
    
    // 3. Actualizar los detalles de la venta (productos)
    if (isset($data['detalles']) && is_array($data['detalles'])) {
        // Primero, eliminamos todos los detalles anteriores de esa venta
        $stmt = $conn->prepare("DELETE FROM detalle_venta WHERE venta_id = ?");
        $stmt->bind_param("i", $venta_id);
        $stmt->execute();
        $stmt->close();
        
        // Luego, insertamos los nuevos detalles actualizados
        $stmt = $conn->prepare("INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)");
        
        foreach ($data['detalles'] as $detalle) {
            $stmt->bind_param("isidd", 
                $venta_id,
                $detalle['producto_id'],
                $detalle['cantidad'],
                $detalle['precio_unitario'],
                $detalle['subtotal']
            );
            $stmt->execute();
        }
        $stmt->close();
    }
    
    $conn->commit();
    $conn->close();
    
    echo json_encode(['success' => true, 'mensaje' => 'Venta actualizada correctamente']);
    
} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollback(); // Revertir cambios si algo falló
    }
    http_response_code(500); // Internal Server Error
    echo json_encode([
        'success' => false,
        'error' => 'Error al actualizar venta: ' . $e->getMessage()
    ]);
}
?>