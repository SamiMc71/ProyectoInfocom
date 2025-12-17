<?php
include('config.php');
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit;
}

$user_id = $_SESSION['user_id'];
$conn = getDBConnection();

$sql = "SELECT id, nombre_completo, email, username, rol_solicitado, rol_asignado, estado 
        FROM usuarios 
        WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($user = $result->fetch_assoc()) {
    echo json_encode([
        'success' => true,
        'user' => $user
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Usuario no encontrado'
    ]);
}

$stmt->close();
$conn->close();
?>