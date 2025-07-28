// frontend/js/backoffice.js

// Asume que API_BASE_URL (desde auth.js) y showNotification (desde main.js) son globales
// ya que main.js y auth.js se cargan antes que backoffice.js en backoffice.html.

document.addEventListener('DOMContentLoaded', () => {
    const pendingUserList = document.getElementById('pendingUserList');
    const noPendingUsersMessage = document.getElementById('noPendingUsersMessage');

    // Función para cargar usuarios pendientes
    async function fetchPendingUsers() {
        noPendingUsersMessage.textContent = 'Cargando usuarios pendientes...';
        noPendingUsersMessage.style.display = 'block';
        pendingUserList.innerHTML = ''; // Limpiar lista actual

        try {
            // API_BASE_URL viene de auth.js que se carga antes
            const response = await fetch(`${API_BASE_URL}?action=pending_users`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok && result.users) {
                if (result.users.length === 0) {
                    noPendingUsersMessage.textContent = 'No hay usuarios pendientes de aprobación.';
                    noPendingUsersMessage.style.display = 'block';
                } else {
                    noPendingUsersMessage.style.display = 'none'; // Ocultar mensaje si hay usuarios
                    result.users.forEach(user => {
                        const listItem = document.createElement('li');
                        listItem.innerHTML = `
                            <div class="user-details">
                                <span class="user-name">${user.Nombre} ${user.Apellido}</span>
                                <span class="user-email">${user.Correo}</span>
                                <small class="user-date">Registrado: ${new Date(user.fecha_registro).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</small>
                            </div>
                            <button class="btn-approve" data-id="${user.id_Residente}">Aprobar</button>
                        `;
                        pendingUserList.appendChild(listItem);
                    });
                }
            } else {
                showNotification(result.message || 'Error al cargar usuarios pendientes.', 'error');
                noPendingUsersMessage.textContent = 'Error al cargar usuarios.';
                noPendingUsersMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Error de red al cargar usuarios pendientes:', error);
            showNotification('Error de conexión con el servidor al cargar usuarios.', 'error');
            noPendingUsersMessage.textContent = 'Error de conexión.';
            noPendingUsersMessage.style.display = 'block';
        }
    }

    // Función para aprobar un usuario
    async function approveUser(userId) {
        try {
            // API_BASE_URL viene de auth.js
            const response = await fetch(`${API_BASE_URL}?action=approve_user&id=${userId}`, {
                method: 'PUT', // Usamos PUT para actualizar un recurso
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok) {
                showNotification(result.message || 'Usuario aprobado exitosamente.', 'success');
                fetchPendingUsers(); // Volver a cargar la lista para que el usuario aprobado desaparezca
            } else {
                showNotification(result.message || 'Error al aprobar usuario.', 'error');
            }
        } catch (error) {
            console.error('Error de red al aprobar usuario:', error);
            showNotification('Error de conexión con el servidor al aprobar.', 'error');
        }
    }

    // Delegación de eventos para los botones de aprobación
    pendingUserList.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-approve')) {
            const userId = e.target.dataset.id;
            if (confirm(`¿Estás seguro de que quieres aprobar al usuario con ID: ${userId}?`)) {
                approveUser(userId);
            }
        }
    });

    // Cargar usuarios al cargar la página del backoffice
    fetchPendingUsers();
});