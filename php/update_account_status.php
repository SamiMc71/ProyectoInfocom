<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user_id = intval($_POST['user_id']);
    $action = $_POST['action'];
    $rol_asignado = isset($_POST['rol_asignado']) ? $_POST['rol_asignado'] : null;

    $response = array('success' => false, 'message' => '');

    $conn = getDBConnection();

    switch($action) {
        case 'approve':
            if (!$rol_asignado) {
                $response['message'] = 'Debe asignar un rol';
                break;
            }
            
            $stmt = $conn->prepare("UPDATE usuarios SET estado = 'aprobado', rol_asignado = ? WHERE id = ?");
            $stmt->bind_param("si", $rol_asignado, $user_id);
            
            if ($stmt->execute()) {
                $response['success'] = true;
                $response['message'] = 'Cuenta aprobada correctamente';
            } else {
                $response['message'] = 'Error al aprobar cuenta: ' . $conn->error;
            }
            $stmt->close();
            break;

        case 'reject':
            $stmt = $conn->prepare("UPDATE usuarios SET estado = 'rechazado' WHERE id = ?");
            $stmt->bind_param("i", $user_id);
            
            if ($stmt->execute()) {
                $response['success'] = true;
                $response['message'] = 'Cuenta rechazada correctamente';
            } else {
                $response['message'] = 'Error al rechazar cuenta: ' . $conn->error;
            }
            $stmt->close();
            break;

        case 'delete':
            $stmt = $conn->prepare("DELETE FROM usuarios WHERE id = ?");
            $stmt->bind_param("i", $user_id);
            
            if ($stmt->execute()) {
                $response['success'] = true;
                $response['message'] = 'Cuenta eliminada correctamente';
            } else {
                $response['message'] = 'Error al eliminar cuenta: ' . $conn->error;
            }
            $stmt->close();
            break;

        default:
            $response['message'] = 'Acción no válida';
    }

    $conn->close();
    echo json_encode($response);
}
?>