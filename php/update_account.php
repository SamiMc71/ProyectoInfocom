
<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user_id = intval($_POST['user_id']);
    $username = trim($_POST['username']);
    $email = trim($_POST['email']);
    $rol_asignado = $_POST['rol_asignado'];
    $password = isset($_POST['password']) ? $_POST['password'] : null;

    $response = array('success' => false, 'message' => '');

    $conn = getDBConnection();

    // Verificar si el email o usuario ya existen en otros usuarios
    $check_stmt = $conn->prepare("SELECT id FROM usuarios WHERE (email = ? OR username = ?) AND id != ?");
    $check_stmt->bind_param("ssi", $email, $username, $user_id);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();

    if ($check_result->num_rows > 0) {
        $response['message'] = 'El email o usuario ya están en uso por otra cuenta';
        $check_stmt->close();
        $conn->close();
        echo json_encode($response);
        exit;
    }
    $check_stmt->close();

    // Actualizar datos
    if ($password) {
        // --- INICIO DE CORRECCIÓN ---
        // Se guarda en texto plano para que coincida con login.php y register.php
        // $password_hash = password_hash($password, PASSWORD_DEFAULT); // <- ESTO ESTABA INCORRECTO
        $stmt = $conn->prepare("UPDATE usuarios SET username = ?, email = ?, rol_asignado = ?, password = ? WHERE id = ?");
        $stmt->bind_param("ssssi", $username, $email, $rol_asignado, $password, $user_id);
        // --- FIN DE CORRECCIÓN ---
    } else {
        $stmt = $conn->prepare("UPDATE usuarios SET username = ?, email = ?, rol_asignado = ? WHERE id = ?");
        $stmt->bind_param("sssi", $username, $email, $rol_asignado, $user_id);
    }

    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = 'Cuenta actualizada correctamente';
    } else {
        $response['message'] = 'Error al actualizar cuenta: ' . $conn->error;
    }

    $stmt->close();
    $conn->close();
    echo json_encode($response);
}
?>