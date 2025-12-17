<?php
// inventario_infocom/php/get_users_by_role.php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$roles = $_GET['roles'] ?? ''; // roles separados por coma (ej: 'ventas,admin')

if (empty($roles)) {
    echo json_encode(['success' => false, 'message' => 'Roles no especificados']);
    exit;
}

$roles_array = array_map('trim', explode(',', $roles));
// Prepara los placeholders para la consulta SQL
$placeholders = implode(',', array_fill(0, count($roles_array), '?'));
$types = str_repeat('s', count($roles_array));

$conn = getDBConnection();
if (!$conn) {
    echo json_encode(['success' => false, 'message' => 'Error de conexión a la base de datos']);
    exit;
}

try {
    // Consulta para obtener usuarios aprobados con los roles especificados
    $sql = "SELECT id, nombre_completo, rol_asignado 
            FROM usuarios 
            WHERE estado = 'aprobado' AND rol_asignado IN ($placeholders)
            ORDER BY nombre_completo";
            
    $stmt = $conn->prepare($sql);
    
    // Enlazar parámetros dinámicamente
    $params = array_merge(array($types), $roles_array);
    $refs = array();
    foreach ($params as $key => $value) {
        $refs[$key] = &$params[$key];
    }
    call_user_func_array(array($stmt, 'bind_param'), $refs);
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    
    echo json_encode(['success' => true, 'users' => $users]);
    $stmt->close();
} catch (Exception $e) {
    error_log("Error en get_users_by_role: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error de servidor: ' . $e->getMessage()]);
} finally {
    if ($conn) $conn->close();
}
?>