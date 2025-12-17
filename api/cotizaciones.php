<?php
// api/cotizaciones.php

// --- CORRECCIÓN CRÍTICA: Suprimir advertencias que rompen el JSON ---
error_reporting(0);
ini_set('display_errors', 0);
// --- FIN DE CORRECCIÓN ---

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../php/config.php';

$db = getDBConnection();

// --- INICIO DE LA CORRECCIÓN ---
if ($db === null) {
    http_response_code(500);
    echo json_encode(["error" => "Error fatal: No se pudo conectar a la base de datos."]);
    exit();
}
// --- FIN DE LA CORRECCIÓN ---

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            getCotizaciones($db);
            break;
        case 'POST':
            crearCotizacion($db);
            break;
        default:
            http_response_code(405);
            echo json_encode(["error" => "Método no permitido"]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error interno del servidor: " . $e->getMessage()]);
}

function getCotizaciones($db) {
    // === CORRECCIÓN APLICADA: Solo se pide 'total' para evitar el error SQL.
    $query = "SELECT 
                id,
                cliente_nombre,
                cliente_tipo_doc,
                cliente_num_doc,
                cliente_telefono,
                fecha,
                total,
                estado
              FROM cotizaciones 
              WHERE estado != 'ELIMINADO'
              ORDER BY fecha DESC";
    // === FIN DE CORRECCIÓN APLICADA ===
    
    $result = $db->query($query);
    
    if ($result) {
        $cotizaciones = [];
        while($row = $result->fetch_assoc()) {
            $row['total'] = (float)$row['total'];

            // Lógica de cálculo (Se asume que la interfaz espera subtotal e igv)
            $row['subtotal'] = $row['total'] / 1.18;
            $row['igv'] = $row['total'] - $row['subtotal'];
            
            $cotizaciones[] = $row;
        }
        echo json_encode($cotizaciones, JSON_UNESCAPED_UNICODE);
    } else {
        // En caso de que haya un error de SQL, lo arrojamos para depuración.
        throw new Exception("Error al obtener cotizaciones: " . $db->error);
    }
}

function crearCotizacion($db) {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(["error" => "JSON inválido"]);
        return;
    }
    
    if (!isset($data['cliente_nombre']) || !isset($data['cliente_tipo_doc']) || 
        !isset($data['cliente_num_doc']) || !isset($data['detalles'])) {
        http_response_code(400);
        echo json_encode(["error" => "Datos incompletos"]);
        return;
    }
    
    $db->begin_transaction();
    
    try {
        $last_id_query = "SELECT MAX(CAST(SUBSTRING(id, 5) AS UNSIGNED)) as max_id FROM cotizaciones WHERE id LIKE 'COT-%'";
        $result = $db->query($last_id_query);
        $row = $result->fetch_assoc();
        $last_id = $row['max_id'] ?? 0;
        $new_id = 'COT-' . str_pad($last_id + 1, 3, '0', STR_PAD_LEFT);
        
        // Se inserta en las columnas 'fecha' y 'fecha_creacion'
        // NOTA: Se asume que usted debe agregar subtotal e igv a la tabla si desea que estos se guarden
        // Por ahora, solo guardamos lo que la tabla tiene.
        $query_cotizacion = "INSERT INTO cotizaciones 
                            (id, cliente_nombre, cliente_tipo_doc, cliente_num_doc, 
                             cliente_telefono, fecha, fecha_creacion, total, estado) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt_cotizacion = $db->prepare($query_cotizacion);
        
        if (!$stmt_cotizacion) {
            throw new Exception("Error en la preparación de cotización: " . $db->error);
        }
        
        $cliente_telefono = $data['cliente_telefono'] ?? '';
        $fecha_date = $data['fecha'] ?? date('Y-m-d'); // Columna DATE
        $fecha_timestamp = date('Y-m-d H:i:s'); // Columna TIMESTAMP
        $total = (float)$data['total'];
        $estado = $data['estado'] ?? 'pending';
        
        $stmt_cotizacion->bind_param("ssssssds", 
            $new_id,
            $data['cliente_nombre'],
            $data['cliente_tipo_doc'],
            $data['cliente_num_doc'],
            $cliente_telefono,
            $fecha_date,
            $fecha_timestamp,
            $total,
            $estado
        );
        
        if (!$stmt_cotizacion->execute()) {
            throw new Exception("Error al insertar cotización: " . $stmt_cotizacion->error);
        }
        
        $query_detalle = "INSERT INTO cotizacion_detalles 
                         (cotizacion_id, producto_id, cantidad, precio_unitario, subtotal) 
                         VALUES (?, ?, ?, ?, ?)";
        
        $stmt_detalle = $db->prepare($query_detalle);
        
        if (!$stmt_detalle) {
            throw new Exception("Error en la preparación de detalles: " . $db->error);
        }
        
        foreach ($data['detalles'] as $detalle) {
            $subtotal_detalle = (float)$detalle['cantidad'] * (float)$detalle['precio_unitario'];
            
            $stmt_detalle->bind_param("ssidd", 
                $new_id,
                $detalle['producto_id'],
                $detalle['cantidad'],
                $detalle['precio_unitario'],
                $subtotal_detalle
            );
            
            if (!$stmt_detalle->execute()) {
                throw new Exception("Error al insertar detalle: " . $stmt_detalle->error);
            }
        }
        
        $db->commit();
        
        echo json_encode([
            "success" => true,
            "message" => "Cotización creada correctamente", 
            "id" => $new_id
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (Exception $e) {
        $db->rollback();
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    
    if (isset($stmt_cotizacion)) $stmt_cotizacion->close();
    if (isset($stmt_detalle)) $stmt_detalle->close();
}
?>