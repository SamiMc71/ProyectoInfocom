<?php
// php/login.php - VERSIÓN CORREGIDA
require_once 'config.php'; // Llama a la config con session_start()

header('Content-Type: application/json');

// Comprobar si ya hay una sesión activa
if (isset($_SESSION['loggedin']) && $_SESSION['loggedin'] === true) {
    echo json_encode([
        'success' => true, 
        'message' => 'Ya tienes una sesión activa.',
        'redirect' => '../html/index.html'
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    $response = ['success' => false, 'message' => ''];

    if (empty($username) || empty($password)) {
        $response['message'] = 'Usuario y contraseña son requeridos.';
        echo json_encode($response);
        exit;
    }

    $conn = getDBConnection();
    if (!$conn) {
        $response['message'] = 'Error de conexión a la base de datos.';
        echo json_encode($response);
        exit;
    }

    // Modificamos la consulta para traer los datos que necesitamos
    $stmt = $conn->prepare("SELECT id, username, password, estado, nombre_completo, rol_asignado FROM usuarios WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        
        // COMPARACIÓN DIRECTA (¡Esto no es seguro! Deberías usar password_hash() y password_verify())
        // Lo mantengo así porque tu php/register.php guarda la contraseña en texto plano.
        if ($password === $user['password']) {
            
            if ($user['estado'] !== 'aprobado') {
                $response['message'] = 'Tu cuenta está ' . $user['estado'] . '. Contacta al administrador.';
            } else {
                // ¡AQUÍ ESTÁ LA MAGIA! Guardamos los datos en la sesión
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['nombre_completo'] = $user['nombre_completo']; // <-- Dato agregado
                $_SESSION['rol_asignado'] = $user['rol_asignado'];     // <-- Dato agregado
                $_SESSION['loggedin'] = true;

                // Actualizar último acceso
                $update_stmt = $conn->prepare("UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?");
                $update_stmt->bind_param("i", $user['id']);
                $update_stmt->execute();
                $update_stmt->close();

                $response['success'] = true;
                $response['message'] = 'Inicio de sesión exitoso. Redirigiendo...';
                $response['redirect'] = '../html/index.html';
            }
        } else {
            $response['message'] = 'Contraseña incorrecta';
        }
    } else {
        $response['message'] = 'Usuario no encontrado';
    }

    $stmt->close();
    $conn->close();
    echo json_encode($response);
}
?>