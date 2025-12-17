<?php
// api/cotizaciones_editar.php

// --- CORRECCIÓN CRÍTICA: Suprimir warnings/notices que rompen el JSON ---
error_reporting(0);
ini_set('display_errors', 0);
// --- FIN DE CORRECCIÓN ---

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, DELETE, OPTIONS');
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
        case 'PUT':
            actualizarCotizacion($db);
            break;
        case 'DELETE':
            eliminarCotizacion($db);
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

function actualizarCotizacion($db) {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(["error" => "JSON inválido"]);
        return;
    }
    
    $id = $_GET['id'] ?? $data['id'] ?? null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "ID de cotización no especificado"]);
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
        // === SQL MODIFICADO: Se eliminan subtotal e igv del UPDATE para ajustarse a su tabla.
        $query_cotizacion = "UPDATE cotizaciones SET 
                            cliente_nombre = ?,
                            cliente_tipo_doc = ?,
                            cliente_num_doc = ?,
                            cliente_telefono = ?,
                            total = ?,
                            estado = ?
                            WHERE id = ?";
        
        $stmt_cotizacion = $db->prepare($query_cotizacion);
        
        if (!$stmt_cotizacion) {
            throw new Exception("Error en la preparación de cotización: " . $db->error);
        }
        
        $cliente_telefono = $data['cliente_telefono'] ?? '';
        $total = (float)$data['total'];
        $estado = $data['estado'] ?? 'pending';
        
        // El bind_param se ajusta para 6 parámetros de string (s) + el total (d) + el ID (s)
        $stmt_cotizacion->bind_param("ssssds", 
            $data['cliente_nombre'],
            $data['cliente_tipo_doc'],
            $data['cliente_num_doc'],
            $cliente_telefono,
            $total,
            $estado,
            $id
        );
        // === FIN: SQL MODIFICADO ===
        
        if (!$stmt_cotizacion->execute()) {
            throw new Exception("Error al actualizar cotización: " . $stmt_cotizacion->error);
        }
        
        $query_eliminar_detalles = "DELETE FROM cotizacion_detalles WHERE cotizacion_id = ?";
        $stmt_eliminar = $db->prepare($query_eliminar_detalles);
        
        if (!$stmt_eliminar) {
            throw new Exception("Error en la preparación de eliminación: " . $db->error);
        }
        
        $stmt_eliminar->bind_param("s", $id);
        
        if (!$stmt_eliminar->execute()) {
            throw new Exception("Error al eliminar detalles: " . $stmt_eliminar->error);
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
                $id,
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
            "message" => "Cotización actualizada correctamente"
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (Exception $e) {
        $db->rollback();
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    
    if (isset($stmt_cotizacion)) $stmt_cotizacion->close();
    if (isset($stmt_eliminar)) $stmt_eliminar->close();
    if (isset($stmt_detalle)) $stmt_detalle->close();
}

function eliminarCotizacion($db) {
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "ID de cotización no especificado"]);
        return;
    }
    
    $db->begin_transaction();
    
    try {
        // [MODIFICADO] NO ELIMINAMOS, SOLO CAMBIAMOS EL ESTADO A ELIMINADO
        $query_actualizar_cotizacion = "UPDATE cotizaciones SET estado = 'ELIMINADO' WHERE id = ?";
        $stmt_actualizar = $db->prepare($query_actualizar_cotizacion);
        
        if (!$stmt_actualizar) {
            throw new Exception("Error en la preparación de actualización: " . $db->error);
        }
        
        $stmt_actualizar->bind_param("s", $id);
        
        if (!$stmt_actualizar->execute()) {
            throw new Exception("Error al marcar cotización como eliminada: " . $stmt_actualizar->error);
        }

        $db->commit();
        
        echo json_encode([
            "success" => true,
            "message" => "Cotización marcada como ELIMINADA correctamente"
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (Exception $e) {
        $db->rollback();
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    
    if (isset($stmt_actualizar)) $stmt_actualizar->close();
}
?>