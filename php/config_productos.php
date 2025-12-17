<?php
// config_productos.php - Configuración específica para productos
class DatabaseProductos {
    private $host = 'localhost';
    private $db_name = 'inventario_digital';
    private $username = 'root';
    private $password = '';
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new mysqli($this->host, $this->username, $this->password, $this->db_name);
            
            if ($this->conn->connect_error) {
                throw new Exception("Error de conexión: " . $this->conn->connect_error);
            }
            
            $this->conn->set_charset("utf8");
        } catch (Exception $exception) {
            error_log("Error de conexión productos: " . $exception->getMessage());
            return null;
        }
        return $this->conn;
    }
}
?>