document.addEventListener('DOMContentLoaded', async () => {
    // Cargar información del usuario
    try {
        const response = await fetch('/api/user');
        
        if (!response.ok) {
            throw new Error('Error al cargar información del usuario');
        }
        
        const user = await response.json();
        
        // Mostrar información del usuario
        document.getElementById('username').textContent = user.username;
        document.getElementById('email').textContent = user.email;
        
        // Formatear fecha de registro (asumiendo que mongoose añade _id con timestamp)
        const registerDate = new Date(user._id.getTimestamp());
        document.getElementById('registerDate').textContent = registerDate.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error:', error);
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = 'Error al cargar información del usuario';
        messageDiv.className = 'message error';
    }
    
    // Manejar logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Redirigir al login después de logout
                window.location.href = '/login';
            } else {
                const messageDiv = document.getElementById('message');
                messageDiv.textContent = data.message;
                messageDiv.className = 'message error';
            }
        } catch (error) {
            console.error('Error:', error);
            const messageDiv = document.getElementById('message');
            messageDiv.textContent = 'Error al cerrar sesión';
            messageDiv.className = 'message error';
        }
    });
});