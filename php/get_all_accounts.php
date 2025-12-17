
<?php
require_once 'config.php';

header('Content-Type: application/json');

$conn = getDBConnection();

// --- INICIO CORRECCIÓN: Añadido 'password' a la consulta ---
$sql = "SELECT id, username, email, nombre_completo, rol_solicitado, rol_asignado, estado, fecha_registro, password 
        FROM usuarios 
        ORDER BY fecha_registro DESC";
// --- FIN CORRECCIÓN ---

$result = $conn->query($sql);

$accounts = array();
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        
        $accounts[] = array(
            'id' => $row['id'],
            'username' => $row['username'],
            'email' => $row['email'],
            'nombre_completo' => $row['nombre_completo'],
            'rol_solicitado' => $row['rol_solicitado'],
            'rol_asignado' => $row['rol_asignado'],
            'estado' => $row['estado'],
            'fecha_registro' => $row['fecha_registro'],
            // --- INICIO CORRECCIÓN: Añadido 'password' al array ---
            'password' => $row['password']
            // --- FIN CORRECCIÓN ---
        );
    }
} else {
    $accounts = array();
}

$conn->close();
echo json_encode($accounts);
?>