//
// inventario_infocom/javascript/papelera.js
// Lógica para la Papelera de Reciclaje
//

let papeleraData = [];

document.addEventListener('DOMContentLoaded', function() {
    // Asegura que el menú de Papelera esté activo
    setActiveMenuItemPapelera();
    
    loadPapeleraData();
    
    document.getElementById('refresh-btn').addEventListener('click', loadPapeleraData);
    document.getElementById('filter-tipo').addEventListener('change', filtrarPapelera);
});

// Función auxiliar para activar el menú de Papelera
function setActiveMenuItemPapelera() {
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    const activeItem = document.querySelector('a[href*="papelera.html"]');
    if (activeItem) activeItem.classList.add('active');
}


async function loadPapeleraData() {
    showLoading(true);
    try {
        const response = await fetch('../api/papelera.php');
        if (!response.ok) throw new Error('Error al cargar datos de la papelera');
        
        const data = await response.json();
        if (data.success) {
            papeleraData = data.data;
            filtrarPapelera(); // Cargar y aplicar el filtro inicial (all)
        } else {
            throw new Error(data.error || 'Error desconocido');
        }
    } catch (error) {
        console.error('Error al cargar papelera:', error);
        showNotification(`Error: ${error.message}`, 'error');
        renderTable([]);
    } finally {
        showLoading(false);
    }
}

function filtrarPapelera() {
    const filterValue = document.getElementById('filter-tipo').value;
    
    const dataFiltrada = papeleraData.filter(item => {
        if (filterValue === 'all') return true;
        return item.tipo === filterValue;
    });
    
    renderTable(dataFiltrada);
}


function renderTable(data) {
    const tbody = document.getElementById('papelera-body');
    const tableEmpty = document.getElementById('table-empty');
    
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tableEmpty.style.display = 'flex';
        return;
    }
    
    tableEmpty.style.display = 'none';

    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = `table-type-${item.tipo}`;
        
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>
                <span class="status-badge role-${item.tipo}">${getTipoNombre(item.tipo)}</span>
            </td>
            <td>${item.nombre}</td>
            <td>${formatearFechaHora(item.fecha_creacion)}</td>
            <td><span class="status-badge status-cancelled">${item.estado}</span></td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="restaurarItem('${item.id}', '${item.tipo}')">
                    <i class="fas fa-undo"></i>
                    <span>Restaurar</span>
                </button>
                <button class="btn btn-danger btn-sm" onclick="eliminarPermanentemente('${item.id}', '${item.tipo}')">
                    <i class="fas fa-times"></i>
                    <span>Borrar</span>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function restaurarItem(id, tipo) {
    if (!confirm(`¿Está seguro de restaurar el elemento ${id} de tipo ${tipo}? \n(Esto restaurará el stock de productos en caso de ser un servicio o una venta)`)) {
        return;
    }
    
    showLoading(true, 'Restaurando...');
    try {
        const response = await fetch('../api/papelera.php?action=restaurar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, tipo: tipo })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`${getTipoNombre(tipo)} ${id} restaurado correctamente.`, 'success');
            loadPapeleraData(); // Recargar la tabla
        } else {
            if (result.error.includes("ya fue restaurado") || result.error.includes("Filas afectadas: 0")) {
                showNotification(`${getTipoNombre(tipo)} ${id} ya estaba activo o fue restaurado previamente.`, 'warning');
            } else {
                 throw new Error(result.error || 'Error desconocido al restaurar');
            }
        }
    } catch (error) {
        console.error('Error al restaurar:', error);
        showNotification(`Error al restaurar: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// === FUNCIÓN PARA ELIMINACIÓN PERMANENTE ===
async function eliminarPermanentemente(id, tipo) {
    if (!confirm(`ADVERTENCIA: ¿Está seguro de ELIMINAR PERMANENTEMENTE el elemento ${id} de tipo ${tipo}? Esta acción no se puede deshacer.`)) {
        return;
    }
    
    showLoading(true, 'Eliminando permanentemente...');
    try {
        const response = await fetch('../api/papelera.php?action=eliminar_permanente', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, tipo: tipo })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`${getTipoNombre(tipo)} ${id} eliminado permanentemente.`, 'success');
            loadPapeleraData(); // Recargar la tabla
        } else {
            throw new Error(result.error || 'Error desconocido al eliminar');
        }
    } catch (error) {
        console.error('Error al eliminar permanentemente:', error);
        showNotification(`Error al eliminar: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}


// --- UTILIDADES ---

function getTipoNombre(tipo) {
    switch(tipo) {
        case 'producto': return 'Producto';
        case 'cotizacion': return 'Cotización';
        case 'servicio': return 'Servicio';
        case 'venta': return 'Venta';
        default: return 'Elemento';
    }
}

function formatearFechaHora(fechaString) {
    if (!fechaString) return 'N/A';
    try {
        let isoString = fechaString.replace(' ', 'T');
        if (!isoString.includes('T')) isoString += 'T00:00:00';
        
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return fechaString.split(' ')[0] || 'N/A';
        
        return date.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'short', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit'
        }).replace('.', '');
    } catch {
        return fechaString.split(' ')[0] || 'N/A';
    }
}

function showLoading(show, message = 'Cargando elementos...') {
    const tableLoading = document.getElementById('table-loading');
    const tableEmpty = document.getElementById('table-empty');
    const tbody = document.getElementById('papelera-body');
    
    if (show) {
        tableLoading.querySelector('p').textContent = message;
        tableLoading.style.display = 'flex';
        tableEmpty.style.display = 'none';
        tbody.innerHTML = '';
    } else {
        tableLoading.style.display = 'none';
    }
}

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    const icon = notification.querySelector('i');
    
    notificationText.textContent = message;
    notification.className = `notification ${type}`;
    
    if (type === 'success') {
        icon.className = 'fas fa-check-circle';
    } else {
        icon.className = 'fas fa-exclamation-circle';
    }
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}