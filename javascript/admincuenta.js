//
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const pendingAccountsBody = document.getElementById('pendingAccountsBody');
    const allAccountsBody = document.getElementById('allAccountsBody');
    const approvalModal = document.getElementById('approvalModal');
    const editAccountModal = document.getElementById('editAccountModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const editModalCloseBtn = document.getElementById('editModalCloseBtn');
    const rejectBtn = document.getElementById('rejectBtn');
    const approveBtn = document.getElementById('approveBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const saveEditBtn = document.getElementById('saveEditBtn');
    const refreshPendingBtn = document.getElementById('refreshPending');
    const refreshAllBtn = document.getElementById('refreshAll');
    const toggleEditPassword = document.getElementById('toggleEditPassword');
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    const roleOptions = document.querySelectorAll('.role-option');
    const logoutBtn = document.getElementById('logout-btn');
    
    let currentAccountId = null;
    let allAccounts = [];
    
    // Función para activar el elemento correcto en el sidebar
    function activateCurrentMenuItem() {
        // Remover clase active de todos los elementos
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Agregar clase active al elemento actual
        const currentPage = window.location.pathname.split('/').pop();
        const currentMenuItem = document.querySelector(`.menu-item[href*="${currentPage}"]`);
        
        if (currentMenuItem) {
            currentMenuItem.classList.add('active');
        }
    }
    
    // Cargar cuentas pendientes desde la API
    function loadPendingAccounts() {
        console.log('Cargando cuentas pendientes...');
        fetch('../php/get_pending_accounts.php')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }
                return response.json();
            })
            .then(accounts => {
                console.log('Cuentas pendientes recibidas:', accounts);
                pendingAccountsBody.innerHTML = '';
                
                if (!accounts || accounts.length === 0) {
                    pendingAccountsBody.innerHTML = `
                        <tr>
                            <td colspan="6" class="table-empty">
                                <i class="fas fa-inbox"></i>
                                <p>No hay cuentas pendientes de aprobación</p>
                            </td>
                        </tr>
                    `;
                    return;
                }
                
                accounts.forEach(account => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${account.username || 'N/A'}</td>
                        <td>${account.email || 'N/A'}</td>
                        <td>${account.nombre_completo || 'N/A'}</td>
                        <td><span class="status-badge role-${account.rol_solicitado || 'N/A'}">${account.rol_solicitado || 'N/A'}</span></td>
                        <td>${account.fecha_registro ? formatDate(account.fecha_registro) : 'N/A'}</td>
                        <td>
                            <div class="actions">
                                <button class="btn btn-primary btn-sm approve-account" data-id="${account.id}">
                                    <i class="fas fa-check"></i>
                                    <span>Aprobar</span>
                                </button>
                                <button class="btn btn-danger btn-sm reject-account" data-id="${account.id}">
                                    <i class="fas fa-times"></i>
                                    <span>Rechazar</span>
                                </button>
                            </div>
                        </td>
                    `;
                    pendingAccountsBody.appendChild(row);
                });
                
                // Agregar event listeners a los botones
                document.querySelectorAll('.approve-account').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const accountId = this.getAttribute('data-id');
                        console.log('Aprobar cuenta ID:', accountId);
                        openApprovalModal(accountId, 'approve');
                    });
                });
                
                document.querySelectorAll('.reject-account').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const accountId = this.getAttribute('data-id');
                        console.log('Rechazar cuenta ID:', accountId);
                        rejectAccount(accountId);
                    });
                });
            })
            .catch(error => {
                console.error('Error al cargar cuentas pendientes:', error);
                showNotification('Error al cargar cuentas pendientes', 'error');
                pendingAccountsBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="table-empty">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>Error al cargar las cuentas pendientes</p>
                        </td>
                    </tr>
                `;
            });
    }
    
    // Cargar todas las cuentas desde la API
    function loadAllAccounts() {
        console.log('Cargando todas las cuentas...');
        fetch('../php/get_all_accounts.php')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }
                return response.json();
            })
            .then(accounts => {
                console.log('Todas las cuentas recibidas:', accounts);
                allAccounts = accounts;
                allAccountsBody.innerHTML = '';
                
                if (!accounts || accounts.length === 0) {
                    allAccountsBody.innerHTML = `
                        <tr>
                            <td colspan="7" class="table-empty">
                                <i class="fas fa-inbox"></i>
                                <p>No hay cuentas registradas</p>
                            </td>
                        </tr>
                        `;
                    return;
                }
                
                accounts.forEach(account => {
                    console.log('Procesando cuenta:', account.username);
                    
                    const statusClass = account.estado === 'aprobado' ? 'status-completed' : 
                                      account.estado === 'pendiente' ? 'status-pending' : 'status-cancelled';
                    
                    const role = account.rol_asignado || account.rol_solicitado || 'N/A';
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${account.username || 'N/A'}</td>
                        <td>${account.email || 'N/A'}</td>
                        <td>${account.nombre_completo || 'N/A'}</td>
                        <td><span class="status-badge role-${role}">${role}</span></td>
                        <td><span class="status-badge ${statusClass}">${account.estado || 'N/A'}</span></td>
                        
                        <td class="password-cell">
                            <span class="password-text">********</span>
                            <button class="btn btn-outline btn-sm toggle-pass" data-password="${account.password || ''}" title="Mostrar/Ocultar">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                        <td>
                            <div class="actions">
                                <button class="btn btn-outline btn-sm edit-account" data-id="${account.id}">
                                    <i class="fas fa-edit"></i>
                                    <span>Editar</span>
                                </button>
                                <button class="btn btn-danger btn-sm delete-account" data-id="${account.id}">
                                    <i class="fas fa-trash"></i>
                                    <span>Eliminar</span>
                                </button>
                            </div>
                        </td>
                    `;
                    allAccountsBody.appendChild(row);
                });
                
                // --- INICIO CORRECCIÓN: Listeners para los botones de ojo ---
                document.querySelectorAll('.toggle-pass').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const passwordTextSpan = this.previousElementSibling;
                        const icon = this.querySelector('i');
                        const realPassword = this.getAttribute('data-password');

                        if (passwordTextSpan.textContent === '********') {
                            passwordTextSpan.textContent = realPassword;
                            icon.className = 'fas fa-eye-slash';
                        } else {
                            passwordTextSpan.textContent = '********';
                            icon.className = 'fas fa-eye';
                        }
                    });
                });
                // --- FIN CORRECCIÓN ---

                // Agregar event listeners a los botones
                document.querySelectorAll('.edit-account').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const accountId = this.getAttribute('data-id');
                        console.log('Editar cuenta ID:', accountId);
                        openEditModal(accountId);
                    });
                });
                
                document.querySelectorAll('.delete-account').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const accountId = this.getAttribute('data-id');
                        console.log('Eliminar cuenta ID:', accountId);
                        deleteAccount(accountId);
                    });
                });
            })
            .catch(error => {
                console.error('Error al cargar todas las cuentas:', error);
                showNotification('Error al cargar todas las cuentas', 'error');
                allAccountsBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="table-empty">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>Error al cargar las cuentas</p>
                        </td>
                    </tr>
                    `;
            });
    }
    
    // Función para formatear fechas (usada en pendientes)
    function formatDate(dateString) {
        console.log('Intentando formatear fecha:', dateString);
        
        if (!dateString || dateString === 'NULL' || dateString === 'null' || dateString === '0000-00-00 00:00:00') {
            console.log('Fecha inválida o vacía:', dateString);
            return 'Nunca';
        }
        
        try {
            const isoString = dateString.replace(' ', 'T');
            const date = new Date(isoString);
            
            if (isNaN(date.getTime())) {
                console.log('Fecha inválida (NaN):', dateString);
                return 'Nunca';
            }
            
            const formatted = date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            console.log('Fecha formateada correctamente:', dateString, '->', formatted);
            return formatted;
            
        } catch (error) {
            console.error('Error formateando fecha:', dateString, error);
            return 'Nunca';
        }
    }
    
    // Abrir modal de aprobación
    function openApprovalModal(accountId, action) {
        console.log('Abriendo modal de aprobación para cuenta ID:', accountId);
        currentAccountId = accountId;
        
        if (action === 'approve') {
            document.getElementById('approvalMessage').textContent = 
                `¿Estás seguro de que deseas aprobar esta cuenta?`;
            
            // Resetear selección de roles
            document.querySelectorAll('.role-option').forEach(option => {
                option.classList.remove('selected');
                option.querySelector('input').checked = false;
            });
            
            approvalModal.style.display = 'flex';
            setTimeout(() => {
                approvalModal.classList.add('show');
            }, 10);
            console.log('Modal de aprobación mostrado');
        }
    }
    
    // Abrir modal de edición
    function openEditModal(accountId) {
        console.log('=== ABRIENDO MODAL DE EDICIÓN ===');
        console.log('ID de cuenta:', accountId);
        
        currentAccountId = accountId;
        
        // Buscar la cuenta
        const account = allAccounts.find(acc => acc.id == accountId);
        console.log('Cuenta encontrada:', account);
        
        if (!account) {
            console.error('No se encontró la cuenta con ID:', accountId);
            showNotification('Error: No se encontró la cuenta', 'error');
            return;
        }
        
        // Llenar el formulario
        document.getElementById('editUsername').value = account.username || '';
        document.getElementById('editEmail').value = account.email || '';
        document.getElementById('editPassword').value = '';
        
        // Seleccionar el rol actual
        const roleValue = account.rol_asignado || account.rol_solicitado || 'ventas';
        console.log('Rol a seleccionar:', roleValue);
        
        let roleSelected = false;
        document.querySelectorAll('.role-option').forEach(option => {
            const input = option.querySelector('input');
            option.classList.remove('selected');
            input.checked = false;
            
            if (option.getAttribute('data-role') === roleValue) {
                option.classList.add('selected');
                input.checked = true;
                roleSelected = true;
                console.log('Rol seleccionado correctamente:', roleValue);
            }
        });
        
        if (!roleSelected) {
            console.warn('No se pudo seleccionar el rol específico, seleccionando ventas por defecto');
            const ventasOption = document.querySelector('.role-option[data-role="ventas"]');
            if (ventasOption) {
                ventasOption.classList.add('selected');
                ventasOption.querySelector('input').checked = true;
            }
        }
        
        // Mostrar el modal
        editAccountModal.style.display = 'flex';
        setTimeout(() => {
            editAccountModal.classList.add('show');
        }, 10);
        console.log('Modal de edición mostrado correctamente');
    }
    
    // Cerrar modal de aprobación
    function closeApprovalModal() {
        approvalModal.classList.remove('show');
        setTimeout(() => {
            approvalModal.style.display = 'none';
        }, 300);
    }
    
    // Cerrar modal de edición
    function closeEditModal() {
        editAccountModal.classList.remove('show');
        setTimeout(() => {
            editAccountModal.style.display = 'none';
        }, 300);
    }
    
    // Aprobar cuenta
    function approveAccount() {
        const selectedRole = document.querySelector('input[name="approvalRole"]:checked');
        
        if (!selectedRole) {
            showNotification('Debes seleccionar un rol para la cuenta', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('user_id', currentAccountId);
        formData.append('action', 'approve');
        formData.append('rol_asignado', selectedRole.value);
        
        console.log('Enviando aprobación para cuenta ID:', currentAccountId, 'con rol:', selectedRole.value);
        
        fetch('../php/update_account_status.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log('Respuesta de aprobación:', data);
            if (data.success) {
                showNotification(data.message, 'success');
                closeApprovalModal();
                
                // Recargar las tablas
                loadPendingAccounts();
                loadAllAccounts();
            } else {
                showNotification(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error al aprobar la cuenta', 'error');
        });
    }
    
    // Rechazar cuenta
    function rejectAccount(accountId) {
        if (confirm('¿Estás seguro de que deseas rechazar esta cuenta?')) {
            const formData = new FormData();
            formData.append('user_id', accountId);
            formData.append('action', 'reject');
            
            console.log('Enviando rechazo para cuenta ID:', accountId);
            
            fetch('../php/update_account_status.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                console.log('Respuesta de rechazo:', data);
                if (data.success) {
                    showNotification(data.message, 'warning');
                    
                    // Recargar las tablas
                    loadPendingAccounts();
                    loadAllAccounts();
                } else {
                    showNotification(data.message, 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Error al rechazar la cuenta', 'error');
            });
        }
    }
    
    // Eliminar cuenta
    function deleteAccount(accountId) {
        if (confirm('¿Estás seguro de que deseas eliminar esta cuenta? Esta acción no se puede deshacer.')) {
            const formData = new FormData();
            formData.append('user_id', accountId);
            formData.append('action', 'delete');
            
            console.log('Enviando eliminación para cuenta ID:', accountId);
            
            fetch('../php/update_account_status.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                console.log('Respuesta de eliminación:', data);
                if (data.success) {
                    showNotification('Cuenta eliminada correctamente', 'success');
                    loadAllAccounts();
                } else {
                    showNotification(data.message, 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Error al eliminar la cuenta', 'error');
            });
        }
    }
    
    // Guardar cambios de edición
    function saveAccountChanges() {
        const username = document.getElementById('editUsername').value;
        const email = document.getElementById('editEmail').value;
        const password = document.getElementById('editPassword').value;
        const selectedRole = document.querySelector('input[name="editRole"]:checked');
        
        if (!username || !email) {
            showNotification('Usuario y email son obligatorios', 'error');
            return;
        }
        
        if (!selectedRole) {
            showNotification('Debes seleccionar un rol', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('user_id', currentAccountId);
        formData.append('username', username);
        formData.append('email', email);
        formData.append('rol_asignado', selectedRole.value);
        
        if (password) {
            formData.append('password', password);
        }
        
        console.log('Guardando cambios para cuenta ID:', currentAccountId, 'Datos:', {
            username, email, rol: selectedRole.value, password: password ? '***' : 'no cambiada'
        });
        
        fetch('../php/update_account.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log('Respuesta de actualización:', data);
            if (data.success) {
                showNotification(data.message, 'success');
                closeEditModal();
                
                // Recargar las tablas
                loadAllAccounts();
            } else {
                showNotification(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error al actualizar la cuenta', 'error');
        });
    }
    
    // Mostrar notificación
    function showNotification(message, type) {
        notificationText.textContent = message;
        notification.className = `notification ${type}`;
        
        // Cambiar icono según el tipo de notificación
        const icon = notification.querySelector('i');
        if (type === 'success') {
            icon.className = 'fas fa-check-circle';
        } else if (type === 'warning') {
            icon.className = 'fas fa-exclamation-triangle';
        } else {
            icon.className = 'fas fa-exclamation-circle';
        }
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Event Listeners
    modalCloseBtn.addEventListener('click', closeApprovalModal);
    editModalCloseBtn.addEventListener('click', closeEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);
    
    approveBtn.addEventListener('click', approveAccount);
    
    rejectBtn.addEventListener('click', function() {
        if (currentAccountId) {
            rejectAccount(currentAccountId);
            closeApprovalModal();
        }
    });
    
    saveEditBtn.addEventListener('click', saveAccountChanges);
    
    refreshPendingBtn.addEventListener('click', function() {
        loadPendingAccounts();
        showNotification('Lista de cuentas pendientes actualizada', 'success');
    });
    
    refreshAllBtn.addEventListener('click', function() {
        loadAllAccounts();
        showNotification('Lista de todas las cuentas actualizada', 'success');
    });
    
    // Toggle para mostrar/ocultar contraseña en modal de edición
    toggleEditPassword.addEventListener('click', function() {
        const input = document.getElementById('editPassword');
        const icon = this.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    });
    
    // Event listeners para opciones de rol
    roleOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remover selección de todos los elementos del grupo
            const group = this.closest('.role-options');
            group.querySelectorAll('.role-option').forEach(item => {
                item.classList.remove('selected');
            });
            
            // Seleccionar el elemento actual
            this.classList.add('selected');
            this.querySelector('input').checked = true;
        });
    });
    
    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', function(e) {
        if (e.target === approvalModal) {
            closeApprovalModal();
        }
        if (e.target === editAccountModal) {
            closeEditModal();
        }
    });
    
    // Logout
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            window.location.href = 'login.html';
        }
    });
    
    // Inicializar la interfaz
    activateCurrentMenuItem();
    loadPendingAccounts();
    loadAllAccounts();
    
    console.log('Sistema de administración de cuentas inicializado correctamente');
});