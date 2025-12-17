//
// Variables globales
let cotizacionesData = [];
let productosData = [];
let cotizacionesFiltradas = [];
let cotizacionAEliminar = null;
let cotizacionActual = null;
let productosCotizacion = [];
let productoSeleccionado = null;

// === FUNCIÓN AUXILIAR PARA OBTENER URL ABSOLUTA ===
/**
 * Convierte una ruta relativa en una URL absoluta completa para resolver problemas
 * de carga en impresión y html2pdf.
 */
function getAbsoluteUrl(relativePath) {
    if (!relativePath || typeof relativePath !== 'string') {
        return '';
    }
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
        return relativePath; 
    }
    const a = document.createElement('a');
    a.href = relativePath;
    return a.href;
}
// === FIN FUNCIÓN AUXILIAR ===

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    cargarProductosDesdeBD();
    cargarCotizacionesDesdeBD();
    inicializarBuscadores();
    
    // Configurar event listeners para filtros
    document.getElementById('searchInput').addEventListener('input', filtrarCotizaciones);
    document.getElementById('status-filter').addEventListener('change', filtrarCotizaciones);
    document.getElementById('date-filter').addEventListener('change', filtrarCotizaciones);
    
    // Configurar formularios
    document.getElementById('edit-form').addEventListener('submit', guardarEdicion);
    document.getElementById('add-form').addEventListener('submit', guardarNuevaCotizacion);
    
    // Configurar botón de eliminar
    document.getElementById('confirm-delete').addEventListener('click', eliminarCotizacion);
    
    // Configurar cierre de modales
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
});

// Cargar productos desde la base de datos
async function cargarProductosDesdeBD() {
    try {
        const now = new Date().getTime(); // Anti-caché
        const response = await fetch(`../api/productos.php?estado=activo&_t=${now}`);
        if (response.ok) {
            productosData = await response.json();
        } else {
            console.error('Error al cargar productos:', response.status);
            productosData = [];
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
        productosData = [];
    }
}

// Cargar cotizaciones desde la base de datos
async function cargarCotizacionesDesdeBD() {
    try {
        const now = new Date().getTime(); // Anti-caché
        const response = await fetch(`../api/cotizaciones.php?_t=${now}`);
        if (response.ok) {
            const data = await response.json();
            cotizacionesData = data || [];
            cotizacionesFiltradas = [...cotizacionesData];
            cargarCotizaciones();
        } else {
            console.error('Error al cargar cotizaciones:', response.status);
            cotizacionesData = [];
            cotizacionesFiltradas = [];
        }
    } catch (error) {
        console.error('Error al cargar cotizaciones:', error);
        cotizacionesData = [];
        cotizacionesFiltradas = [];
    }
}

// Inicializar buscadores de productos
function inicializarBuscadores() {
    const addSearch = document.getElementById('add-product-search');
    const addDropdown = document.getElementById('add-product-dropdown');
    const editSearch = document.getElementById('edit-product-search');
    const editDropdown = document.getElementById('edit-product-dropdown');

    if (addSearch && addDropdown) {
        // Configurar buscador para agregar productos
        addSearch.addEventListener('input', function() {
            buscarProductos(this.value, addDropdown, 'add');
        });

        addSearch.addEventListener('focus', function() {
            if (this.value === '') {
                buscarProductos('', addDropdown, 'add');
            }
        });
    }

    if (editSearch && editDropdown) {
        // Configurar buscador para editar productos
        editSearch.addEventListener('input', function() {
            buscarProductos(this.value, editDropdown, 'edit');
        });

        editSearch.addEventListener('focus', function() {
            if (this.value === '') {
                buscarProductos('', editDropdown, 'edit');
            }
        });
    }

    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.searchable-select')) {
            if (addDropdown) addDropdown.classList.remove('active');
            if (editDropdown) editDropdown.classList.remove('active');
        }
    });

    // Manejar tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (addDropdown) addDropdown.classList.remove('active');
            if (editDropdown) editDropdown.classList.remove('active');
        }
    });
}

// Buscar productos
function buscarProductos(termino, dropdown, tipo) {
    if (!dropdown) return;
    
    let resultados = productosData;

    if (termino.trim() !== '') {
        resultados = productosData.filter(producto =>
            (producto.nombre && producto.nombre.toLowerCase().includes(termino.toLowerCase())) ||
            (producto.marca && producto.marca.toLowerCase().includes(termino.toLowerCase())) ||
            (producto.categoria && producto.categoria.toLowerCase().includes(termino.toLowerCase())) ||
            (producto.id && producto.id.toLowerCase().includes(termino.toLowerCase()))
        );
    }

    dropdown.innerHTML = '';

    // Header del dropdown
    const header = document.createElement('div');
    header.className = 'dropdown-header';
    header.textContent = resultados.length > 0 ? 
        `${resultados.length} producto${resultados.length !== 1 ? 's' : ''} encontrado${resultados.length !== 1 ? 's' : ''}` : 
        'Buscar productos';
    dropdown.appendChild(header);

    if (resultados.length === 0 && termino.trim() !== '') {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.innerHTML = `
            <i class="fa-solid fa-search"></i>
            <div>No se encontraron productos</div>
            <div style="font-size: 11px; margin-top: 4px;">Intente con otros términos</div>
        `;
        dropdown.appendChild(noResults);
    } else if (resultados.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.innerHTML = `
            <i class="fa-solid fa-box-open"></i>
            <div>No hay productos disponibles</div>
            <div style="font-size: 11px; margin-top: 4px;">Agregue productos primero</div>
        `;
        dropdown.appendChild(noResults);
    } else {
        resultados.forEach(producto => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            
            const nombre = producto.nombre || 'Sin nombre';
            const marca = producto.marca || 'Sin marca';
            const categoria = producto.categoria || 'Sin categoría';
            const stock = producto.stock || 0;
            const precio = parseFloat(producto.precio) || 0;
            
            item.innerHTML = `
                <div class="product-name">${resaltarCoincidencia(nombre, termino)}</div>
                <div class="product-details">
                    <div class="product-info">
                        <span class="product-brand">${marca}</span>
                        <span class="product-category">${categoria}</span>
                        <span class="product-stock" style="background: #e8f4fd; color: #3498db; padding: 2px 8px; border-radius: 12px; font-weight: 500;">
                            Stock: ${stock}
                        </span>
                    </div>
                    <div class="product-price">S/ ${precio.toLocaleString()}</div>
                </div>
            `;
            item.addEventListener('click', function() {
                seleccionarProducto(producto, tipo);
            });
            
            dropdown.appendChild(item);
        });
    }

    dropdown.classList.add('active');
}

// Función para resaltar coincidencias en la búsqueda
function resaltarCoincidencia(texto, busqueda) {
    if (!busqueda.trim() || !texto) return texto || '';
    
    const regex = new RegExp(`(${busqueda.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return texto.replace(regex, '<mark style="background: var(--primary-light); color: var(--primary-dark); padding: 1px 2px; border-radius: 2px;">$1</mark>');
}

// Seleccionar producto del dropdown
function seleccionarProducto(producto, tipo) {
    productoSeleccionado = producto;
    
    const searchInput = tipo === 'add' ? 
        document.getElementById('add-product-search') : 
        document.getElementById('edit-product-search');
    
    const dropdown = tipo === 'add' ? 
        document.getElementById('add-product-dropdown') : 
        document.getElementById('edit-product-dropdown');
    
    if (!searchInput) return;
    
    // Agregar efecto visual de selección
    searchInput.value = producto.nombre || '';
    searchInput.style.background = "linear-gradient(135deg, #f1f9f4, #e8f5e9)";
    searchInput.style.borderColor = "var(--primary-color)";
    
    // Remover el efecto después de 1 segundo
    setTimeout(() => {
        searchInput.style.background = "white";
        if (!searchInput.matches(':focus')) {
            searchInput.style.borderColor = "var(--border-color)";
        }
    }, 1000);
    
    if (dropdown) dropdown.classList.remove('active');
    
    // Auto-focus en el campo de cantidad
    const quantityInput = tipo === 'add' ? 
        document.getElementById('add-product-quantity') : 
        document.getElementById('edit-product-quantity');
    
    if (quantityInput) {
        quantityInput.focus();
        quantityInput.select();
    }
}

// Cargar cotizaciones en la tabla
function cargarCotizaciones() {
    const tbody = document.getElementById('quotations-body');
    if (!tbody) return;
    
    if (cotizacionesFiltradas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: var(--text-light);">No se encontraron cotizaciones</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    cotizacionesFiltradas.forEach(cotizacion => {
        const tr = document.createElement('tr');
        const statusClass = `status-${cotizacion.estado}`;
        const statusBadgeClass = `status-${cotizacion.estado}-badge`;
        const statusText = getStatusText(cotizacion.estado);
        
        tr.className = statusClass;
        tr.innerHTML = `
            <td>${cotizacion.id || 'N/A'}</td>
            <td>${cotizacion.cliente_nombre || 'N/A'}</td>
            <td>${cotizacion.cliente_tipo_doc || 'N/A'}: ${cotizacion.cliente_num_doc || 'N/A'}</td>
            <td>${cotizacion.cliente_telefono || 'N/A'}</td>
            <td>${cotizacion.fecha ? new Date(cotizacion.fecha).toLocaleDateString() : 'N/A'}</td>
            <td>S/ ${parseFloat(cotizacion.total || 0).toLocaleString()}</td>
            <td><span class="status-badge ${statusBadgeClass}">${statusText}</span></td>
            <td class="actions">
                <button class="action-btn btn-view" onclick="verCotizacion('${cotizacion.id}')">
                    <i class="fa-solid fa-eye"></i> 
                </button>
                <button class="action-btn btn-print" onclick="imprimirCotizacionDesdeTabla('${cotizacion.id}')">
                    <i class="fa-solid fa-print"></i> 
                </button>
                <button class="action-btn btn-edit" onclick="editarCotizacion('${cotizacion.id}')">
                    <i class="fa-solid fa-edit"></i> 
                </button>
                <button class="action-btn btn-delete" onclick="confirmarEliminar('${cotizacion.id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Filtrar cotizaciones
function filtrarCotizaciones() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    const dateFilter = document.getElementById('date-filter').value;
    
    cotizacionesFiltradas = cotizacionesData.filter(cotizacion => {
        // Filtrar por búsqueda
        const matchesSearch = searchTerm === '' || 
            (cotizacion.cliente_nombre && cotizacion.cliente_nombre.toLowerCase().includes(searchTerm)) ||
            (cotizacion.cliente_num_doc && cotizacion.cliente_num_doc.includes(searchTerm)) ||
            (cotizacion.id && cotizacion.id.toLowerCase().includes(searchTerm));
        
        // Filtrar por estado
        const matchesStatus = statusFilter === 'all' || cotizacion.estado === statusFilter;
        
        // Filtrar por fecha
        let matchesDate = true;
        if (dateFilter !== 'all' && cotizacion.fecha) {
            const hoy = new Date();
            const fechaCotizacion = new Date(cotizacion.fecha);
            
            switch(dateFilter) {
                case 'today':
                    matchesDate = fechaCotizacion.toDateString() === hoy.toDateString();
                    break;
                case 'week':
                    const inicioSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay()));
                    matchesDate = fechaCotizacion >= inicioSemana;
                    break;
                case 'month':
                    matchesDate = fechaCotizacion.getMonth() === hoy.getMonth() && 
                                 fechaCotizacion.getFullYear() === hoy.getFullYear();
                    break;
            }
        }
        
        return matchesSearch && matchesStatus && matchesDate;
    });
    
    cargarCotizaciones();
}

// Obtener texto del estado
function getStatusText(status) {
    switch(status) {
        case 'pending': return 'Pendiente';
        case 'approved': return 'Aprobada';
        case 'rejected': return 'Rechazada';
        default: return status || 'Desconocido';
    }
}

// Funciones para los modales
async function verCotizacion(id) {
    try {
        const now = new Date().getTime(); // Anti-caché
        const response = await fetch(`../api/cotizaciones_detalle.php?id=${id}&_t=${now}`);
        if (response.ok) {
            const cotizacion = await response.json();
            cotizacionActual = cotizacion;
            
            document.getElementById('view-client-name').textContent = cotizacion.cliente_nombre || 'N/A';
            document.getElementById('view-client-doc').textContent = `${cotizacion.cliente_tipo_doc || 'N/A'}: ${cotizacion.cliente_num_doc || 'N/A'}`;
            document.getElementById('view-client-phone').textContent = cotizacion.cliente_telefono || 'N/A';
            document.getElementById('view-quotation-number').textContent = cotizacion.id || 'N/A';
            document.getElementById('view-quotation-date').textContent = cotizacion.fecha ? new Date(cotizacion.fecha).toLocaleDateString() : 'N/A';
            
            const statusElement = document.getElementById('view-quotation-status');
            statusElement.textContent = getStatusText(cotizacion.estado);
            statusElement.className = `status-badge status-${cotizacion.estado}-badge`;
            
            // Cargar productos
            const tbody = document.getElementById('view-products-body');
            tbody.innerHTML = '';
            
            // --- INICIO: MODIFICACIÓN DE ENCABEZADOS DE TABLA (Vista Modal) ---
            const thead = document.querySelector('#viewModal .products-table thead tr');
            if(thead) {
                // Modificar la cabecera para incluir la columna de imagen
                thead.innerHTML = `
                    <th style="width: 10%;">Imagen</th> 
                    <th>Producto</th>
                    <th>Marca</th>
                    <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Subtotal</th>
                `;
            }
            // --- FIN: MODIFICACIÓN DE ENCABEZADOS DE TABLA (Vista Modal) ---
            
            if (cotizacion.detalles) {
                cotizacion.detalles.forEach(detalle => {
                    const subtotal = detalle.cantidad * detalle.precio_unitario;
                    const imageUrl = detalle.producto_imagen || '../logoinfo.png'; // Usar la imagen obtenida
                    
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>
                            <img src="${imageUrl}" 
                                 alt="${detalle.producto_nombre}" 
                                 style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"
                                 onerror="this.src='../logoinfo.png'">
                        </td>
                        <td>${detalle.producto_nombre || 'Producto no encontrado'}</td>
                        <td>${detalle.producto_marca || 'N/A'}</td>
                        <td>${detalle.cantidad}</td>
                        <td>S/ ${parseFloat(detalle.precio_unitario).toLocaleString()}</td>
                        <td>S/ ${subtotal.toLocaleString()}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }
            
            // === INICIO: CÁLCULO MODIFICADO ===
            const subtotal = parseFloat(cotizacion.subtotal || 0);
            const igv = parseFloat(cotizacion.igv || 0);
            const total = parseFloat(cotizacion.total || 0);

            document.getElementById('view-subtotal-amount').textContent = subtotal.toLocaleString('es-PE', {minimumFractionDigits: 2});
            document.getElementById('view-igv-amount').textContent = igv.toLocaleString('es-PE', {minimumFractionDigits: 2});
            document.getElementById('view-total-amount').textContent = total.toLocaleString('es-PE', {minimumFractionDigits: 2});
            // === FIN: CÁLCULO MODIFICADO ===

            document.getElementById('viewModal').style.display = 'flex';
        } else {
            // Manejo explícito del error de no-JSON
            const errorText = await response.text();
            console.error('Error del servidor (No-JSON):', errorText);
            alert(`Error al cargar la cotización. Posiblemente un error en el servidor. Revise la consola del navegador (F12).`);
        }
    } catch (error) {
        console.error('Error al cargar cotización:', error);
        alert('Error de conexión o de procesamiento de datos.');
    }
}

async function editarCotizacion(id) {
    try {
        const now = new Date().getTime(); // Anti-caché
        const response = await fetch(`../api/cotizaciones_detalle.php?id=${id}&_t=${now}`);
        if (response.ok) {
            const cotizacion = await response.json();
            cotizacionActual = cotizacion;
            
            // Cargar productos de la cotización
            productosCotizacion = cotizacion.detalles ? cotizacion.detalles.map(detalle => ({
                productoId: detalle.producto_id,
                cantidad: detalle.cantidad,
                precio: detalle.precio_unitario,
                productoNombre: detalle.producto_nombre,
                productoMarca: detalle.producto_marca
            })) : [];
            
            document.getElementById('edit-doc-type').value = cotizacion.cliente_tipo_doc || 'DNI';
            document.getElementById('edit-doc-number').value = cotizacion.cliente_num_doc || '';
            document.getElementById('edit-client-name').value = cotizacion.cliente_nombre || '';
            document.getElementById('edit-client-phone').value = cotizacion.cliente_telefono || '';
            document.getElementById('edit-quotation-status').value = cotizacion.estado || 'pending';
            
            cargarProductosEdicion();
            actualizarTotalEdicion();
            
            document.getElementById('edit-form').dataset.editingId = id;
            document.getElementById('editModal').style.display = 'flex';
        } else {
            const errorText = await response.text();
            console.error('Error del servidor (No-JSON):', errorText);
            alert(`Error al cargar la cotización para editar. Posiblemente un error en el servidor.`);
        }
    } catch (error) {
        console.error('Error al cargar cotización:', error);
        alert('Error de conexión o de procesamiento de datos.');
    }
}

function confirmarEliminar(id) {
    const cotizacion = cotizacionesData.find(c => c.id === id);
    if (cotizacion) {
        cotizacionAEliminar = id;
        document.getElementById('delete-message').textContent = 
            `¿Está seguro de eliminar la cotización "${cotizacion.id}" del cliente "${cotizacion.cliente_nombre}"? Esta acción no se puede deshacer.`;
        document.getElementById('deleteModal').style.display = 'flex';
    }
}

function openModal(modalId) {
    if (modalId === 'addQuotationModal') {
        productosCotizacion = [];
        productoSeleccionado = null;
        document.getElementById('add-products-body').innerHTML = '';
        // === INICIO: RESET MODIFICADO ===
        document.getElementById('add-subtotal-amount').textContent = '0.00';
        document.getElementById('add-igv-amount').textContent = '0.00';
        document.getElementById('add-total-amount').textContent = '0.00';
        // === FIN: RESET MODIFICADO ===
        document.getElementById('add-product-search').value = '';
        document.getElementById('add-form').reset();
    }
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Funciones para productos en cotización
function agregarProducto() {
    const quantityInput = document.getElementById('add-product-quantity');
    
    if (!productoSeleccionado) {
        alert('Por favor seleccione un producto de la lista');
        return;
    }
    
    const cantidad = parseInt(quantityInput.value);
    
    if (isNaN(cantidad) || cantidad < 1) {
        alert('Por favor ingrese una cantidad válida');
        return;
    }
    
    // Verificar stock disponible
    const stock = productoSeleccionado.stock || 0;
    if (cantidad > stock) {
        alert(`Stock insuficiente. Solo hay ${stock} unidades disponibles.`);
        return;
    }
    
    const precio = parseFloat(productoSeleccionado.precio) || 0;
    
    // Verificar si el producto ya está en la lista
    const existingIndex = productosCotizacion.findIndex(p => p.productoId === productoSeleccionado.id);
    if (existingIndex !== -1) {
        const nuevaCantidad = productosCotizacion[existingIndex].cantidad + cantidad;
        if (nuevaCantidad > stock) {
            alert(`Stock insuficiente. No puede agregar más de ${stock} unidades.`);
            return;
        }
        productosCotizacion[existingIndex].cantidad = nuevaCantidad;
    } else {
        productosCotizacion.push({
            productoId: productoSeleccionado.id,
            cantidad: cantidad,
            precio: precio,
            productoNombre: productoSeleccionado.nombre,
            productoMarca: productoSeleccionado.marca
        });
    }
    
    cargarProductosAgregar();
    actualizarTotalAgregar();
    
    // Resetear inputs
    productoSeleccionado = null;
    document.getElementById('add-product-search').value = '';
    const addDropdown = document.getElementById('add-product-dropdown');
    if (addDropdown) addDropdown.classList.remove('active');
    quantityInput.value = '1';
}

function agregarProductoEdicion() {
    const quantityInput = document.getElementById('edit-product-quantity');
    
    if (!productoSeleccionado) {
        alert('Por favor seleccione un producto de la lista');
        return;
    }
    
    const cantidad = parseInt(quantityInput.value);
    
    if (isNaN(cantidad) || cantidad < 1) {
        alert('Por favor ingrese una cantidad válida');
        return;
    }
    
    // Verificar stock disponible
    const stock = productoSeleccionado.stock || 0;
    if (cantidad > stock) {
        alert(`Stock insuficiente. Solo hay ${stock} unidades disponibles.`);
        return;
    }
    
    const precio = parseFloat(productoSeleccionado.precio) || 0;
    
    // Verificar si el producto ya está en la lista
    const existingIndex = productosCotizacion.findIndex(p => p.productoId === productoSeleccionado.id);
    if (existingIndex !== -1) {
        const nuevaCantidad = productosCotizacion[existingIndex].cantidad + cantidad;
        if (nuevaCantidad > stock) {
            alert(`Stock insuficiente. No puede agregar más de ${stock} unidades.`);
            return;
        }
        productosCotizacion[existingIndex].cantidad = nuevaCantidad;
    } else {
        productosCotizacion.push({
            productoId: productoSeleccionado.id,
            cantidad: cantidad,
            precio: precio,
            productoNombre: productoSeleccionado.nombre,
            productoMarca: productoSeleccionado.marca
        });
    }
    
    cargarProductosEdicion();
    actualizarTotalEdicion();
    
    // Resetear inputs
    productoSeleccionado = null;
    document.getElementById('edit-product-search').value = '';
    const editDropdown = document.getElementById('edit-product-dropdown');
    if (editDropdown) editDropdown.classList.remove('active');
    quantityInput.value = '1';
}

function cargarProductosAgregar() {
    const tbody = document.getElementById('add-products-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    productosCotizacion.forEach((item, index) => {
        const subtotal = item.cantidad * item.precio;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.productoNombre || 'Producto no encontrado'}</td>
            <td>${item.productoMarca || 'N/A'}</td>
            <td>${item.cantidad}</td>
            <td>S/ ${item.precio.toLocaleString()}</td>
            <td>S/ ${subtotal.toLocaleString()}</td>
            <td>
                <button type="button" class="action-btn btn-delete" onclick="eliminarProductoAgregar(${index})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function cargarProductosEdicion() {
    const tbody = document.getElementById('edit-products-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    productosCotizacion.forEach((item, index) => {
        const subtotal = item.cantidad * item.precio;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.productoNombre || 'Producto no encontrado'}</td>
            <td>${item.productoMarca || 'N/A'}</td>
            <td>${item.cantidad}</td>
            <td>S/ ${item.precio.toLocaleString()}</td>
            <td>S/ ${subtotal.toLocaleString()}</td>
            <td>
                <button type="button" class="action-btn btn-delete" onclick="eliminarProductoEdicion(${index})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function eliminarProductoAgregar(index) {
    productosCotizacion.splice(index, 1);
    cargarProductosAgregar();
    actualizarTotalAgregar();
}

function eliminarProductoEdicion(index) {
    productosCotizacion.splice(index, 1);
    cargarProductosEdicion();
    actualizarTotalEdicion();
}

// === INICIO: CÁLCULO MODIFICADO ===
function actualizarTotalAgregar() {
    const subtotal = productosCotizacion.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    
    document.getElementById('add-subtotal-amount').textContent = subtotal.toFixed(2);
    document.getElementById('add-igv-amount').textContent = igv.toFixed(2);
    document.getElementById('add-total-amount').textContent = total.toFixed(2);
}

function actualizarTotalEdicion() {
    const subtotal = productosCotizacion.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    document.getElementById('edit-subtotal-amount').textContent = subtotal.toFixed(2);
    document.getElementById('edit-igv-amount').textContent = igv.toFixed(2);
    document.getElementById('edit-total-amount').textContent = total.toFixed(2);
}
// === FIN: CÁLCULO MODIFICADO ===

// Funciones para guardar datos
async function guardarEdicion(e) {
    e.preventDefault();
    
    if (productosCotizacion.length === 0) {
        alert('Debe agregar al menos un producto a la cotización');
        return;
    }
    
    const id = document.getElementById('edit-form').dataset.editingId;
    
    // === INICIO: CÁLCULO MODIFICADO ===
    const subtotal = productosCotizacion.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    // === FIN: CÁLCULO MODIFICADO ===

    const cotizacionData = {
        cliente_nombre: document.getElementById('edit-client-name').value,
        cliente_tipo_doc: document.getElementById('edit-doc-type').value,
        cliente_num_doc: document.getElementById('edit-doc-number').value,
        cliente_telefono: document.getElementById('edit-client-phone').value,
        estado: document.getElementById('edit-quotation-status').value,
        // === INICIO: CAMPOS MODIFICADOS ===
        subtotal: subtotal,
        igv: igv,
        total: total,
        // === FIN: CAMPOS MODIFICADOS ===
        detalles: productosCotizacion.map(item => ({
            producto_id: item.productoId,
            cantidad: item.cantidad,
            precio_unitario: item.precio
        }))
    };
    
    try {
        const now = new Date().getTime(); // Anti-caché
        const response = await fetch(`../api/cotizaciones_editar.php?id=${id}&_t=${now}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cotizacionData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            await cargarCotizacionesDesdeBD();
            closeModal('editModal');
            alert('Cotización actualizada correctamente');
        } else {
             const errorText = await response.text();
            console.error('Error al guardar edición (No-JSON):', errorText);
            alert('Error al actualizar la cotización. Revise la consola del navegador.');
        }
    } catch (error) {
        console.error('Error al actualizar cotización:', error);
        alert('Error de conexión o de procesamiento de datos.');
    }
}

async function guardarNuevaCotizacion(e) {
    e.preventDefault();
    
    if (productosCotizacion.length === 0) {
        alert('Debe agregar al menos un producto a la cotización');
        return;
    }
    
    // === INICIO: CÁLCULO MODIFICADO ===
    const subtotal = productosCotizacion.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    // === FIN: CÁLCULO MODIFICADO ===
    
    const nuevaCotizacion = {
        cliente_nombre: document.getElementById('add-client-name').value,
        cliente_tipo_doc: document.getElementById('add-doc-type').value,
        cliente_num_doc: document.getElementById('add-doc-number').value,
        cliente_telefono: document.getElementById('add-client-phone').value,
        fecha: new Date().toISOString().split('T')[0],
        // === INICIO: CAMPOS MODIFICADOS ===
        subtotal: subtotal,
        igv: igv,
        total: total,
        // === FIN: CAMPOS MODIFICADOS ===
        estado: 'pending',
        detalles: productosCotizacion.map(item => ({
            producto_id: item.productoId,
            cantidad: item.cantidad,
            precio_unitario: item.precio
        }))
    };
    
    try {
        const now = new Date().getTime(); // Anti-caché
        const response = await fetch(`../api/cotizaciones.php?_t=${now}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevaCotizacion)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            await cargarCotizacionesDesdeBD();
            closeModal('addQuotationModal');
            alert('Cotización creada correctamente');
        } else {
             const errorText = await response.text();
             console.error('Error al crear cotización (No-JSON):', errorText);
             alert('Error al crear la cotización. Revise la consola del navegador.');
        }
    } catch (error) {
        console.error('Error al crear cotización:', error);
        alert('Error de conexión o de procesamiento de datos.');
    }
}

async function eliminarCotizacion() {
    if (cotizacionAEliminar) {
        try {
            const now = new Date().getTime(); // Anti-caché
            const response = await fetch(`../api/cotizaciones_editar.php?id=${cotizacionAEliminar}&_t=${now}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                await cargarCotizacionesDesdeBD();
                closeModal('deleteModal');
                alert('Cotización eliminada correctamente');
            } else {
                 const errorText = await response.text();
                 console.error('Error al eliminar (No-JSON):', errorText);
                 alert('Error al eliminar la cotización. Revise la consola del navegador.');
            }
        } catch (error) {
            console.error('Error al eliminar cotización:', error);
            alert('Error de conexión o de procesamiento de datos.');
        }
        cotizacionAEliminar = null;
    }
}

// Imprimir cotización
function imprimirCotizacionDesdeTabla(id) {
    const cotizacion = cotizacionesData.find(c => c.id === id);
    if (cotizacion) {
        // Usamos la data de la tabla (que ya tiene total)
        // y llamamos a la API solo para los detalles
        cotizacionActual = cotizacion; 
        imprimirCotizacion();
    }
}

async function imprimirCotizacion() {
    if (!cotizacionActual) {
        alert('No hay cotización seleccionada para imprimir');
        return;
    }
    
    try {
        // Siempre buscamos los detalles completos para asegurar que la impresión sea precisa
        const now = new Date().getTime(); // Anti-caché
        const response = await fetch(`../api/cotizaciones_detalle.php?id=${cotizacionActual.id}&_t=${now}`);
        if (response.ok) {
            const cotizacionCompleta = await response.json();
            
            const ventana = window.open('', '', 'width=800,height=600');
            ventana.document.write(generarHTMLImpresion(cotizacionCompleta));
            ventana.document.close();
        } else {
            const errorText = await response.text();
            console.error('Error al cargar datos para imprimir (No-JSON):', errorText);
            alert('Error al cargar los datos para imprimir. Revise la consola del navegador.');
        }
    } catch (error) {
        console.error('Error al imprimir cotización:', error);
        alert('Error de conexión o de procesamiento de datos.');
    }
}

// ==================================================
// ***** FUNCIÓN DE IMPRESIÓN MODIFICADA (CON IMAGEN) *****
// ==================================================
function generarHTMLImpresion(cotizacion) {
    
    // === INICIO: CÁLCULO MODIFICADO ===
    const subtotal = parseFloat(cotizacion.subtotal || 0);
    const igv = parseFloat(cotizacion.igv || 0);
    const total = parseFloat(cotizacion.total || 0);
    // === FIN: CÁLCULO MODIFICADO ===

    return `
        <html>
            <head>
                <title>Cotización - ${cotizacion.id}</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 30px; 
                        line-height: 1.4; 
                        font-size: 11pt; 
                    }
                    
                    /* --- INICIO: NUEVOS ESTILOS DE CABECERA (PROFESIONAL) --- */
                    .header { 
                        margin-bottom: 20px; 
                        border-bottom: 2px solid #27ae60; 
                        padding-bottom: 20px; 
                    }
                    .header-main {
                        display: flex;
                        align-items: center;
                        gap: 20px;
                        margin-bottom: 20px;
                    }
                    .logo-container {
                        flex-shrink: 0;
                    }
                    .logo-img {
                        max-width: 120px;
                        height: auto;
                    }
                    .company-info {
                        flex-grow: 1;
                        text-align: left;
                    }
                    .company-info h2 {
                        font-size: 18px;
                        margin-bottom: 8px;
                        color: #2c3e50;
                        margin-top: 0;
                    }
                    .company-info p {
                        font-size: 12px;
                        margin: 2px 0;
                        color: #2c3e50;
                        font-weight: 500;
                    }
                    .title-container {
                        text-align: center;
                    }
                    .title-container hr {
                        margin-top: 0;
                        border: 0;
                        border-top: 1px solid #ccc;
                        margin-bottom: 15px;
                    }
                    /* --- FIN: NUEVOS ESTILOS DE CABECERA --- */

                    .client-info, .quotation-info { 
                        margin-bottom: 15px; 
                    }
                    .client-info h3, .quotation-info h3 {
                        font-size: 14pt;
                        color: #2c3e50;
                        border-bottom: 1px solid #eee;
                        padding-bottom: 5px;
                        margin-bottom: 10px;
                    }
                    .client-info p, .quotation-info p {
                        margin-bottom: 5px;
                        font-size: 11pt;
                    }

                    .products-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 20px 0; 
                    }
                    .products-table th, .products-table td { 
                        padding: 8px; /* Reducido */
                        border: 1px solid #ddd; 
                        text-align: left; 
                        font-size: 10pt; /* Reducido */
                    }
                    .products-table th { background: #f5f5f5; }
                    .total-row td, .summary-row td { 
                        font-weight: bold; 
                        text-align: right;
                    }
                    .products-table tfoot .total-row td {
                        font-size: 12pt;
                        color: #219150;
                        border-top: 2px solid #000;
                    }
                    .footer { 
                        margin-top: 30px; 
                        text-align: center; 
                        font-size: 10pt; /* Reducido */
                        color: #7f8c8d; 
                    }
                    @media print { 
                        body { margin: 20px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                  <div class="header-main">
                    <div class="logo-container">
                      <img src="../logoinfo.png" alt="Logo INFOCOM" class="logo-img">
                    </div>
                    <div class="company-info">
                      <h2>INFOCOM TECNOLOGY</h2>
                      <p>FRANCO TARAPA EDSON ADRIAN</p>
                      <p>RUC: 10479533852</p>
                      <p>ILO - MOQUEGUA</p>
                      <p>TEL: 983326971</p>
                    </div>
                  </div>
                  
                  <div class="title-container">
                    <hr>
                    <h3>COTIZACIÓN</h3>
                  </div>
                </div>
                <div class="client-info">
                    <h3>DATOS DEL CLIENTE</h3>
                    <p><strong>Nombre/Razón Social:</strong> ${cotizacion.cliente_nombre || 'N/A'}</p>
                    <p><strong>Documento:</strong> ${cotizacion.cliente_tipo_doc || 'N/A'}: ${cotizacion.cliente_num_doc || 'N/A'}</p>
                    <p><strong>Teléfono:</strong> ${cotizacion.cliente_telefono || 'N/A'}</p>
                </div>
                
                <div class="quotation-info">
                    <h3>INFORMACIÓN DE COTIZACIÓN</h3>
                    <p><strong>N° Cotización:</strong> ${cotizacion.id || 'N/A'}</p>
                    <p><strong>Fecha:</strong> ${cotizacion.fecha ? new Date(cotizacion.fecha).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Estado:</strong> ${getStatusText(cotizacion.estado)}</p>
                </div>
                
                <h3>DETALLE DE PRODUCTOS</h3>
                <table class="products-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Marca</th>
                            <th style="width: 10%;">Imagen</th> <th>Cantidad</th>
                            <th>Precio Unit.</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cotizacion.detalles ? cotizacion.detalles.map(detalle => {
                            const subtotalItem = detalle.cantidad * detalle.precio_unitario;
                            const imageUrl = detalle.producto_imagen || '../logoinfo.png'; // Usar la imagen obtenida
                            
                            return `
                                <tr>
                                    <td>${detalle.producto_nombre || 'Producto no encontrado'}</td>
                                    <td>${detalle.producto_marca || 'N/A'}</td>
                                    <td style="text-align: center;"> <img src="${imageUrl}" 
                                             alt="${detalle.producto_nombre}" 
                                             style="width: 40px; height: 40px; object-fit: cover;"
                                             onerror="this.src='../logoinfo.png'">
                                    </td>
                                    <td>${detalle.cantidad}</td>
                                    <td>S/ ${parseFloat(detalle.precio_unitario).toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
                                    <td>S/ ${subtotalItem.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
                                </tr>
                            `;
                        }).join('') : ''}
                    </tbody>
                    <tfoot>
                        <tr class="summary-row">
                            <td colspan="4">SUBTOTAL:</td>
                            <td>S/ ${subtotal.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
                        </tr>
                        <tr class="summary-row">
                            <td colspan="4">IGV (18%):</td>
                            <td>S/ ${igv.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="4">TOTAL:</td>
                            <td>S/ ${total.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
                        </tr>
                    </tfoot>
                    </table>
                
                <div class="footer">
                    <p>Documento generado el ${new Date().toLocaleString()}</p>
                    <p>¡Gracias por su preferencia!</p>
                </div>
                
                <script>
                    window.onload = function() {
                        window.print();
                    };
                <\/script>
            </body>
        </html>
    `;
}
// --- INICIO: FUNCIÓN PARA WHATSAPP (CON GENERACIÓN DE PDF) ---
function enviarCotizacionPorWhatsApp() {
  if (!cotizacionActual) {
    alert('No hay cotización seleccionada.');
    return;
  }
  
  const clientPhone = cotizacionActual.cliente_telefono;
  if (!clientPhone || clientPhone.trim() === '') {
    alert('Esta cotización no tiene un número de teléfono registrado.');
    return;
  }

  // 1. Generar el HTML de la cotización (usamos un nuevo helper)
  const cotizacionHTML = generarHTMLTicketCotizacion(cotizacionActual);
  
  // 2. Configurar html2pdf (Formato A4)
  const nombreArchivo = `cotizacion-${cotizacionActual.id}.pdf`;
  const opt = {
    margin:       10, // 10mm margins
    filename:     nombreArchivo,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  // 3. Generar y descargar el PDF
  html2pdf().from(cotizacionHTML).set(opt).save().then(() => {
    // 4. Abrir WhatsApp
    const numeroLimpio = clientPhone.replace(/[^0-9]/g, '');
    const numeroWhatsApp = `51${numeroLimpio}`; // Asumimos 51 (Perú)
    const link = `https://wa.me/${numeroWhatsApp}?text=Estimado%20cliente,%20le%20adjuntamos%20la%20cotizaci%C3%B3n%20N%C2%B0%20${cotizacionActual.id}.`;
    
    window.open(link, '_blank');
    alert('PDF generado. Abriendo WhatsApp...');
  }).catch((err) => {
    alert('Error al generar el PDF: ' + err);
  });
}

// --- NUEVO HELPER (CON IMAGEN) ---
// Este helper genera SÓLO el div imprimible, no la página HTML completa
function generarHTMLTicketCotizacion(cotizacion) {
    const subtotal = parseFloat(cotizacion.subtotal || 0);
    const igv = parseFloat(cotizacion.igv || 0);
    const total = parseFloat(cotizacion.total || 0);

    // Estilos CSS para el PDF
    const estilos = `
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; line-height: 1.4; font-size: 11pt; }
            .ticket-a4 { padding: 10mm; }
            .header { margin-bottom: 20px; border-bottom: 2px solid #27ae60; padding-bottom: 20px; }
            .header-main { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
            .logo-img { max-width: 120px; height: auto; }
            .company-info { flex-grow: 1; text-align: left; }
            .company-info h2 { font-size: 18px; margin-bottom: 8px; color: #2c3e50; margin-top: 0; }
            .company-info p { font-size: 12px; margin: 2px 0; color: #2c3e50; font-weight: 500; }
            .title-container { text-align: center; }
            .title-container hr { margin-top: 0; border: 0; border-top: 1px solid #ccc; margin-bottom: 15px; }
            .client-info, .quotation-info { margin-bottom: 15px; }
            .client-info h3, .quotation-info h3 { font-size: 14pt; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px; }
            .client-info p, .quotation-info p { margin-bottom: 5px; font-size: 11pt; }
            .products-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .products-table th, .products-table td { padding: 8px; border: 1px solid #ddd; text-align: left; font-size: 10pt; }
            .products-table th { background: #f5f5f5; }
            .total-row td, .summary-row td { font-weight: bold; text-align: right; }
            .products-table tfoot .total-row td { font-size: 12pt; color: #219150; border-top: 2px solid #000; }
        </style>
    `;

    // Contenido HTML del PDF
    const body = `
        <div class="header">
          <div class="header-main">
            <div class="logo-container"><img src="../logoinfo.png" alt="Logo INFOCOM" class="logo-img" style="width:120px; height:auto;"></div>
            <div class="company-info">
              <h2>INFOCOM TECNOLOGY</h2>
              <p>FRANCO TARAPA EDSON ADRIAN</p><p>RUC: 10479533852</p><p>ILO - MOQUEGUA</p><p>TEL: 983326971</p>
            </div>
          </div>
          <div class="title-container"><hr><h3>COTIZACIÓN</h3></div>
        </div>
        <div class="client-info">
            <h3>DATOS DEL CLIENTE</h3>
            <p><strong>Nombre/Razón Social:</strong> ${cotizacion.cliente_nombre || 'N/A'}</p>
            <p><strong>Documento:</strong> ${cotizacion.cliente_tipo_doc || 'N/A'}: ${cotizacion.cliente_num_doc || 'N/A'}</p>
            <p><strong>Teléfono:</strong> ${cotizacion.cliente_telefono || 'N/A'}</p>
        </div>
        <div class="quotation-info">
            <h3>INFORMACIÓN DE COTIZACIÓN</h3>
            <p><strong>N° Cotización:</strong> ${cotizacion.id || 'N/A'}</p>
            <p><strong>Fecha:</strong> ${cotizacion.fecha ? new Date(cotizacion.fecha).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Estado:</strong> ${getStatusText(cotizacion.estado)}</p>
        </div>
        <h3>DETALLE DE PRODUCTOS</h3>
        <table class="products-table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Marca</th>
                    <th style="width: 10%;">Img</th> <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${cotizacion.detalles ? cotizacion.detalles.map(detalle => {
                    const subtotalItem = detalle.cantidad * detalle.precio_unitario;
                    const imageUrl = detalle.producto_imagen || '../logoinfo.png'; // Usar la imagen obtenida
                    
                    return `<tr>
                        <td>${detalle.producto_nombre || 'Producto no encontrado'}</td>
                        <td>${detalle.producto_marca || 'N/A'}</td>
                        <td style="text-align: center;"> <img src="${imageUrl}" 
                                 alt="${detalle.producto_nombre}" 
                                 style="width: 30px; height: 30px; object-fit: cover;"
                                 onerror="this.src='../logoinfo.png'">
                        </td>
                        <td>${detalle.cantidad}</td>
                        <td>S/ ${parseFloat(detalle.precio_unitario).toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
                        <td>S/ ${subtotalItem.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
                    </tr>`;
                }).join('') : ''}
            </tbody>
            <tfoot>
                <tr class="summary-row"><td colspan="4">SUBTOTAL:</td><td>S/ ${subtotal.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td></tr>
                <tr class="summary-row"><td colspan="4">IGV (18%):</td><td>S/ ${igv.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td></tr>
                <tr class="total-row"><td colspan="4">TOTAL:</td><td>S/ ${total.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td></tr>
            </tfoot>
        </table>
    `;
    
    // Devolvemos un solo div que envuelve todo el contenido para html2pdf
    return `<div class="ticket-a4">${estilos}${body}</div>`;
}
// --- FIN: CÓDIGO PARA COTIZACION.JS ---