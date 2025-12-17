<?php
require_once 'config.php';

header('Content-Type: application/json');

$conn = getDBConnection();

$sql = "SELECT id, nombre_completo, email, username, rol_solicitado, fecha_registro 
        FROM usuarios 
        WHERE estado = 'pendiente' 
        ORDER BY fecha_registro DESC";

$result = $conn->query($sql);

$accounts = array();
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $accounts[] = $row;
    }
}

$conn->close();
echo json_encode($accounts);
?>