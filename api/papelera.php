<?php
// inventario_infocom/api/papelera.php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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

$action = $_GET['action'] ?? '';

try {
    if ($_SERVER['REQUEST_METHOD'] == 'GET') {
        obtenerItemsEliminados($db);
    } elseif ($_SERVER['REQUEST_METHOD'] == 'POST' && $action == 'restaurar') {
        restaurarItem($db);
    } elseif ($_SERVER['REQUEST_METHOD'] == 'POST' && $action == 'eliminar_permanente') {
        eliminarPermanentemente($db);
    } else {
        http_response_code(405);
        echo json_encode(["error" => "Método o acción no permitido"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error interno del servidor: " . $e->getMessage()]);
}

function obtenerItemsEliminados($db) {
    $resultados = [];
    
    // 1. Productos (estado = 'inactivo')
    $query_productos = "SELECT id, nombre, 'producto' AS tipo, estado, fecha_creacion FROM productos WHERE estado = 'inactivo'";
    $result_productos = $db->query($query_productos);
    while($row = $result_productos->fetch_assoc()) {
        $resultados[] = $row;
    }
    
    // 2. Cotizaciones (estado = 'ELIMINADO')
    $query_cotizaciones = "SELECT id, cliente_nombre AS nombre, 'cotizacion' AS tipo, estado, fecha_creacion FROM cotizaciones WHERE estado = 'ELIMINADO'";
    $result_cotizaciones = $db->query($query_cotizaciones);
    while($row = $result_cotizaciones->fetch_assoc()) {
        $resultados[] = $row;
    }
    
    // 3. Servicios (estado = 'ELIMINADO')
    $query_servicios = "SELECT id, cliente_nombre AS nombre, 'servicio' AS tipo, estado, fecha_ingreso AS fecha_creacion FROM servicios_tecnicos WHERE estado = 'ELIMINADO'";
    $result_servicios = $db->query($query_servicios);
    while($row = $result_servicios->fetch_assoc()) {
        $resultados[] = $row;
    }
    
    // 4. Ventas (estado = 'ANULADA') - Se muestran las ventas anuladas
    $query_ventas = "SELECT v.id, v.numero_comprobante AS nombre, 'venta' AS tipo, v.estado, v.fecha_venta AS fecha_creacion, c.nombres AS cliente_nombre 
                     FROM ventas v 
                     LEFT JOIN clientes c ON v.cliente_id = c.id
                     WHERE v.estado = 'ANULADA'";
    $result_ventas = $db->query($query_ventas);
    while($row = $result_ventas->fetch_assoc()) {
        $row['nombre'] = 'Venta: ' . $row['nombre'] . ' | Cliente: ' . ($row['cliente_nombre'] ?? 'N/A');
        unset($row['cliente_nombre']);
        $resultados[] = $row;
    }
    
    // Ordenar por fecha descendente
    usort($resultados, function($a, $b) {
        return strtotime($b['fecha_creacion']) - strtotime($a['fecha_creacion']);
    });
    
    echo json_encode(["success" => true, "data" => $resultados], JSON_UNESCAPED_UNICODE);
}

function restaurarItem($db) {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
    
    $id = $data['id'] ?? null;
    $tipo = $data['tipo'] ?? null;
    
    if (!$id || !$tipo) {
        http_response_code(400);
        echo json_encode(["error" => "ID y tipo son requeridos"]);
        return;
    }
    
    $db->begin_transaction();
    $tabla = '';
    $estado_nuevo = '';
    $estado_antiguo = '';
    $id_param_type = 's'; // Default para IDs de tipo string (cotizaciones, productos)
    
    switch ($tipo) {
        case 'producto':
            $tabla = 'productos';
            $estado_nuevo = 'activo';
            $estado_antiguo = 'inactivo';
            break;
        case 'cotizacion':
            $tabla = 'cotizaciones';
            $estado_nuevo = 'pending'; 
            $estado_antiguo = 'ELIMINADO';
            break;
        case 'servicio':
            $tabla = 'servicios_tecnicos';
            $estado_nuevo = 'pendiente'; 
            $estado_antiguo = 'ELIMINADO';
            $id_param_type = 'i'; 
            break;
        case 'venta':
            $tabla = 'ventas';
            $estado_nuevo = 'COMPLETADA'; 
            $estado_antiguo = 'ANULADA';
            $id_param_type = 'i'; 
            break;
        default:
            http_response_code(400);
            echo json_encode(["error" => "Tipo de elemento no válido para restaurar"]);
            return;
    }
    
    try {
        $query = "UPDATE $tabla SET estado = ? WHERE id = ? AND estado = ?";
        $stmt = $db->prepare($query);

        // Se usa el tipo de parámetro correcto para el ID (s para string, i para int)
        $stmt->bind_param("s" . $id_param_type . "s", $estado_nuevo, $id, $estado_antiguo);
       
        if (!$stmt->execute()) {
            throw new Exception("Error al restaurar: " . $stmt->error);
        }

        if ($stmt->affected_rows === 0) {
             throw new Exception("El elemento ya fue restaurado o no existe.");
        }
        
        // Lógica especial para restaurar stock de productos en un servicio
        if ($tipo == 'servicio') {
            // Re-reducir el stock (ya que fue devuelto al marcar como ELIMINADO)
            $query_productos_serv = "SELECT producto_id, cantidad FROM servicio_productos WHERE servicio_id = ?";
            $stmt_productos_serv = $db->prepare($query_productos_serv);
            $stmt_productos_serv->bind_param("i", $id);
            $stmt_productos_serv->execute();
            $result_productos_serv = $stmt_productos_serv->get_result();
            
            $stmt_stock_reducir = $db->prepare("UPDATE productos SET stock = stock - ? WHERE id = ?");
            while ($prod = $result_productos_serv->fetch_assoc()) {
                $stmt_stock_reducir->bind_param("is", $prod['cantidad'], $prod['producto_id']);
                $stmt_stock_reducir->execute();
            }
            $stmt_stock_reducir->close();
            $stmt_productos_serv->close();
        }
        
        $db->commit();
        
        echo json_encode(["success" => true, "message" => "$tipo restaurado correctamente", "id" => $id], JSON_UNESCAPED_UNICODE);
        
    } catch (Exception $e) {
        $db->rollback();
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

function eliminarPermanentemente($db) {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
    
    $id = $data['id'] ?? null;
    $tipo = $data['tipo'] ?? null;
    
    if (!$id || !$tipo) {
        http_response_code(400);
        echo json_encode(["error" => "ID y tipo son requeridos para la eliminación permanente"]);
        return;
    }
    
    $db->begin_transaction();
    $tabla = '';
    $id_param_type = 's';
    $success = false;

    try {
        switch ($tipo) {
            case 'producto':
                $tabla = 'productos';
                break;
            case 'cotizacion':
                $tabla = 'cotizaciones';
                $stmt_detalles = $db->prepare("DELETE FROM cotizacion_detalles WHERE cotizacion_id = ?");
                $stmt_detalles->bind_param("s", $id);
                $stmt_detalles->execute();
                $stmt_detalles->close();
                break;
            case 'servicio':
                $tabla = 'servicios_tecnicos';
                $id_param_type = 'i';
                $stmt_productos = $db->prepare("DELETE FROM servicio_productos WHERE servicio_id = ?");
                $stmt_productos->bind_param("i", $id);
                $stmt_productos->execute();
                $stmt_productos->close();
                break;
            case 'venta':
                $tabla = 'ventas';
                $id_param_type = 'i';
                $stmt_detalles_venta = $db->prepare("DELETE FROM detalle_venta WHERE venta_id = ?");
                $stmt_detalles_venta->bind_param("i", $id);
                $stmt_detalles_venta->execute();
                $stmt_detalles_venta->close();
                break;
            default:
                throw new Exception("Tipo de elemento no válido para la eliminación permanente.");
        }

        // Eliminar el registro principal
        $query_principal = "DELETE FROM $tabla WHERE id = ?";
        $stmt_principal = $db->prepare($query_principal);
        $stmt_principal->bind_param($id_param_type, $id);
        
        if (!$stmt_principal->execute()) {
            throw new Exception("Error al eliminar el registro principal: " . $stmt_principal->error);
        }

        if ($stmt_principal->affected_rows === 0) {
             throw new Exception("El elemento no existe o ya fue eliminado.");
        }
        
        $db->commit();
        $success = true;
        
    } catch (Exception $e) {
        $db->rollback();
        http_response_code(500);
        echo json_encode(["error" => "Error de BD al eliminar: " . $e->getMessage()]);
        return;
    }

    if ($success) {
        echo json_encode(["success" => true, "message" => "$tipo $id eliminado permanentemente."]);
    }
}
?>