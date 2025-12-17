document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember').checked;
        
        // Validación básica
        if (!email || !username || !password) {
            showMessage('Por favor, completa todos los campos.', 'error');
            return;
        }
        
        // Validación de formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage('Por favor, ingresa un correo electrónico válido.', 'error');
            return;
        }
        
        // Simulación de inicio de sesión exitoso
        showMessage(`¡Bienvenido ${username}! Has iniciado sesión correctamente.`, 'success');
        
        // Redirigir al index después de 2 segundos
        setTimeout(function() {
            window.location.href = 'index.html';
        }, 2000);
    });
    
    function showMessage(message, type) {
        // Eliminar mensajes anteriores si existen
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Crear elemento de mensaje
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;
        
        // Estilos para el mensaje
        messageElement.style.padding = '15px';
        messageElement.style.marginTop = '20px';
        messageElement.style.borderRadius = '8px';
        messageElement.style.textAlign = 'center';
        messageElement.style.fontWeight = '500';
        
        if (type === 'success') {
            messageElement.style.backgroundColor = '#d4edda';
            messageElement.style.color = '#155724';
            messageElement.style.border = '1px solid #c3e6cb';
        } else {
            messageElement.style.backgroundColor = '#f8d7da';
            messageElement.style.color = '#721c24';
            messageElement.style.border = '1px solid #f5c6cb';
        }
        
        // Insertar mensaje después del formulario
        loginForm.appendChild(messageElement);
        
        // Eliminar mensaje después de 5 segundos
        setTimeout(function() {
            messageElement.remove();
        }, 5000);
    }
});