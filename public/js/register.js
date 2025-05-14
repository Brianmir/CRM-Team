document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const messageDiv = document.getElementById('message');
    
    // Validación de contraseña
    if (password !== confirmPassword) {
        messageDiv.textContent = 'Las contraseñas no coinciden';
        messageDiv.className = 'message error';
        return;
    }
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            messageDiv.textContent = data.message;
            messageDiv.className = 'message success';
            
            // Redirigir al login después de registro exitoso
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        } else {
            messageDiv.textContent = data.message;
            messageDiv.className = 'message error';
        }
    } catch (error) {
        console.error('Error:', error);
        messageDiv.textContent = 'Error al conectar con el servidor';
        messageDiv.className = 'message error';
    }
});