// javascript/auth.js
// SCRIPT CENTRALIZADO de Autenticación, Permisos y Bienvenida

document.addEventListener('DOMContentLoaded', () => {
    // 1. Revisa la sesión y aplica los permisos
    checkSessionAndApplyRoles();
    
    // 2. Configura el botón de cerrar sesión (que está en todas las páginas)
    setupLogoutButton();
});

/**
 * Revisa la sesión del backend, aplica permisos y carga datos del usuario.
 */
async function checkSessionAndApplyRoles() {
    
    // Configurar el menú activo (se ejecuta siempre)
    setActiveMenuItem();

    try {
        const response = await fetch('../php/check_session.php', {
             // Headers para evitar que el navegador guarde en caché la respuesta de la sesión
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error('Error de red al verificar la sesión.');
        }

        const data = await response.json();

        if (!data.success || !data.rol_asignado) {
            // Si no hay sesión exitosa o no tiene rol, se va al login.
            console.log('Sesión no válida o sin rol. Redirigiendo a login.');
            window.location.href = 'loginmejorado.html';
            return;
        }

        // --- INICIO DE LA LÓGICA DE SUPER USUARIO ---
        const role = data.rol_asignado;
        const username = data.username; // Obtenemos el username de la sesión
        const currentPage = window.location.pathname.split('/').pop();
        console.log(`Rol: ${role}, Usuario: ${username} | Página: ${currentPage}`);

        // --- Definir listas de páginas permitidas ---
        
        // Rol SOPORTE: index.html, servicios.html, producto.html
        const soportePages = [
            'index.html', 
            'servicios.html', 
            'producto.html',
            'papelera.html'
        ];
        
        // Rol VENTAS: index.html, cliente.html, producto.html, nuevaventa.html
        const ventasPages = [
            'index.html', 
            'cliente.html', 
            'producto.html', 
            'nuevaventa.html',
            'papelera.html'
        ];
        
        // Rol ADMIN (Normal): Todo EXCEPTO admincuentas.html
        const adminPages = [
            'index.html',
            'cliente.html',
            'servicios.html',
            'producto.html',
            'cotizacion.html',
            'nuevaventa.html',
            'reporte.html',
            'papelera.html'
            // 'admincuentas.html' se omite intencionalmente
        ];

        let allowedPages = null; // null = Super Usuario (acceso total)

        // --- Asignar permisos según el rol ---
        switch (role) {
            case 'soporte':
                allowedPages = soportePages;
                break;
            case 'ventas':
                allowedPages = ventasPages;
                break;
            case 'admin':
                // AQUÍ ESTÁ LA NUEVA LÓGICA:
                // Comprueba si el usuario es "Edson". (Es sensible a mayúsculas)
                if (username === 'Edson') {
                    allowedPages = null; // Es Super Usuario, acceso total
                    console.log("Acceso de SUPER USUARIO concedido.");
                } else {
                    allowedPages = adminPages; // Es Admin normal, acceso restringido
                    console.log("Acceso de ADMIN regular concedido.");
                }
                break;
            default:
                // Rol desconocido o no asignado (ej. 'pendiente')
                console.warn(`Rol desconocido o no autorizado: ${role}. Redirigiendo a login.`);
                alert('Tu cuenta no tiene un rol asignado o está pendiente. Contacta al administrador.');
                window.location.href = 'loginmejorado.html';
                return;
        }
        // --- FIN DE LA LÓGICA DE SUPER USUARIO ---

        // --- Aplicar restricciones (para soporte, ventas, y admin normal) ---
        if (allowedPages !== null) {
            
            // 1. Ocultar enlaces del menú
            document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
                const href = item.getAttribute('href');
                if (!href) return; // Ignora elementos sin href

                const pageName = href.split('/').pop();

                // Muestra solo el botón de logout y las páginas permitidas
                if (item.id === 'logout-btn' || allowedPages.includes(pageName)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });

            // 2. Seguridad de URL: Redirigir si está en una página prohibida
            if (!allowedPages.includes(currentPage)) {
                console.warn(`ACCESO DENEGADO para '${role}' a: ${currentPage}. Redirigiendo.`);
                alert('No tienes permiso para acceder a esta página.');
                window.location.href = 'index.html'; // Redirige a la página principal
                return; 
            }
        }
        
        // --- Si llega aquí, tiene permiso. Cargar datos del usuario y mostrar bienvenida. ---
        loadUserInfo(data);
        
        // Solo mostrar bienvenida en index.html
        if (currentPage === 'index.html' || currentPage === '') {
            showWelcomeModal(data.username);
        }

    } catch (error) {
        console.error('Error fatal de sesión:', error);
        // Si hay cualquier error (ej. API caída), redirigir al login
        window.location.href = 'loginmejorado.html';
    }
}

/**
 * Carga la información del usuario en el header (si los elementos existen).
 */
function loadUserInfo(data) {
    const userNameEl = document.getElementById('user-name');
    const userRoleEl = document.getElementById('user-role');
    const userAvatarEl = document.getElementById('user-avatar');

    if (userNameEl) userNameEl.textContent = data.username || 'Usuario';
    if (userRoleEl) userRoleEl.textContent = data.rol_asignado || 'Rol';
    if (userAvatarEl) {
        const initials = (data.username || 'U').substring(0, 2).toUpperCase();
        userAvatarEl.textContent = initials;
    }
}

/**
 * Configura el botón de cerrar sesión.
 */
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('Cerrando sesión...');
            
            try {
                // Llama al script PHP que destruye la sesión
                await fetch('../php/logout.php');
            } catch (error) {
                console.error('Error al llamar a logout.php:', error);
            } finally {
                // Siempre redirige al login
                sessionStorage.removeItem('welcomeShown'); // Limpia el storage del modal
                window.location.href = 'loginmejorado.html';
            }
        });
    }
}

/**
 * Muestra el modal de bienvenida (lógica movida de index.js)
 */
function showWelcomeModal(userName) {
    if (sessionStorage.getItem('welcomeShown')) {
        return;
    }

    const welcomeModal = document.getElementById('welcome-modal');
    const welcomeTitle = document.getElementById('welcome-title');
    const welcomeMessage = document.getElementById('welcome-message');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    if (!welcomeModal || !welcomeTitle || !welcomeMessage || !modalCloseBtn) {
        return; // No estamos en index.html
    }
    
    welcomeTitle.textContent = `¡Bienvenido, ${userName}!`;
    welcomeMessage.textContent = 'Que tengas un excelente día de trabajo.';
    welcomeModal.style.display = 'flex';
    
    setTimeout(() => {
        welcomeModal.classList.add('show');
    }, 10); 

    const hideModal = () => {
        welcomeModal.classList.remove('show');
        setTimeout(() => {
            welcomeModal.style.display = 'none';
        }, 300);
    };

    setTimeout(hideModal, 4000);
    modalCloseBtn.addEventListener('click', hideModal);
    sessionStorage.setItem('welcomeShown', 'true');
}

/**
 * Establece el elemento del menú activo (lógica movida de index.js)
 */
function setActiveMenuItem() {
    document.querySelectorAll('.menu-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Obtiene el nombre de la página actual (ej. "index.html")
    const currentPage = window.location.pathname.split('/').pop();
    if (!currentPage || currentPage === '') {
        // Estamos en la raíz, activar index.html
        const activeItem = document.querySelector('.menu-item[href*="index.html"]');
        if (activeItem) activeItem.classList.add('active');
    } else {
        // Buscar el enlace que coincida
        const activeItem = document.querySelector(`.menu-item[href*="${currentPage}"]`);
        if (activeItem) activeItem.classList.add('active');
    }
}