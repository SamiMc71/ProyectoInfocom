//
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('registerForm');
  const notification = document.getElementById('notification');
  const notificationText = document.getElementById('notification-text');
  // const roleOptions = document.querySelectorAll('.role-option'); // ELIMINADO
  const approvalModal = document.getElementById('approvalModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  
  // Selección de roles con estilo visual: ELIMINADO
  /*
  roleOptions.forEach(option => {
    option.addEventListener('click', function() {
      const radio = this.querySelector('input[type="radio"]');
      radio.checked = true;
      
      // Remover clase selected de todas las opciones
      roleOptions.forEach(opt => opt.classList.remove('selected'));
      
      // Agregar clase selected a la opción actual
      this.classList.add('selected');
    });
  });
  */
  
  // Cerrar modal
  modalCloseBtn.addEventListener('click', function() {
    approvalModal.classList.remove('show');
    window.location.href = "/inventario_infocom/html/loginmejorado.html";
  });
  
  // Validación básica del formulario antes de enviar
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const fullname = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    // const role = document.querySelector('input[name="role"]:checked'); // ELIMINADO
    const terms = document.getElementById('terms').checked;
    
    let isValid = true;
    
    // Validación de nombre completo
    if (!fullname) {
      isValid = false;
      showError('fullname', 'El nombre completo es requerido');
    } else {
      hideError('fullname');
    }
    
    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      isValid = false;
      showError('email', 'Por favor ingresa un correo electrónico válido');
    } else {
      hideError('email');
    }
    
    // Validación de usuario
    if (!username) {
      isValid = false;
      showError('username', 'El usuario es requerido');
    } else {
      hideError('username');
    }
    
    // Validación de contraseña
    if (!password) {
      isValid = false;
      showError('password', 'La contraseña es requerida');
    } else if (password.length < 6) {
      isValid = false;
      showError('password', 'La contraseña debe tener al menos 6 caracteres');
    } else {
      hideError('password');
    }
    
    // Validación de confirmación de contraseña
    if (!confirmPassword) {
      isValid = false;
      showError('confirm-password', 'Debes confirmar tu contraseña');
    } else if (password !== confirmPassword) {
      isValid = false;
      showError('confirm-password', 'Las contraseñas no coinciden');
    } else {
      hideError('confirm-password');
    }
    
    // Validación de rol: ELIMINADO
    /*
    if (!role) {
      isValid = false;
      showError('role', 'Debes seleccionar un rol');
    } else {
      hideError('role');
    }
    */
    
    // Validación de términos
    if (!terms) {
      isValid = false;
      showNotification('Debes aceptar los términos y condiciones', 'error');
    }
    
    if (!isValid) {
      showNotification('Por favor completa todos los campos correctamente', 'error');
      return;
    }
    
    // Enviar datos al servidor
    const formData = new FormData();
    formData.append('fullname', fullname);
    formData.append('email', email);
    formData.append('username', username);
    formData.append('password', password);
    // NUEVA LÍNEA: Rol por defecto para que el backend lo procese como 'pendiente'
    formData.append('role', 'ventas'); 
    formData.append('terms', terms);
    
    // Reemplaza esta parte del fetch en el script:
    fetch('../php/register.php', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      console.log('Respuesta del servidor:', response);
      return response.json();
    })
    .then(data => {
      console.log('Datos recibidos:', data);
      if (data.success) {
        showNotification(data.message, 'success');
        
        // Mostrar modal de aprobación pendiente después de 1 segundo
        setTimeout(() => {
          approvalModal.classList.add('show');
        }, 1000);
      } else {
        showNotification(data.message, 'error');
      }
    })
    .catch(error => {
      console.error('Error completo:', error);
      showNotification('Error al registrar. Intenta nuevamente.', 'error');
    });
  
    // Funciones auxiliares para mostrar/ocultar errores
    function showError(fieldId, message) {
      const input = document.getElementById(fieldId);
      const errorElement = document.getElementById(`${fieldId}-error`);
      
      if (input) {
        input.classList.add('input-error');
      }
      
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
      }
    }
    
    function hideError(fieldId) {
      const input = document.getElementById(fieldId);
      const errorElement = document.getElementById(`${fieldId}-error`);
      
      if (input) {
        input.classList.remove('input-error');
      }
      
      if (errorElement) {
        errorElement.style.display = 'none';
      }
    }
    
    // Función para mostrar notificaciones
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
      }, 4000);
    }
    
    // Validación en tiempo real para mejor UX
    const fullnameInput = document.getElementById('fullname');
    const emailInput = document.getElementById('email');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    fullnameInput.addEventListener('blur', function() {
      const fullname = fullnameInput.value.trim();
      
      if (!fullname) {
        showError('fullname', 'El nombre completo es requerido');
      } else {
        hideError('fullname');
      }
    });
    
    emailInput.addEventListener('blur', function() {
      const email = emailInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!email) {
        showError('email', 'El correo electrónico es requerido');
      } else if (!emailRegex.test(email)) {
        showError('email', 'Por favor ingresa un correo electrónico válido');
      } else {
        hideError('email');
      }
    });
    
    usernameInput.addEventListener('blur', function() {
      const username = usernameInput.value.trim();
      
      if (!username) {
        showError('username', 'El usuario es requerido');
      } else {
        hideError('username');
      }
    });
    
    passwordInput.addEventListener('blur', function() {
      const password = passwordInput.value;
      
      if (!password) {
        showError('password', 'La contraseña es requerida');
      } else if (password.length < 6) {
        showError('password', 'La contraseña debe tener al menos 6 caracteres');
      } else {
        hideError('password');
      }
    });
    
    confirmPasswordInput.addEventListener('blur', function() {
      const confirmPassword = confirmPasswordInput.value;
      const password = passwordInput.value;
      
      if (!confirmPassword) {
        showError('confirm-password', 'Debes confirmar tu contraseña');
      } else if (password !== confirmPassword) {
        showError('confirm-password', 'Las contraseñas no coinciden');
      } else {
        hideError('confirm-password');
      }
    });
  });
});