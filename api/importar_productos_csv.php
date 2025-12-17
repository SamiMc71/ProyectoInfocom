<?php
// inventario_infocom/api/importar_productos_csv.php

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Se incluye la configuración de conexión a la base de datos
include_once '../php/config.php';

$db = getDBConnection();

if ($db === null) {
    error_log("IMPORT ERROR: No se pudo conectar a la base de datos.");
    http_response_code(500);
    echo json_encode(["error" => "Error fatal: No se pudo conectar a la base de datos."]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
    exit();
}

if (!isset($_FILES['csv_file']) || $_FILES['csv_file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(["error" => "No se ha subido ningún archivo o ha ocurrido un error."]);
    exit();
}

$file = $_FILES['csv_file']['tmp_name'];
$mime = mime_content_type($file);
$filename = $_FILES['csv_file']['name']; 

// =========================================================================================
// ADAPTACIÓN 1: CORRECCIÓN DE VALIDACIÓN MIME para aceptar Excel/Tabulaciones
// =========================================================================================
$allowed_mimes = [
    'text/csv', 
    'text/plain', 
    'text/tab-separated-values',
    'application/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
    'application/excel',
    'application/octet-stream'
];

$is_valid = false;
$extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
$allowed_extensions = ['csv', 'tsv', 'xls', 'xlsx', 'txt'];

if (in_array($mime, $allowed_mimes)) {
    $is_valid = true;
} elseif (in_array($extension, $allowed_extensions)) {
    $is_valid = true;
}

if (!$is_valid) {
    http_response_code(400);
    error_log("IMPORT ERROR: Archivo inválido. MIME: " . $mime . ", Extensión: " . $extension);
    echo json_encode(["error" => "Tipo de archivo inválido. Solo se permiten CSV/Excel. (MIME detectado: " . $mime . ", Extensión: " . $extension . ")"]);
    exit();
}
// =========================================================================================


function getNextProductId($db) {
    $last_id_query = "SELECT MAX(CAST(SUBSTRING(id, 2) AS UNSIGNED)) as max_id FROM productos";
    $result = $db->query($last_id_query);
    if (!$result) {
        return 'P001'; 
    }
    $row = $result->fetch_assoc();
    $last_id = $row['max_id'] ?? 0;
    return 'P' . str_pad($last_id + 1, 3, '0', STR_PAD_LEFT);
}

// =========================================================================================
// CORRECCIÓN CRÍTICA: Eliminar saltos de línea para evitar que fgetcsv falle
// =========================================================================================
function cleanDescription($text) {
    if (strpos($text, '{') === 0 && strpos(trim($text), '}') === (strlen(trim($text)) - 1)) {
        $data = json_decode($text, true);
        if ($data) {
            $text = $data['content'] ?? $text;
        }
    }
    // Reemplazar saltos de línea por un separador simple o espacio (soluciona la importación)
    $text = str_replace(["\r", "\n", "\r\n"], ' | ', $text); 

    return strip_tags($text, '<ul><li><strong>');
}
// =========================================================================================

$processed_count = 0;
$skipped_count = 0;
$row_counter = 0;

try {
    // Abrir el archivo CSV. Usamos el delimitador TAB (\t) de tu archivo.
    if (($handle = fopen($file, "r")) !== FALSE) {
        // [CORRECCIÓN PRINCIPAL] USAR EL CARACTER DE ENCLOSURE (") para leer archivos de Excel correctamente.
        $enclosure = '\"'; 
        
        // Leer la primera línea para omitir el encabezado
        $header_line = fgetcsv($handle, 0, "\t", $enclosure); 

        $query = "INSERT INTO productos 
                  (id, nombre, descripcion, marca, categoria, stock, precio, imagen, estado) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'activo')";
                  
        $stmt = $db->prepare($query);

        if (!$stmt) {
            error_log("IMPORT ERROR: Fallo al preparar consulta: " . $db->error);
            throw new Exception("Error al preparar la consulta: " . $db->error);
        }
        
        while (($data = fgetcsv($handle, 0, "\t", $enclosure)) !== FALSE) {
            $row_counter++;

            // Mapeo de columnas: Nombre(0), Descripción(1), Marca(2), Categoría(3), Stock(4), Precio(5), Imagen(6)
            
            // Validaciones (usando los índices 0 y 5 del nuevo formato)
            if (!isset($data[0]) || !isset($data[5]) || empty(trim($data[0])) || !is_numeric($data[5])) {
                
                // Saltar filas que son completamente vacías
                $is_empty_row = true;
                foreach ($data as $cell) {
                    if (!empty(trim($cell))) {
                        $is_empty_row = false;
                        break;
                    }
                }
                if ($is_empty_row) {
                    continue; 
                }
                
                // Si la fila no está vacía pero falla la validación
                $skipped_count++;
                error_log("IMPORT SKIP (Row $row_counter): Validación fallida - Nombre vacío o Precio no numérico. Data: " . print_r($data, true));
                continue;
            }
            
            // Si la fila es muy corta (posiblemente un error de formato)
            if (count($data) < 7) { 
                // Advertencia si la fila tiene menos de 7 columnas de datos
                if(count($data) < 4) { 
                    $skipped_count++;
                    error_log("IMPORT SKIP (Row $row_counter): Número de columnas insuficiente. Encontrado " . count($data));
                    continue;
                }
            }

            $new_id = getNextProductId($db); 

            $nombre = trim($data[0]);
            $descripcion = cleanDescription($data[1] ?? ''); // Usar cleanDescription aquí
            $marca = trim($data[2] ?? 'Sin Marca');
            $categoria = trim($data[3] ?? 'General');
            $stock = (int)($data[4] ?? 0);
            $precio = (float)($data[5] ?? 0.0);
            $imagen = trim($data[6] ?? 'https://via.placeholder.com/150');
            
            $stmt->bind_param("sssssids", 
                $new_id,
                $nombre,
                $descripcion,
                $marca,
                $categoria,
                $stock,
                $precio,
                $imagen
            );
            
            if($stmt->execute()) {
                $processed_count++;
            } else {
                error_log("IMPORT EXECUTE ERROR (Row $row_counter, ID: $new_id): " . $stmt->error);
                $skipped_count++;
            }
        }
        
        $stmt->close();
        fclose($handle);
        
        echo json_encode([
            "message" => "Importación finalizada.", 
            "total_procesados" => $processed_count,
            "total_omitidos" => $skipped_count
        ], JSON_UNESCAPED_UNICODE);

    } else {
        http_response_code(500);
        error_log("IMPORT ERROR: No se pudo abrir el archivo de subida.");
        echo json_encode(["error" => "No se pudo abrir el archivo de subida."]);
    }

} catch (Exception $e) {
    http_response_code(500);
    error_log("IMPORT SERVER ERROR: " . $e->getMessage());
    echo json_encode(["error" => "Error interno del servidor durante la importación: " . $e->getMessage()]);
}
?>