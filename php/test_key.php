<?php
header('Content-Type: text/plain');

// Define la ruta al archivo que queremos leer
$ruta_archivo = '../api/chat_ia.php';

echo "--- VIENDO EL CONTENIDO EXACTO DE: " . $ruta_archivo . " ---\n\n";

// Leer el archivo como texto plano
$contenido = file_get_contents($ruta_archivo);

if ($contenido === false) {
    echo "¡ERROR! No se pudo leer el archivo en la ruta: " . $ruta_archivo;
} else {
    // Imprimir el contenido del archivo
    echo $contenido;
}
?>