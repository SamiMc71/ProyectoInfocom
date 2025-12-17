<?php
require_once 'config.php'; // Llama a la config con session_start()

// --- INICIO DE CORRECCIÓN ---
// Headers anti-caché. Esto le dice al navegador que NUNCA guarde
// esta respuesta y siempre pregunte al servidor por la sesión real.
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
// --- FIN DE CORRECCIÓN ---

$response = [
    'success' => false,
    'message' => 'No hay sesión iniciada.'
];

if (isset($_SESSION['loggedin']) && $_SESSION['loggedin'] === true) {
    // Leemos los datos correctos de la sesión
    $response['success'] = true;
    $response['user_id'] = $_SESSION['user_id'] ?? null;
    $response['username'] = $_SESSION['username'] ?? 'Usuario';
    $response['nombre_completo'] = $_SESSION['nombre_completo'] ?? 'Usuario'; // <-- Dato nuevo
    $response['rol_asignado'] = $_SESSION['rol_asignado'] ?? 'Sin rol';      // <-- Dato nuevo
    $response['message'] = 'Sesión activa.';
}

echo json_encode($response);
?>