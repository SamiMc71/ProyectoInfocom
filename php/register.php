<?php
// php/register.php - VERSIÓN SIMPLIFICADA
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nombre_completo = trim($_POST['fullname']);
    $email = trim($_POST['email']);
    $username = trim($_POST['username']);
    $password = $_POST['password'];
    $rol_solicitado = $_POST['role'];
    $acepto_terminos = isset($_POST['terms']) ? 1 : 0;

    $response = ['success' => false, 'message' => ''];

    // Validaciones básicas
    if (empty($nombre_completo) || empty($email) || empty($username) || empty($password)) {
        $response['message'] = 'Todos los campos son obligatorios';
        echo json_encode($response);
        exit;
    }

    $conn = getDBConnection();

    // Verificar si existe
    $check_stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ? OR username = ?");
    $check_stmt->bind_param("ss", $email, $username);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();

    if ($check_result->num_rows > 0) {
        $response['message'] = 'El email o usuario ya existen';
        $check_stmt->close();
        $conn->close();
        echo json_encode($response);
        exit;
    }
    $check_stmt->close();

    // SIN HASH - Guardar contraseña directamente
    $insert_stmt = $conn->prepare("INSERT INTO usuarios (nombre_completo, email, username, password, rol_solicitado, acepto_terminos, estado) VALUES (?, ?, ?, ?, ?, ?, 'pendiente')");
    $insert_stmt->bind_param("sssssi", $nombre_completo, $email, $username, $password, $rol_solicitado, $acepto_terminos);

    if ($insert_stmt->execute()) {
        $response['success'] = true;
        $response['message'] = 'Registro exitoso. Espera la aprobación del administrador.';
    } else {
        $response['message'] = 'Error al registrar: ' . $conn->error;
    }

    $insert_stmt->close();
    $conn->close();
    echo json_encode($response);
}
?>