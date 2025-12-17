<?php
// api/servicios_tecnicos.php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../php/config.php'; // config.php ya inicia la sesión

$db = getDBConnection();

if ($db === null) {
    http_response_code(500);
    echo json_encode(["error" => "Error fatal: No se pudo conectar a la base de datos."]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

$usuario_id = $_SESSION['user_id'] ?? null;

try {
    switch($method) {
        case 'GET':
            // --- INICIO DE MODIFICACIÓN: Pasar ID si existe en GET ---
            $filter_user_id = $_GET['usuario_id'] ?? null;
            getServicios($db, $filter_user_id);
            break;
            // --- FIN DE MODIFICACIÓN ---
        case 'POST':
            crearServicio($db, $usuario_id);
            break;
        case 'PUT':
            actualizarServicio($db, $usuario_id);
            break;
        case 'DELETE':
            eliminarServicio($db);
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

// --- INICIO DE MODIFICACIÓN: Aceptar $filter_user_id para filtrar ---
function getServicios($db, $filter_user_id = null) {
    // Definición de las condiciones WHERE
    $conditions = ["s.estado != 'ELIMINADO'"];
    $bind_types = '';
    $bind_params = [];

    if ($filter_user_id !== null && $filter_user_id !== 'all') {
        // Aseguramos que el usuario_id es un entero para la consulta
        $filter_user_id_int = (int)$filter_user_id;
        $conditions[] = "s.usuario_id = ?";
        $bind_types .= 'i';
        $bind_params[] = &$filter_user_id_int;
    }

    $where_clause = "WHERE " . implode(' AND ', $conditions);

    $query = "SELECT 
                s.id,
                s.cliente_nombre,
                s.equipo_nombre,
                s.equipo_problema,
                s.total,
                s.estado,
                s.fecha_ingreso,
                s.tipo_comprobante,
                u.nombre_completo as vendedor_nombre
              FROM servicios_tecnicos s
              LEFT JOIN usuarios u ON s.usuario_id = u.id
              $where_clause
              ORDER BY s.fecha_ingreso DESC";
    
    // Preparar y ejecutar la consulta
    if ($filter_user_id !== null && $filter_user_id !== 'all') {
        $stmt = $db->prepare($query);
        // La función call_user_func_array se usa para enlazar parámetros dinámicamente
        call_user_func_array([$stmt, 'bind_param'], array_merge([$bind_types], $bind_params));
        $stmt->execute();
        $result = $stmt->get_result();
        $stmt->close();
    } else {
        $result = $db->query($query);
    }
    
    if ($result) {
        $servicios = [];
        while($row = $result->fetch_assoc()) {
            $row['total'] = (float)$row['total'];
            $servicios[] = $row;
        }
        echo json_encode($servicios, JSON_UNESCAPED_UNICODE);
    } else {
        throw new Exception("Error al obtener servicios: " . $db->error);
    }
}
// --- FIN DE MODIFICACIÓN ---

function crearServicio($db, $usuario_id) {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(["error" => "JSON inválido"]);
        return;
    }
    
    if ($usuario_id === null) {
        http_response_code(401);
        echo json_encode(['error' => 'No hay sesión de usuario activa para registrar el servicio.']);
        exit;
    }

    $db->begin_transaction();
    
    try {
        $query_servicio = "INSERT INTO servicios_tecnicos 
                            (cliente_tipo_doc, cliente_num_doc, cliente_nombre, cliente_telefono, usuario_id,
                             equipo_tipo, equipo_nombre, equipo_problema, 
                             costo_servicio, subtotal_productos, total, tipo_comprobante, estado, fecha_ingreso) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt_servicio = $db->prepare($query_servicio);
        
        $fecha_ingreso = $data['fecha_ingreso'] ?? date('Y-m-d H:i:s');
        
        $stmt_servicio->bind_param("ssssisssdddsss", 
            $data['cliente_tipo_doc'],
            $data['cliente_num_doc'],
            $data['cliente_nombre'],
            $data['cliente_telefono'],
            $usuario_id, 
            $data['equipo_tipo'],
            $data['equipo_nombre'],
            $data['equipo_problema'],
            $data['costo_servicio'],
            $data['subtotal_productos'],
            $data['total'],
            $data['tipo_comprobante'],
            $data['estado'],
            $fecha_ingreso
        );
        
        if (!$stmt_servicio->execute()) {
            throw new Exception("Error al insertar servicio: " . $stmt_servicio->error);
        }
        
        $servicio_id = $db->insert_id;
        
        if (isset($data['productos']) && is_array($data['productos']) && count($data['productos']) > 0) {
            $query_producto = "INSERT INTO servicio_productos 
                             (servicio_id, producto_id, cantidad, precio_unitario, subtotal) 
                             VALUES (?, ?, ?, ?, ?)";
            $stmt_producto = $db->prepare($query_producto);
            
            foreach ($data['productos'] as $producto) {
                $stmt_producto->bind_param("isidd", 
                    $servicio_id,
                    $producto['producto_id'],
                    $producto['cantidad'],
                    $producto['precio_unitario'],
                    $producto['subtotal']
                );
                if (!$stmt_producto->execute()) {
                    throw new Exception("Error al insertar producto: " . $stmt_producto->error);
                }
                
                $stmt_update_stock = $db->prepare("UPDATE productos SET stock = stock - ? WHERE id = ?");
                $stmt_update_stock->bind_param("is", $producto['cantidad'], $producto['producto_id']);
                $stmt_update_stock->execute();
                $stmt_update_stock->close();
            }
            $stmt_producto->close();
        }
        
        $db->commit();
        
        echo json_encode([
            "success" => true,
            "message" => "Servicio creado correctamente", 
            "id" => $servicio_id
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (Exception $e) {
        $db->rollback();
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    
    if (isset($stmt_servicio)) $stmt_servicio->close();
}

function actualizarServicio($db, $usuario_id) {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
    
    $id = $_GET['id'] ?? $data['id'] ?? null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "ID de servicio no especificado"]);
        return;
    }
    
    if ($usuario_id === null) {
        http_response_code(401);
        echo json_encode(['error' => 'No hay sesión de usuario activa para actualizar el servicio.']);
        exit;
    }

    $db->begin_transaction();
    
    try {
        $query_antiguos = "SELECT producto_id, cantidad FROM servicio_productos WHERE servicio_id = ?";
        $stmt_antiguos = $db->prepare($query_antiguos);
        $stmt_antiguos->bind_param("i", $id);
        $stmt_antiguos->execute();
        $result_antiguos = $stmt_antiguos->get_result();
        $stmt_stock_devolver = $db->prepare("UPDATE productos SET stock = stock + ? WHERE id = ?");
        while ($prod = $result_antiguos->fetch_assoc()) {
            $stmt_stock_devolver->bind_param("is", $prod['cantidad'], $prod['producto_id']);
            $stmt_stock_devolver->execute();
        }
        $stmt_stock_devolver->close();
        $stmt_antiguos->close();

        $query_servicio = "UPDATE servicios_tecnicos SET 
                            cliente_tipo_doc = ?, cliente_num_doc = ?, cliente_nombre = ?, cliente_telefono = ?, usuario_id = ?,
                            equipo_tipo = ?, equipo_nombre = ?, equipo_problema = ?, 
                            costo_servicio = ?, subtotal_productos = ?, total = ?, tipo_comprobante = ?, estado = ?, fecha_ingreso = ?
                            WHERE id = ?";
        
        $stmt_servicio = $db->prepare($query_servicio);
        
        $fecha_ingreso = $data['fecha_ingreso'] ?? date('Y-m-d H:i:s');
        
        $stmt_servicio->bind_param("ssssisssdddsssi", 
            $data['cliente_tipo_doc'],
            $data['cliente_num_doc'],
            $data['cliente_nombre'],
            $data['cliente_telefono'],
            $usuario_id, 
            $data['equipo_tipo'],
            $data['equipo_nombre'],
            $data['equipo_problema'],
            $data['costo_servicio'],
            $data['subtotal_productos'],
            $data['total'],
            $data['tipo_comprobante'],
            $data['estado'],
            $fecha_ingreso,
            $id
        );
        
        if (!$stmt_servicio->execute()) {
            throw new Exception("Error al actualizar servicio: " . $stmt_servicio->error);
        }
        
        $stmt_delete = $db->prepare("DELETE FROM servicio_productos WHERE servicio_id = ?");
        $stmt_delete->bind_param("i", $id);
        $stmt_delete->execute();
        $stmt_delete->close();
        
        if (isset($data['productos']) && is_array($data['productos']) && count($data['productos']) > 0) {
            $query_producto = "INSERT INTO servicio_productos 
                             (servicio_id, producto_id, cantidad, precio_unitario, subtotal) 
                             VALUES (?, ?, ?, ?, ?)";
            $stmt_producto = $db->prepare($query_producto);
            $stmt_stock_reducir = $db->prepare("UPDATE productos SET stock = stock - ? WHERE id = ?");
            
            foreach ($data['productos'] as $producto) {
                $stmt_producto->bind_param("isidd", 
                    $id,
                    $producto['producto_id'],
                    $producto['cantidad'],
                    $producto['precio_unitario'],
                    $producto['subtotal']
                );
                if (!$stmt_producto->execute()) {
                    throw new Exception("Error al insertar producto: " . $stmt_producto->error);
                }
                
                $stmt_stock_reducir->bind_param("is", $producto['cantidad'], $producto['producto_id']);
                $stmt_stock_reducir->execute();
            }
            $stmt_producto->close();
            $stmt_stock_reducir->close();
        }
        
        $db->commit();
        
        echo json_encode([
            "success" => true,
            "message" => "Servicio actualizado correctamente"
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (Exception $e) {
        $db->rollback();
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    
    if (isset($stmt_servicio)) $stmt_servicio->close();
}

function eliminarServicio($db) {
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "ID de servicio no especificado"]);
        return;
    }
    
    $db->begin_transaction();
    
    try {
        // [LÓGICA ORIGINAL] Devolver stock
        $query_antiguos = "SELECT producto_id, cantidad FROM servicio_productos WHERE servicio_id = ?";
        $stmt_antiguos = $db->prepare($query_antiguos);
        $stmt_antiguos->bind_param("i", $id);
        $stmt_antiguos->execute();
        $result_antiguos = $stmt_antiguos->get_result();
        $stmt_stock_devolver = $db->prepare("UPDATE productos SET stock = stock + ? WHERE id = ?");
        while ($prod = $result_antiguos->fetch_assoc()) {
            $stmt_stock_devolver->bind_param("is", $prod['cantidad'], $prod['producto_id']);
            $stmt_stock_devolver->execute();
        }
        $stmt_stock_devolver->close();
        $stmt_antiguos->close();
        
        // [MODIFICADO] NO ELIMINAMOS, SOLO CAMBIAMOS EL ESTADO A ELIMINADO
        $stmt_actualizar_serv = $db->prepare("UPDATE servicios_tecnicos SET estado = 'ELIMINADO' WHERE id = ?");
        $stmt_actualizar_serv->bind_param("i", $id);
        
        if (!$stmt_actualizar_serv->execute()) {
            throw new Exception("Error al marcar servicio como eliminado: " . $stmt_actualizar_serv->error);
        }
        
        $db->commit();
        
        echo json_encode([
            "success" => true,
            "message" => "Servicio marcado como ELIMINADO correctamente"
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (Exception $e) {
        $db->rollback();
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    
    if (isset($stmt_actualizar_serv)) $stmt_actualizar_serv->close();
}
?>