<?php
// inventario_infocom/api/descargar_reporte.php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // 1. Obtener los datos JSON enviados desde JS
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        http_response_code(400);
        echo "Error: No se recibieron datos válidos.";
        exit;
    }

    // 2. Definir rutas temporales
    $tempDir = sys_get_temp_dir();
    $timestamp = time();
    $jsonFile = $tempDir . "/reporte_{$timestamp}.json";
    $pdfFile = $tempDir . "/reporte_{$timestamp}.pdf";
    
    // Ruta al script de python (AJUSTA ESTA RUTA SEGÚN TU INSTALACIÓN)
    // __DIR__ apunta a /api, así que subimos un nivel y entramos a python
    $pythonScript = __DIR__ . "/../python/generar_reporte.py"; 

    // 3. Guardar JSON temporal
    file_put_contents($jsonFile, json_encode($data));

    // 4. Ejecutar Python
    // NOTA: Si 'python' no funciona, prueba con la ruta completa ej: "C:\\Python39\\python.exe"
    $command = "python \"$pythonScript\" \"$jsonFile\" \"$pdfFile\" 2>&1";
    $output = shell_exec($command);

    // 5. Verificar si se creó el PDF y enviarlo
    if (file_exists($pdfFile)) {
        header('Content-Description: File Transfer');
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="Reporte_Ventas.pdf"');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . filesize($pdfFile));
        
        readfile($pdfFile);

        // 6. Limpieza
        unlink($jsonFile);
        unlink($pdfFile);
        exit;
    } else {
        http_response_code(500);
        echo "Error al generar el PDF con Python. Debug: " . $output;
        // Limpieza en caso de error
        if(file_exists($jsonFile)) unlink($jsonFile);
    }
} else {
    echo "Método no permitido";
}
?>