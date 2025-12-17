<?php
// api/productos.php
//error_reporting(0); // <-- CORRECCIÓN IMPORTANTE
//ini_set('display_errors', 0); // <-- CORRECCIÓN IMPORTANTE

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

if ($db === null) {
    http_response_code(500);
    echo json_encode(["error" => "Error fatal: No se pudo conectar a la base de datos."]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            getProductos($db);
            break;
        case 'POST':
            crearProducto($db);
            break;
        case 'PUT':
            actualizarProducto($db);
            break;
        case 'DELETE':
            eliminarProducto($db);
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

function getProductos($db) {
    $query = "SELECT id, nombre, descripcion, marca, categoria, stock, precio, imagen 
              FROM productos 
              WHERE estado = 'activo' 
              ORDER BY fecha_creacion DESC";
    
    $result = $db->query($query);
    
    if ($result) {
        $productos = [];
        while($row = $result->fetch_assoc()) {
            $row['stock'] = (int)$row['stock'];
            $row['precio'] = (float)$row['precio'];
            $productos[] = $row;
        }
        echo json_encode($productos, JSON_UNESCAPED_UNICODE);
    } else {
        throw new Exception("Error al obtener productos: " . $db->error);
    }
}

function crearProducto($db) {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(["error" => "JSON inválido"]);
        return;
    }
    
    if (!isset($data['nombre']) || !isset($data['marca']) || !isset($data['categoria']) || 
        !isset($data['stock']) || !isset($data['precio'])) {
        http_response_code(400);
        echo json_encode(["error" => "Datos incompletos"]);
        return;
    }
    
    $last_id_query = "SELECT MAX(CAST(SUBSTRING(id, 2) AS UNSIGNED)) as max_id FROM productos";
    $result = $db->query($last_id_query);
    $row = $result->fetch_assoc();
    $last_id = $row['max_id'] ?? 0;
    $new_id = 'P' . str_pad($last_id + 1, 3, '0', STR_PAD_LEFT);
    
    $query = "INSERT INTO productos 
              (id, nombre, descripcion, marca, categoria, stock, precio, imagen, estado) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'activo')";
              
    $stmt = $db->prepare($query);
    
    $descripcion = $data['descripcion'] ?? '';
    $imagen = $data['imagen'] ?? 'https://via.placeholder.com/150';
    $stock = (int)$data['stock'];
    $precio = (float)$data['precio'];
    
    $stmt->bind_param("sssssids", 
        $new_id,
        $data['nombre'],
        $descripcion,
        $data['marca'],
        $data['categoria'],
        $stock,
        $precio,
        $imagen
    );
    
    if($stmt->execute()) {
        echo json_encode([
            "message" => "Producto creado correctamente", 
            "id" => $new_id
        ], JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Error al crear producto: " . $stmt->error]);
    }
    
    $stmt->close();
}

function actualizarProducto($db) {
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
        echo json_encode(["error" => "ID de producto no especificado"]);
        return;
    }
    
    // INICIO MODIFICACIÓN
    $query = "UPDATE productos SET 
              nombre = ?,
              descripcion = ?,
              marca = ?,
              categoria = ?,
              stock = ?,
              precio = ?,
              imagen = ?
              WHERE id = ? AND estado = 'activo'";
              
    $stmt = $db->prepare($query);
    
    $nombre = $data['nombre'] ?? '';
    $descripcion = $data['descripcion'] ?? '';
    $marca = $data['marca'] ?? '';
    $categoria = $data['categoria'] ?? '';
    $stock = (int)($data['stock'] ?? 0);
    $precio = (float)($data['precio'] ?? 0);
    $imagen = $data['imagen'] ?? 'https://via.placeholder.com/150';
    
    $stmt->bind_param("ssssidss", 
        $nombre,
        $descripcion,
        $marca,
        $categoria,
        $stock,
        $precio,
        $imagen,
        $id
    );
    // FIN MODIFICACIÓN
    
    if($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(["message" => "Producto actualizado correctamente"]);
        } else {
            echo json_encode(["message" => "Producto actualizado (sin cambios) o no encontrado"]);
        }
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Error al actualizar producto: " . $stmt->error]);
    }
    
    $stmt->close();
}

function eliminarProducto($db) {
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "ID de producto no especificado"]);
        return;
    }
    
    $query = "UPDATE productos SET estado = 'inactivo' WHERE id = ?";
    $stmt = $db->prepare($query);
    
    if (!$stmt) {
        throw new Exception("Error en la preparación: " . $db->error);
    }
    
    $stmt->bind_param("s", $id);
    
    if($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(["message" => "Producto eliminado correctamente"]);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Producto no encontrado"]);
        }
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Error al eliminar producto: " . $stmt->error]);
    }
    
    $stmt->close();
}
?>