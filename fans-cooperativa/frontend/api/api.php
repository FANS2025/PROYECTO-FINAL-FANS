<?php
// C:\xampp\htdocs\fans-cooperativa\frontend\api\api.php

// Habilitar la visualización de errores (SOLO EN DESARROLLO)
// Asegúrate de DESHABILITAR esto en un entorno de producción por seguridad
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Encabezados CORS (permitir que tu frontend acceda a esta API)
header("Access-Control-Allow-Origin: *"); // Permite desde cualquier origen (para desarrollo)
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json"); // Indicamos que la respuesta será JSON

// Manejar solicitudes preflight (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- Configuración de la Base de Datos (¡EDITA ESTO SI ES NECESARIO!) ---
$dbHost = 'localhost';
$dbName = 'fans_cooperativa'; // Nombre de tu base de datos
$dbUser = 'root';
$dbPass = ''; // TU CONTRASEÑA DE LA BASE DE DATOS (déjala vacía si no tienes)

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Error de conexión a la base de datos: ' . $e->getMessage()]);
    exit();
}
// --- Fin de la Configuración de la Base de Datos ---


// Obtener los datos de la solicitud (frontend envía JSON)
$data = json_decode(file_get_contents("php://input"), true);

// Obtener la acción desde el parámetro GET (ej: ?action=register o ?action=login)
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'register':
        $nombre = $data['nombre'] ?? '';
        $apellido = $data['apellido'] ?? '';
        $correo = $data['correo'] ?? '';
        $password = $data['password'] ?? '';
        $fecha_ingreso = $data['fecha_ingreso'] ?? date('Y-m-d');
        $cedula = $data['cedula'] ?? null;
        $telefono = $data['telefono'] ?? null;

        // Validación básica de datos
        if (empty($nombre) || empty($apellido) || empty($correo) || empty($password)) {
            http_response_code(400); // Bad Request
            echo json_encode(['message' => 'Todos los campos obligatorios deben ser completados.']);
            exit();
        }
        if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['message' => 'El formato del correo electrónico es inválido.']);
            exit();
        }
        if (strlen($password) < 8) {
            http_response_code(400);
            echo json_encode(['message' => 'La contraseña debe tener al menos 8 caracteres.']);
            exit();
        }

        // Hashear la contraseña
        $hashed_password = password_hash($password, PASSWORD_BCRYPT);

        try {
            // Verificar si el correo ya existe
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM Residente WHERE Correo = ?");
            $stmt->execute([$correo]);
            if ($stmt->fetchColumn() > 0) {
                http_response_code(409); // Conflict
                echo json_encode(['message' => 'El correo electrónico ya está registrado.']);
                exit();
            }

            // Insertar nuevo usuario. estado_aprobacion por defecto es FALSE (0)
            $stmt = $pdo->prepare("INSERT INTO Residente (Nombre, Apellido, Cedula, Correo, Telefono, Fecha_Ingreso, Contrasena, estado_aprobacion) VALUES (?, ?, ?, ?, ?, ?, ?, FALSE)");
            $stmt->execute([$nombre, $apellido, $cedula, $correo, $telefono, $fecha_ingreso, $hashed_password]);

            http_response_code(201); // Created
            echo json_encode(['message' => 'Registro exitoso. Su cuenta está pendiente de aprobación por un administrador.']);
        } catch (PDOException $e) {
            http_response_code(500); // Internal Server Error
            echo json_encode(['message' => 'Error interno del servidor al registrar: ' . $e->getMessage()]);
        }
        break;

    case 'login':
        $correo = $data['correo'] ?? '';
        $password = $data['password'] ?? '';

        if (empty($correo) || empty($password)) {
            http_response_code(400);
            echo json_encode(['message' => 'Correo y contraseña son requeridos.']);
            exit();
        }

        try {
            $stmt = $pdo->prepare("SELECT id_Residente, Nombre, Apellido, Correo, Cedula, Telefono, Fecha_Ingreso, Contrasena, estado_aprobacion FROM Residente WHERE Correo = ?");
            $stmt->execute([$correo]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['Contrasena'])) {
                if ($user['estado_aprobacion']) {
                    // Eliminar contraseña antes de enviar datos al frontend
                    unset($user['Contrasena']); 
                    http_response_code(200);
                    echo json_encode(['message' => 'Inicio de sesión exitoso.', 'user' => $user]);
                } else {
                    http_response_code(403); // Forbidden
                    echo json_encode(['message' => 'Su cuenta está pendiente de aprobación por un administrador.']);
                }
            } else {
                http_response_code(401); // Unauthorized
                echo json_encode(['message' => 'Credenciales inválidas.']);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error interno del servidor al iniciar sesión: ' . $e->getMessage()]);
        }
        break;

    // --- Acciones para el Backoffice ---

    case 'pending_users': // Obtener lista de usuarios pendientes de aprobación
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            try {
                $stmt = $pdo->query("SELECT id_Residente, Nombre, Apellido, Correo, Fecha_Ingreso, fecha_registro FROM Residente WHERE estado_aprobacion = FALSE");
                $pendingUsers = $stmt->fetchAll();
                http_response_code(200);
                echo json_encode(['message' => 'Usuarios pendientes obtenidos.', 'users' => $pendingUsers]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['message' => 'Error al obtener usuarios pendientes: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(405); // Método no permitido
            echo json_encode(['message' => 'Método no permitido. Use GET para obtener usuarios pendientes.']);
        }
        break;

    case 'approve_user': // Aprobar un usuario por ID
        if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
            // El ID del usuario viene en el parámetro GET 'id' (ej. ?action=approve_user&id=123)
            $userId = $_GET['id'] ?? null; 

            if (!$userId || !is_numeric($userId)) {
                http_response_code(400); // Bad Request
                echo json_encode(['message' => 'ID de usuario para aprobar no proporcionado o inválido.']);
                exit();
            }
            
            try {
                $stmt = $pdo->prepare("UPDATE Residente SET estado_aprobacion = TRUE WHERE id_Residente = ?");
                $stmt->execute([$userId]);

                if ($stmt->rowCount() > 0) {
                    http_response_code(200);
                    echo json_encode(['message' => 'Usuario aprobado exitosamente.']);
                } else {
                    http_response_code(404); // Not Found si el ID no existe o ya estaba aprobado
                    echo json_encode(['message' => 'Usuario no encontrado o ya aprobado.']);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['message' => 'Error al aprobar usuario: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(405); // Método no permitido
            echo json_encode(['message' => 'Método no permitido. Use PUT para aprobar usuarios.']);
        }
        break;

    default:
        http_response_code(400); // Bad Request
        echo json_encode(['message' => 'Acción no especificada o no válida.']);
        break;
}
?>