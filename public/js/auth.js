document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            messageDiv.textContent = data.message;
            messageDiv.className = 'message success';
            
            // Redirigir al dashboard o página principal después de login
            setTimeout(() => {
                window.location.href = '/dashboard'; // Cambia esto según tu aplicación
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