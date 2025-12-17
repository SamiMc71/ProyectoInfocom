<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Incluir configuración de la base de datos
require_once '../php/config.php'; 

// Para debug
error_log("Dashboard API called with action: " . ($_GET['action'] ?? 'none'));

$action = $_GET['action'] ?? '';

if ($action === 'stats') {
    getDashboardStats();
} elseif ($action === 'sales_today') {
    getTodaySales();
} elseif ($action === 'services_today') { // ***** NUEVA ACCIÓN *****
    getTodayServices();
} else {
    echo json_encode(['success' => false, 'message' => 'Acción no válida: ' . $action]);
    error_log("Acción no válida: " . $action);
}

function getDashboardStats() {
    $conn = getDBConnection();
    
    if ($conn === null) {
        $error = 'Error de conexión a BD';
        error_log($error);
        echo json_encode(['success' => false, 'message' => $error]);
        return;
    }
    
    $today = date('Y-m-d');
    error_log("Calculando estadísticas para: " . $today);
    
    try {
        // Clientes registrados hoy
        $clients_today = getCount($conn, "SELECT COUNT(*) as count FROM clientes WHERE DATE(fecha_creacion) = '$today'");
        error_log("Clientes hoy: " . $clients_today);
        
        // Productos vendidos hoy
        $products_today = getCount($conn, 
            "SELECT COALESCE(SUM(dv.cantidad), 0) as total 
             FROM detalle_venta dv 
             JOIN ventas v ON dv.venta_id = v.id 
             WHERE DATE(v.fecha_venta) = '$today' AND v.estado = 'COMPLETADA'"
        );
        error_log("Productos vendidos hoy: " . $products_today);
        
        // Ingresos hoy (Ventas + Servicios)
        $income_sales = getCount($conn, "SELECT COALESCE(SUM(total), 0) as total FROM ventas WHERE DATE(fecha_venta) = '$today' AND estado = 'COMPLETADA'");
        $income_services = getCount($conn, "SELECT COALESCE(SUM(total), 0) as total FROM servicios_tecnicos WHERE DATE(fecha_ingreso) = '$today' AND (estado = 'entregado' OR estado = 'completado')");
        $income_today = $income_sales + $income_services;
        error_log("Ingresos hoy: " . $income_today);
        
        // Cotizaciones hoy
        $quotations_today = getCount($conn, "SELECT COUNT(*) as count FROM cotizaciones WHERE DATE(fecha_creacion) = '$today'");
        error_log("Cotizaciones hoy: " . $quotations_today);

        // ***** NUEVO CONTEO DE SERVICIOS *****
        $services_today = getCount($conn, "SELECT COUNT(*) as count FROM servicios_tecnicos WHERE DATE(fecha_ingreso) = '$today'");
        error_log("Servicios hoy: " . $services_today);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'clients_today' => (int)$clients_today,
                'products_sold_today' => (int)$products_today,
                'income_today' => (float)$income_today,
                'quotations_today' => (int)$quotations_today,
                'services_today' => (int)$services_today // <-- Nuevo dato
            ]
        ]);
        
        error_log("Estadísticas enviadas correctamente");
        
    } catch (Exception $e) {
        $error = 'Error: ' . $e->getMessage();
        error_log($error);
        echo json_encode(['success' => false, 'message' => $error]);
    } finally {
        $conn->close();
    }
}

function getTodaySales() {
    $conn = getDBConnection();
    
    if ($conn === null) {
        $error = 'Error de conexión a BD';
        error_log($error);
        echo json_encode(['success' => false, 'message' => $error]);
        return;
    }
    
    $today = date('Y-m-d');
    error_log("Buscando ventas para: " . $today);
    
    try {
        $sql = "
            SELECT 
                v.id,
                v.tipo_comprobante,
                v.numero_comprobante,
                v.total,
                v.fecha_venta,
                v.estado,
                c.nombres as cliente_nombre,
                c.apellidos as cliente_apellidos,
                (SELECT COALESCE(SUM(cantidad), 0) FROM detalle_venta dv WHERE dv.venta_id = v.id) as cantidad_total,
                (SELECT p.nombre FROM detalle_venta dv 
                 JOIN productos p ON dv.producto_id = p.id 
                 WHERE dv.venta_id = v.id LIMIT 1) as primer_producto
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            WHERE DATE(v.fecha_venta) = '$today'
            ORDER BY v.fecha_venta DESC
        ";
        
        $result = $conn->query($sql);
        $sales = [];
        
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $cliente_nombre = trim(($row['cliente_nombre'] ?? '') . ' ' . ($row['cliente_apellidos'] ?? ''));
                if (empty(trim($cliente_nombre))) {
                    $cliente_nombre = 'Cliente no especificado';
                }
                
                $productos_venta = $row['primer_producto'] ? $row['primer_producto'] : 'Producto no especificado';
                
                $sales[] = [
                    'id' => $row['id'],
                    'numero_comprobante' => $row['numero_comprobante'],
                    'total' => $row['total'],
                    'fecha_venta' => $row['fecha_venta'],
                    'estado' => $row['estado'],
                    'cliente_nombre' => $cliente_nombre,
                    'cantidad_total' => $row['cantidad_total'],
                    'primer_producto' => $productos_venta
                ];
            }
        }
        
        echo json_encode([
            'success' => true,
            'data' => $sales
        ]);
        
    } catch (Exception $e) {
        $error = 'Error: ' . $e->getMessage();
        error_log($error);
        echo json_encode(['success' => false, 'message' => $error]);
    } finally {
        $conn->close();
    }
}

// ***** NUEVA FUNCIÓN PARA OBTENER SERVICIOS DE HOY *****
function getTodayServices() {
    $conn = getDBConnection();
    
    if ($conn === null) {
        $error = 'Error de conexión a BD';
        error_log($error);
        echo json_encode(['success' => false, 'message' => $error]);
        return;
    }
    
    $today = date('Y-m-d');
    error_log("Buscando servicios para: " . $today);
    
    try {
        $sql = "
            SELECT 
                id,
                cliente_nombre,
                equipo_nombre,
                estado,
                fecha_ingreso
            FROM servicios_tecnicos
            WHERE DATE(fecha_ingreso) = '$today'
            ORDER BY fecha_ingreso DESC
        ";
        
        $result = $conn->query($sql);
        $services = [];
        
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $services[] = $row;
            }
        }
        
        echo json_encode([
            'success' => true,
            'data' => $services
        ]);
        
    } catch (Exception $e) {
        $error = 'Error: ' . $e->getMessage();
        error_log($error);
        echo json_encode(['success' => false, 'message' => $error]);
    } finally {
        $conn->close();
    }
}

function getCount($conn, $sql) {
    $result = $conn->query($sql);
    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        return $row['count'] ?? $row['total'] ?? 0;
    }
    return 0;
}
?>