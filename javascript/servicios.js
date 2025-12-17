//
// javascript/servicios.js - VERSIÓN FINAL CORREGIDA (TICKET UNIFORME + HORA REAL)
// ==================================================

// --- Variables Globales ---
let serviciosData = [];
let serviciosFiltrados = [];
let productosData = []; 
let productosServicio = []; 
let productoSeleccionado = null;
let servicioActual = null; 
let servicioAEliminar = null;
let vendedorActual = 'Usuario'; 
// --- INICIO DE MODIFICACIÓN ---
let usuariosRolesServicio = []; 
const API_USERS_ROLES_SERVICIOS = '../php/get_users_by_role.php';
let isSuperUserServicio = false; 
// --- FIN DE MODIFICACIÓN ---

// --- URLs de la API ---
const API_SERVICIOS = '../api/servicios_tecnicos.php';
const API_SERVICIOS_DETALLE = '../api/servicios_tecnicos_detalle.php';
const API_PRODUCTOS = '../api/productos.php';

// --- FUNCIONES AUXILIARES DE IMPRESIÓN ---

function getPrintParams(size) {
    const is80mm = size === '80';
    return {
        width: is80mm ? '80mm' : '58mm',
        windowWidth: is80mm ? 500 : 380, // Pixels for window.open
        pdfFormat: is80mm ? [80, 450] : [58, 350], // [width, max_height] in mm
        scale: is80mm ? 1.5 : 2.0 // Mayor escala para 80mm
    };
}
// --- FIN FUNCIONES AUXILIARES DE IMPRESIÓN ---

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', function() {
  setActiveMenuItem();
  cargarVendedorActual();
  cargarProductosDesdeBD();
  // --- INICIO DE MODIFICACIÓN: Llamada a la nueva función de chequeo ---
  checkUserRoleAndLoadServices();
  // --- FIN DE MODIFICACIÓN ---
  
  const searchInput = document.getElementById('search-input');
  if(searchInput) searchInput.addEventListener('input', filtrarServicios);
  
  const statusFilter = document.getElementById('status-filter');
  if(statusFilter) statusFilter.addEventListener('change', filtrarServicios);
  
  const dateFilter = document.getElementById('date-filter');
  if(dateFilter) dateFilter.addEventListener('change', filtrarServicios);
  
  // --- INICIO DE MODIFICACIÓN: Listener para filtro de usuario ---
  const userFilter = document.getElementById('services-user-filter');
  if(userFilter) userFilter.addEventListener('change', cargarServiciosDesdeBD); // Recarga la API al cambiar el usuario
  // --- FIN DE MODIFICACIÓN ---
  
  const nuevoForm = document.getElementById('nuevo-form');
  if(nuevoForm) nuevoForm.addEventListener('submit', guardarNuevoServicio);
  
  const editForm = document.getElementById('edit-form');
  if(editForm) editForm.addEventListener('submit', guardarEdicion);
  
  const confirmDelete = document.getElementById('confirm-delete');
  if(confirmDelete) confirmDelete.addEventListener('click', eliminarServicio);

  inicializarBuscadores();
  
  document.querySelectorAll('input[name="nuevo-comprobante"]').forEach(radio => {
    radio.addEventListener('change', () => actualizarTotalServicio('nuevo'));
  });
  document.querySelectorAll('input[name="edit-comprobante"]').forEach(radio => {
    radio.addEventListener('change', () => actualizarTotalServicio('edit'));
  });
});

function setActiveMenuItem() {
  document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
  const activeItem = document.querySelector('a[href*="servicios.html"]');
  if (activeItem) activeItem.classList.add('active');
}

async function cargarVendedorActual() {
    try {
        const response = await fetch('../php/check_session.php');
        const data = await response.json();
        if (data.success) {
            vendedorActual = data.nombre_completo || data.username || 'Usuario';
        }
    } catch (e) { console.error('Error auth', e); }
}

async function cargarProductosDesdeBD() {
    try {
        const response = await fetch(API_PRODUCTOS);
        if (response.ok) productosData = await response.json();
    } catch (error) { console.error(error); }
}

// --- NUEVAS FUNCIONES: Lógica de Super Usuario (Edson) ---
async function checkUserRoleAndLoadServices() {
    try {
        const response = await fetch('../php/check_session.php');
        const data = await response.json();
        const username = data.username || '';
        
        // Verifica si es el Super Usuario "Edson"
        if (username === 'Edson') {
            isSuperUserServicio = true;
            const filtersContainer = document.getElementById('services-super-user-filters');
            if (filtersContainer) filtersContainer.style.display = 'flex';
            await loadServiceUsers();
        }
    } catch (e) {
        console.error('Error al verificar sesión:', e);
    }
    // Cargar servicios DESPUÉS de comprobar el rol (para aplicar el filtro)
    cargarServiciosDesdeBD();
}

async function loadServiceUsers() {
    try {
        // Roles relevantes para Servicios: 'soporte', 'admin' y 'ventas' (todos pueden registrar)
        const response = await fetch(`${API_USERS_ROLES_SERVICIOS}?roles=soporte,admin,ventas`); 
        const data = await response.json();
        
        if (data.success) {
            usuariosRolesServicio = data.users;
            const select = document.getElementById('services-user-filter');
            if (!select) return;
            select.innerHTML = '<option value="all">Todos los Técnicos/Vendedores</option>';
            
            usuariosRolesServicio.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `${user.nombre_completo} (${user.rol_asignado})`;
                select.appendChild(option);
            });
        }
    } catch (e) {
        console.error('Error al cargar usuarios de servicio:', e);
    }
}
// --- FIN NUEVAS FUNCIONES ---

// --- CARGA DE SERVICIOS (MODIFICADA) ---
async function cargarServiciosDesdeBD() {
  mostrarCargaTabla(true);
  
  // --- INICIO DE MODIFICACIÓN: Agregar filtro de usuario a la URL ---
  const userFilterValue = document.getElementById('services-user-filter')?.value;
  let apiUrl = API_SERVICIOS;
  
  if (isSuperUserServicio && userFilterValue && userFilterValue !== 'all') {
      apiUrl += `?usuario_id=${userFilterValue}`;
  }
  // --- FIN DE MODIFICACIÓN ---
  
  try {
    const response = await fetch(apiUrl); // Usar la URL construida
    if (response.ok) {
      serviciosData = await response.json();
      serviciosFiltrados = [...serviciosData];
      // Aplicar filtros locales después de cargar los datos
      filtrarServicios(); 
    }
  } catch (error) { console.error(error); } 
  finally { mostrarCargaTabla(false); }
}

function cargarServiciosEnTabla() {
  const tbody = document.getElementById('servicios-body');
  const table = document.getElementById('servicios-table');
  const emptyState = document.getElementById('table-empty');
  
  if (!tbody) return;

  if (serviciosFiltrados.length === 0) {
    if(table) table.style.display = 'none';
    if(emptyState) emptyState.style.display = 'flex';
    return;
  }
  
  if(table) table.style.display = 'table';
  if(emptyState) emptyState.style.display = 'none';
  tbody.innerHTML = '';
  
  serviciosFiltrados.forEach(servicio => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${servicio.id}</td>
      <td>${servicio.cliente_nombre}</td>
      <td>${servicio.equipo_nombre}</td>
      <td title="${servicio.equipo_problema}">${servicio.equipo_problema ? servicio.equipo_problema.substring(0, 30) : ''}...</td>
      <td>S/ ${parseFloat(servicio.total).toFixed(2)}</td>
      <td><span class="status-badge status-${servicio.estado}">${servicio.estado}</span></td>
      <td>${formatearFecha(servicio.fecha_ingreso)}</td>
      <td class="actions">
        <button class="action-btn btn-view" onclick="verDetalles('${servicio.id}')"><i class="fa-solid fa-eye"></i></button>
        <button class="action-btn btn-edit" onclick="editarServicio('${servicio.id}')"><i class="fa-solid fa-edit"></i> </button>
        <button class="action-btn btn-delete" onclick="confirmarEliminar('${servicio.id}')"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filtrarServicios() {
  const searchInput = document.getElementById('search-input');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  
  const statusFilter = document.getElementById('status-filter').value;
  const dateFilter = document.getElementById('date-filter').value;
  
  // Note: Si el filtro de usuario está activo, `serviciosData` ya está filtrado por usuario.
  // Aquí aplicamos los filtros locales (búsqueda, estado, fecha) a la data ya cargada.
  serviciosFiltrados = serviciosData.filter(servicio => {
    const matchesSearch = searchTerm === '' || 
      (servicio.cliente_nombre && servicio.cliente_nombre.toLowerCase().includes(searchTerm)) ||
      (servicio.cliente_num_doc && servicio.cliente_num_doc.includes(searchTerm)) ||
      (servicio.equipo_nombre && servicio.equipo_nombre.toLowerCase().includes(searchTerm)) ||
      (servicio.vendedor_nombre && servicio.vendedor_nombre.toLowerCase().includes(searchTerm)); // Se agrega filtro por nombre de vendedor
    
    const matchesStatus = statusFilter === 'all' || servicio.estado === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all' && servicio.fecha_ingreso) {
        const hoy = new Date();
        const fechaServicio = new Date(servicio.fecha_ingreso);
        const mismoDia = fechaServicio.toDateString() === hoy.toDateString();
        const diffDays = Math.ceil(Math.abs(hoy - fechaServicio) / (1000 * 60 * 60 * 24)); 
        const mismaSemana = diffDays <= 7;
        const mismoMes = fechaServicio.getMonth() === hoy.getMonth() && fechaServicio.getFullYear() === hoy.getFullYear();

        if (dateFilter === 'today' && !mismoDia) matchesDate = false;
        if (dateFilter === 'week' && !mismaSemana) matchesDate = false;
        if (dateFilter === 'month' && !mismoMes) matchesDate = false;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });
  
  cargarServiciosEnTabla();
}

// --- MODALES Y CRUD ---
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if(modal) {
      if (modalId === 'modal-nuevo') {
        document.getElementById('nuevo-form').reset();
        productosServicio = [];
        actualizarTablaProductos('nuevo');
        actualizarTotalServicio('nuevo');
        const today = new Date();
        const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        document.getElementById('nuevo-fecha-ingreso').value = localDate;
        const radioBoleta = document.getElementById('nuevo-tipo-boleta');
        if(radioBoleta) radioBoleta.checked = true;
      }
      modal.style.display = 'flex';
  }
}

function cerrarModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'none';
}

window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.style.display = 'none';
  }
}

// --- FUNCIÓN NUEVA: Obtener hora actual ---
function obtenerHoraActual() {
    const ahora = new Date();
    return ahora.getHours().toString().padStart(2, '0') + ':' + 
           ahora.getMinutes().toString().padStart(2, '0') + ':' + 
           ahora.getSeconds().toString().padStart(2, '0');
}

// --- GUARDAR NUEVO SERVICIO (MODIFICADO) ---
async function guardarNuevoServicio(e) {
  e.preventDefault();
  const totalCalculado = actualizarTotalServicio('nuevo');
  
  // Capturar fecha y añadir hora actual
  const fechaInput = document.getElementById('nuevo-fecha-ingreso').value;
  const fechaConHora = `${fechaInput} ${obtenerHoraActual()}`;
  
  const servicioData = {
    cliente_tipo_doc: document.getElementById('nuevo-tipo-doc').value,
    cliente_num_doc: document.getElementById('nuevo-num-doc').value,
    cliente_nombre: document.getElementById('nuevo-cliente').value,
    cliente_telefono: document.getElementById('nuevo-telefono').value,
    equipo_tipo: document.getElementById('nuevo-tipo-equipo').value,
    equipo_nombre: document.getElementById('nuevo-nombre-equipo').value,
    equipo_problema: document.getElementById('nuevo-problema').value,
    fecha_ingreso: fechaConHora, // Fecha con hora incluida
    costo_servicio: parseFloat(document.getElementById('nuevo-costo-servicio').value) || 0,
    estado: document.getElementById('nuevo-estado').value,
    tipo_comprobante: document.querySelector('input[name="nuevo-comprobante"]:checked').value,
    subtotal_productos: totalCalculado.subtotalProductos,
    total: totalCalculado.totalFinal,
    productos: productosServicio.map(p => ({
        producto_id: p.producto_id,
        cantidad: p.cantidad,
        precio_unitario: p.precio_unitario,
        subtotal: p.subtotal
    }))
  };

  try {
    const response = await fetch(API_SERVICIOS, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(servicioData)
    });
    const result = await response.json();
    if (result.success) {
        mostrarNotificacion('Servicio registrado correctamente', 'success');
        cerrarModal('modal-nuevo');
        cargarServiciosDesdeBD();
        cargarProductosDesdeBD();
    } else {
        throw new Error(result.error || 'Error al guardar');
    }
  } catch (error) {
    mostrarNotificacion(error.message, 'error');
  }
}

async function editarServicio(id) {
    try {
        const response = await fetch(`${API_SERVICIOS_DETALLE}?id=${id}`);
        if (!response.ok) throw new Error('Error al cargar servicio');
        const servicio = await response.json();
        servicioActual = servicio;
        
        document.getElementById('edit-servicio-id').value = servicio.id;
        document.getElementById('edit-tipo-doc').value = servicio.cliente_tipo_doc;
        document.getElementById('edit-num-doc').value = servicio.cliente_num_doc;
        document.getElementById('edit-cliente').value = servicio.cliente_nombre;
        document.getElementById('edit-telefono').value = servicio.cliente_telefono;
        document.getElementById('edit-tipo-equipo').value = servicio.equipo_tipo;
        document.getElementById('edit-nombre-equipo').value = servicio.equipo_nombre;
        document.getElementById('edit-problema').value = servicio.equipo_problema;
        if(servicio.fecha_ingreso) {
             document.getElementById('edit-fecha-ingreso').value = servicio.fecha_ingreso.split(' ')[0];
        }
        document.getElementById('edit-costo-servicio').value = parseFloat(servicio.costo_servicio).toFixed(2);
        document.getElementById('edit-estado').value = servicio.estado;
        
        const tipo = (servicio.tipo_comprobante === 'ninguno' || !servicio.tipo_comprobante) ? 'boleta' : servicio.tipo_comprobante;
        const radio = document.querySelector(`input[name="edit-comprobante"][value="${tipo}"]`);
        if(radio) radio.checked = true;

        productosServicio = servicio.productos.map(p => ({
            ...p,
            producto_id: p.producto_id,
            producto_nombre: p.producto_nombre,
            producto_marca: p.producto_marca
        }));
        
        actualizarTablaProductos('edit');
        actualizarTotalServicio('edit');
        openModal('modal-editar');
        
    } catch (error) { mostrarNotificacion(error.message, 'error'); }
}

// --- GUARDAR EDICIÓN (MODIFICADO) ---
async function guardarEdicion(e) {
  e.preventDefault();
  const id = document.getElementById('edit-servicio-id').value;
  const totalCalculado = actualizarTotalServicio('edit');
  
  // Lógica de fecha y hora
  const fechaInput = document.getElementById('edit-fecha-ingreso').value;
  let fechaConHora = `${fechaInput} ${obtenerHoraActual()}`;

  // Mantener hora original si la fecha no ha cambiado
  if (servicioActual && servicioActual.fecha_ingreso) {
      const [fechaOriginal, horaOriginal] = servicioActual.fecha_ingreso.split(' ');
      if (fechaOriginal === fechaInput) {
          fechaConHora = `${fechaInput} ${horaOriginal}`;
      }
  }
  
  const servicioData = {
    id: id,
    cliente_tipo_doc: document.getElementById('edit-tipo-doc').value,
    cliente_num_doc: document.getElementById('edit-num-doc').value,
    cliente_nombre: document.getElementById('edit-cliente').value,
    cliente_telefono: document.getElementById('edit-telefono').value,
    equipo_tipo: document.getElementById('edit-tipo-equipo').value,
    equipo_nombre: document.getElementById('edit-nombre-equipo').value,
    equipo_problema: document.getElementById('edit-problema').value,
    fecha_ingreso: fechaConHora, // Fecha con hora
    costo_servicio: parseFloat(document.getElementById('edit-costo-servicio').value) || 0,
    estado: document.getElementById('edit-estado').value,
    tipo_comprobante: document.querySelector('input[name="edit-comprobante"]:checked').value,
    subtotal_productos: totalCalculado.subtotalProductos,
    total: totalCalculado.totalFinal,
    productos: productosServicio.map(p => ({
        producto_id: p.producto_id,
        cantidad: p.cantidad,
        precio_unitario: p.precio_unitario,
        subtotal: p.subtotal
    }))
  };

  try {
    const response = await fetch(`${API_SERVICIOS}?id=${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(servicioData)
    });
    const result = await response.json();
    if (result.success) {
        mostrarNotificacion('Actualizado correctamente', 'success');
        cerrarModal('modal-editar');
        cargarServiciosDesdeBD();
        cargarProductosDesdeBD();
    } else {
        throw new Error(result.error || 'Error al actualizar');
    }
  } catch (error) { mostrarNotificacion(error.message, 'error'); }
}

function confirmarEliminar(id) {
  servicioAEliminar = id;
  document.getElementById('delete-message').textContent = `¿Eliminar servicio ${id}?`;
  openModal('modal-eliminar');
}

async function eliminarServicio() {
  if (!servicioAEliminar) return;
  try {
    const response = await fetch(`${API_SERVICIOS}?id=${servicioAEliminar}`, { method: 'DELETE' });
    const result = await response.json();
    if (result.success) {
        mostrarNotificacion('Eliminado correctamente', 'success');
        cerrarModal('modal-eliminar');
        cargarServiciosDesdeBD();
        cargarProductosDesdeBD();
    } else {
        throw new Error(result.error || 'Error al eliminar');
    }
  } catch (error) { mostrarNotificacion(error.message, 'error'); }
  servicioAEliminar = null;
}

// --- GESTIÓN DE PRODUCTOS ---
function inicializarBuscadores() {
    const configs = [
        { input: 'nuevo-product-search', dropdown: 'nuevo-product-dropdown', tipo: 'nuevo' },
        { input: 'edit-product-search', dropdown: 'edit-product-dropdown', tipo: 'edit' }
    ];

    configs.forEach(c => {
        const inp = document.getElementById(c.input);
        const dd = document.getElementById(c.dropdown);
        if(inp && dd) {
            inp.addEventListener('input', () => buscarProductos(inp.value, dd, c.tipo));
            inp.addEventListener('focus', () => buscarProductos(inp.value, dd, c.tipo));
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.searchable-select')) {
            document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('active'));
        }
    });
}

function buscarProductos(termino, dropdownEl, tipo) {
    termino = termino.toLowerCase();
    let resultados = productosData.filter(p => 
        (p.nombre && p.nombre.toLowerCase().includes(termino)) || 
        (p.marca && p.marca.toLowerCase().includes(termino))
    );
    
    dropdownEl.innerHTML = '';
    if (resultados.length === 0) {
        dropdownEl.innerHTML = '<div class="no-results">Sin resultados</div>';
    } else {
        resultados.forEach(p => {
            const div = document.createElement('div');
            div.className = 'dropdown-item';
            div.innerHTML = `
                <div class="product-name">${p.nombre}</div>
                <div class="product-details">
                   <span>${p.marca}</span>
                   <span class="product-price">S/ ${parseFloat(p.precio).toFixed(2)}</span>
                </div>`;
            div.onclick = () => seleccionarProducto(p, tipo);
            dropdownEl.appendChild(div);
        });
    }
    dropdownEl.classList.add('active');
}

function seleccionarProducto(producto, tipo) {
    productoSeleccionado = producto;
    document.getElementById(`${tipo}-product-search`).value = producto.nombre;
    document.getElementById(`${tipo}-product-dropdown`).classList.remove('active');
    document.getElementById(`${tipo}-product-quantity`).focus();
}

function agregarProductoServicio(tipo) {
    const inputCant = document.getElementById(`${tipo}-product-quantity`);
    const cantidad = parseInt(inputCant.value);

    if (!productoSeleccionado) {
        mostrarNotificacion('Seleccione un producto', 'warning');
        return;
    }
    if (isNaN(cantidad) || cantidad <= 0) {
        mostrarNotificacion('Cantidad inválida', 'warning');
        return;
    }
    
    const prodExistente = productosServicio.find(p => p.producto_id === productoSeleccionado.id);
    
    if (prodExistente) {
        prodExistente.cantidad += cantidad;
        prodExistente.subtotal = prodExistente.cantidad * prodExistente.precio_unitario;
    } else {
        productosServicio.push({
            producto_id: productoSeleccionado.id,
            producto_nombre: productoSeleccionado.nombre,
            producto_marca: productoSeleccionado.marca,
            cantidad: cantidad,
            precio_unitario: parseFloat(productoSeleccionado.precio),
            subtotal: cantidad * parseFloat(productoSeleccionado.precio)
        });
    }

    actualizarTablaProductos(tipo);
    actualizarTotalServicio(tipo);
    
    productoSeleccionado = null;
    document.getElementById(`${tipo}-product-search`).value = '';
    const addDropdown = document.getElementById(`${tipo}-product-dropdown`);
    if(addDropdown) addDropdown.classList.remove('active');
    inputCant.value = 1;
}

function actualizarTablaProductos(tipo) {
    const tbody = document.getElementById(`${tipo}-products-body`);
    tbody.innerHTML = '';
    productosServicio.forEach((p, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.producto_nombre}</td>
            <td>${p.cantidad}</td>
            <td>S/ ${p.precio_unitario.toFixed(2)}</td>
            <td>S/ ${p.subtotal.toFixed(2)}</td>
            <td>
                <button type="button" class="action-btn btn-delete" onclick="eliminarProductoServicio(${index}, '${tipo}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function eliminarProductoServicio(index, tipo) {
    productosServicio.splice(index, 1);
    actualizarTablaProductos(tipo);
    actualizarTotalServicio(tipo);
}

function actualizarTotalServicio(tipo) {
    const costoServicio = parseFloat(document.getElementById(`${tipo}-costo-servicio`).value) || 0;
    const subtotalProductos = productosServicio.reduce((sum, p) => sum + p.subtotal, 0);
    const tipoComprobante = document.querySelector(`input[name="${tipo}-comprobante"]:checked`).value;
    
    let subtotalNeto = costoServicio + subtotalProductos;
    let totalFinal = subtotalNeto;
    
    if (tipoComprobante === 'factura') {
        totalFinal = subtotalNeto * 1.18;
    }

    document.getElementById(`${tipo}-subtotal-productos`).textContent = `S/ ${subtotalProductos.toFixed(2)}`;
    document.getElementById(`${tipo}-total-servicio`).textContent = `S/ ${costoServicio.toFixed(2)}`;
    document.getElementById(`${tipo}-total-final`).textContent = `S/ ${totalFinal.toFixed(2)}`;
    
    return { subtotalProductos, totalFinal };
}

// --- VISUALIZACIÓN ---
async function verDetalles(id) {
  try {
    const response = await fetch(`${API_SERVICIOS_DETALLE}?id=${id}`);
    if (!response.ok) throw new Error('Error detalle servicio');
    servicioActual = await response.json();
    
    const container = document.getElementById('detalles-content');
    const { total, subtotal_productos, costo_servicio } = servicioActual;
    
    let productosHTML = '<p>No hay productos</p>';
    if (servicioActual.productos && servicioActual.productos.length > 0) {
        productosHTML = `
            <table class="products-table">
                <thead><tr><th>Producto</th><th>Cant.</th><th>P.U.</th><th>Subt.</th></tr></thead>
                <tbody>
                    ${servicioActual.productos.map(p => `
                        <tr>
                            <td>${p.producto_nombre}</td>
                            <td>${p.cantidad}</td>
                            <td>${p.precio_unitario.toFixed(2)}</td>
                            <td>${p.subtotal.toFixed(2)}</td>
                        </tr>`).join('')}
                </tbody>
            </table>`;
    }

    container.innerHTML = `
        <div class="detalle-header">
            <div><strong>Cliente:</strong> ${servicioActual.cliente_nombre}</div>
            <div><strong>Equipo:</strong> ${servicioActual.equipo_nombre}</div>
        </div>
        <div style="margin: 10px 0; padding: 10px; background:#f9f9f9; border-radius:4px;">
            <strong>Problema:</strong><br>
            ${servicioActual.equipo_problema}
        </div>
        ${productosHTML}
        <div class="detalle-totales" style="margin-top:15px; text-align:right;">
            <div>Prod: S/ ${subtotal_productos.toFixed(2)}</div>
            <div>Serv: S/ ${costo_servicio.toFixed(2)}</div>
            <div style="font-size:1.2em; font-weight:bold; color:var(--primary-color);">Total: S/ ${total.toFixed(2)}</div>
        </div>
    `;
    openModal('modal-detalles');
  } catch (error) { console.error(error); }
}

// =================================================================
// ===== SISTEMA DE IMPRESIÓN Y ENVÍO (CON 58MM Y 80MM) =====
// =================================================================

/**
 * Función principal para generar el comprobante (A4, 58mm, 80mm).
 * @param {string} tipo - 'a4', 'pos58', o 'pos80'.
 */
function generarComprobante(tipo) {
    if (!servicioActual) return;

    let contenidoHTML = '';
    let ancho = 400, alto = 600;
    
    const size = tipo.includes('58') ? '58' : tipo.includes('80') ? '80' : 'A4';
    const params = getPrintParams(size);

    if (tipo === 'a4') {
        contenidoHTML = generarHTMLServicioA4(servicioActual);
        ancho = 900;
        alto = 800;
    } else {
        // POS 58mm o POS 80mm
        contenidoHTML = `<div style="width: ${params.width}; margin: 0 auto;">${generarHTMLTicketServicio(servicioActual, size)}</div>`;
        ancho = params.windowWidth;
    }

    const ventana = window.open('', '', `width=${ancho},height=${alto}`);
    ventana.document.write(`
        <html>
        <head>
            <title>Imprimir Comprobante ${size}</title>
            <style>
                body { margin: 0; padding: 0; background: #fff; font-family: sans-serif; }
                @media print { 
                    @page { 
                        size: ${size === 'A4' ? 'A4' : params.width + ' auto'};
                        margin: 0; 
                    } 
                    body { margin: 0; } 
                }
            </style>
        </head>
        <body>
            ${contenidoHTML}
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(() => window.close(), 500);
                };
            <\/script>
        </body>
        </html>
    `);
    ventana.document.close();
}


/**
 * Función para generar el PDF de servicio y enviarlo por WhatsApp (58mm o 80mm).
 * @param {string} size - '58' o '80'.
 */
function enviarServicioPorWhatsApp(size) {
  if (!servicioActual) return;
  
  const clientPhone = servicioActual.cliente_telefono;
  if (!clientPhone) {
    alert('Sin teléfono registrado');
    return;
  }

  const params = getPrintParams(size);
  const ticketHTML = generarHTMLTicketServicio(servicioActual, size); // Pasa el size al generador de HTML
  const nombreArchivo = `Servicio-${servicioActual.id}-${size}mm.pdf`;

  const btnWhatsapp = document.querySelector(`.btn-whatsapp[onclick*="enviarServicioPorWhatsApp('${size}')"]`) || document.querySelector('.btn-whatsapp');
  const originalText = btnWhatsapp ? btnWhatsapp.innerHTML : '';
  if(btnWhatsapp) btnWhatsapp.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';

  const opt = {
      margin: 0,
      filename: nombreArchivo,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: params.scale, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: params.pdfFormat, orientation: 'portrait' }
  };

  html2pdf().from(ticketHTML).set(opt).save().then(() => {
    
      if(btnWhatsapp) btnWhatsapp.innerHTML = originalText;
      
      const numero = clientPhone.replace(/[^0-9]/g, '');
      const link = `https://wa.me/51${numero}?text=Hola,%20le%20adjuntamos%20su%20orden%20de%20servicio.`;
      window.open(link, '_blank');
      mostrarNotificacion('PDF generado. Abriendo WhatsApp...', 'success');
  }).catch(err => {
      if(btnWhatsapp) btnWhatsapp.innerHTML = originalText;
      console.error(err);
      mostrarNotificacion('Error al generar PDF', 'error');
  });
}

// --- 1. DISEÑO TICKET 58mm/80mm (MODIFICADO) ---
function generarHTMLTicketServicio(servicio, size = '58') {
    const total = parseFloat(servicio.total || 0);
    const costoServ = parseFloat(servicio.costo_servicio || 0);
    let vendedor = servicio.vendedor_nombre || vendedorActual;
    const rutaLogo = '../logoinfo.png';

    // Estilos CSS Inline ajustados (10px font, 1.5 line-height)
    const stContainer = "font-family: 'Courier New', Courier, monospace; font-size: 10px; color: black; background: white; padding: 5px; width: 100%; line-height: 1.5;";
    const stCenter = "text-align: center;";
    const stBold = "font-weight: bold;";
    // Línea punteada simple usando guiones (más compatible y fiel a la imagen)
    const stDashedLine = "border-bottom: 1px dashed #000; margin: 5px 0;";
    
    // Tabla de items simplificada
    const stTable = "width: 100%; border-collapse: collapse; font-size: 10px; line-height: 1.5;";
    // Forzamos font-size 10px en cada celda para evitar que se vea grande
    const stTd = "vertical-align: top; padding: 2px 0; font-size: 10px;"; 
    
    let itemsRows = '';
    if (servicio.productos && servicio.productos.length > 0) {
        servicio.productos.forEach(p => {
            itemsRows += `
            <tr>
                <td style="${stTd} width: 10%;">${p.cantidad}</td>
                <td style="${stTd} width: 65%;">${p.producto_nombre}</td>
                <td style="${stTd} width: 25%; text-align: right;">${(p.cantidad * p.precio_unitario).toFixed(2)}</td>
            </tr>`;
        });
    }
    
    // Fila Mano de Obra
    itemsRows += `
    <tr>
        <td style="${stTd}">1</td>
        <td style="${stTd}">Mano de Obra</td>
        <td style="${stTd} text-align: right;">${costoServ.toFixed(2)}</td>
    </tr>`;

    return `
    <div style="${stContainer}">
        
        <div style="${stCenter}">
            <img src="../logoinfo.png" style="width: 45px; display: block; margin: 0 auto 5px auto;" alt="Logo">
            <div style="${stBold} font-size: 12px;">INFOCOM TECNOLOGY</div>
            <div>RUC: 10479533852</div>
            <div>24 de Octubre MZ 53 LT 03</div>
            <div>ILO - MOQUEGUA</div>
            <div>Tel: 983326971</div>
        </div>

        <div style="${stDashedLine}"></div>

        <div style="margin-bottom: 5px;">
            <div><span style="${stBold}">ORDEN:</span> ${servicio.id}</div>
            <div><span style="${stBold}">FECHA:</span> ${formatearFecha(servicio.fecha_ingreso)}</div>
            <div><span style="${stBold}">CLIENTE:</span> ${servicio.cliente_nombre}</div>
            <div><span style="${stBold}">EQUIPO:</span> ${servicio.equipo_nombre}</div>
        </div>

        <div style="border: 1px solid #000; padding: 3px; margin: 5px 0;">
            <div style="${stBold}">PROBLEMA REPOR:</div>
            <div>${servicio.equipo_problema || 'Sin descripción'}</div>
        </div>

        <div style="${stDashedLine}"></div>

        <table style="${stTable}">
            <tr style="${stBold}">
                <td style="${stTd}">Cnt</td>
                <td style="${stTd}">Descrip.</td>
                <td style="${stTd} text-align: right;">Total</td>
            </tr>
            <tr><td colspan="3" style="border-bottom: 1px dashed #000; height: 1px;"></td></tr>
            ${itemsRows}
        </table>

        <div style="${stDashedLine}"></div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin: 5px 0;">
            <span style="${stBold} font-size: 12px;">TOTAL:</span>
            <span style="${stBold} font-size: 14px;">S/ ${total.toFixed(2)}</span>
        </div>

        <div style="${stDashedLine}"></div>

        <div style="${stCenter} margin-top: 5px;">
            <div>Atendido por: ${vendedor}</div>
            <div style="${stBold} margin-top: 5px; font-size: 11px;">¡GRACIAS POR ELEGIR INFOCOM!</div>
            <div style="font-size: 9px; margin: 0;">Esperamos que su equipo quede perfecto. Nuestro compromiso es ofrecerle el mejor servicio técnico.</div>
        </div>

    </div>`;
}

// --- 2. DISEÑO A4 PROFESIONAL (TIPO FACTURA) (MODIFICADO) ---
function generarHTMLServicioA4(servicio) {
    const total = parseFloat(servicio.total || 0);
    const costoServ = parseFloat(servicio.costo_servicio || 0);
    const rutaLogo = '../logoinfo.png';
    let vendedor = servicio.vendedor_nombre || vendedorActual;

    let itemsHTML = '';
    if (servicio.productos && servicio.productos.length > 0) {
        servicio.productos.forEach(p => {
            itemsHTML += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px; text-align: center;">${p.cantidad}</td>
                    <td style="padding: 8px;">${p.producto_nombre}<br><small style="color:#666;">${p.producto_marca || ''}</small></td>
                    <td style="padding: 8px; text-align: right;">S/ ${parseFloat(p.precio_unitario).toFixed(2)}</td>
                    <td style="padding: 8px; text-align: right;">S/ ${(p.cantidad * p.precio_unitario).toFixed(2)}</td>
                </tr>`;
        });
    }
    itemsHTML += `
        <tr style="border-bottom: 1px solid #eee; background-color: #fcfcfc;">
            <td style="padding: 8px; text-align: center;">1</td>
            <td style="padding: 8px;"><strong>Mano de Obra / Servicio Técnico</strong><br>
                <small style="color:#555;">Problema Reportado: ${servicio.equipo_problema}</small>
            </td>
            <td style="padding: 8px; text-align: right;">S/ ${costoServ.toFixed(2)}</td>
            <td style="padding: 8px; text-align: right;">S/ ${costoServ.toFixed(2)}</td>
        </tr>`;

    return `
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; width: 100%; padding: 40px; color: #333; max-width: 210mm; margin: 0 auto; background: white;">
        
        <table style="width: 100%; border-bottom: 2px solid #27ae60; padding-bottom: 20px; margin-bottom: 30px;">
            <tr>
                <td style="width: 60%; vertical-align: top;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="../logoinfo.png" style="width: 80px; height: auto;" alt="Logo">
                        <div>
                            <h1 style="margin: 0; color: #27ae60; font-size: 24px;">INFOCOM TECNOLOGY</h1>
                            <p style="margin: 4px 0; font-size: 13px;">RUC: 10479533852</p>
                            <p style="margin: 2px 0; font-size: 13px;">24 de Octubre MZ 53 LT 03</p>
                            <p style="margin: 2px 0; font-size: 13px;">ILO - MOQUEGUA</p>
                            <p style="margin: 2px 0; font-size: 13px;">Tel: 983326971</p>
                        </div>
                    </div>
                </td>
                <td style="width: 40%; text-align: right; vertical-align: top;">
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
                        <h2 style="margin: 0; font-size: 18px; color: #333;">ORDEN DE SERVICIO</h2>
                        <p style="margin: 5px 0; font-size: 22px; color: #e74c3c; font-weight: bold;">N° ${servicio.id}</p>
                        <p style="margin: 0; font-size: 12px; color: #666;">Fecha: ${formatearFecha(servicio.fecha_ingreso)}</p>
                    </div>
                </td>
            </tr>
        </table>

        <div style="display: flex; gap: 20px; margin-bottom: 30px;">
            <div style="flex: 1; border: 1px solid #eee; padding: 15px; border-radius: 6px;">
                <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #27ae60; text-transform: uppercase; border-bottom: 1px solid #eee; padding-bottom: 5px;">Cliente</h3>
                <p style="margin: 4px 0; font-size: 13px;"><strong>Nombre:</strong> ${servicio.cliente_nombre}</p>
                <p style="margin: 4px 0; font-size: 13px;"><strong>Doc:</strong> ${servicio.cliente_num_doc}</p>
                <p style="margin: 4px 0; font-size: 13px;"><strong>Tel:</strong> ${servicio.cliente_telefono || '-'}</p>
            </div>
            <div style="flex: 1; border: 1px solid #eee; padding: 15px; border-radius: 6px;">
                <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #27ae60; text-transform: uppercase; border-bottom: 1px solid #eee; padding-bottom: 5px;">Equipo</h3>
                <p style="margin: 4px 0; font-size: 13px;"><strong>Equipo:</strong> ${servicio.equipo_nombre}</p>
                <p style="margin: 4px 0; font-size: 13px;"><strong>Tipo:</strong> ${servicio.equipo_tipo}</p>
                <p style="margin: 4px 0; font-size: 13px;"><strong>Estado:</strong> ${servicio.estado.toUpperCase()}</p>
            </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
                <tr style="background-color: #2c3e50; color: white;">
                    <th style="padding: 12px; font-size: 13px; width: 10%; text-align: center;">CANT.</th>
                    <th style="padding: 12px; font-size: 13px; text-align: left;">DESCRIPCIÓN</th>
                    <th style="padding: 12px; font-size: 13px; text-align: right; width: 15%;">P. UNIT</th>
                    <th style="padding: 12px; font-size: 13px; text-align: right; width: 15%;">TOTAL</th>
                </tr>
            </thead>
            <tbody style="font-size: 13px;">
                ${itemsHTML}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="2"></td>
                    <td style="padding: 12px; text-align: right; font-weight: bold; border-top: 2px solid #27ae60;">TOTAL:</td>
                    <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 16px; color: #2c3e50; border-top: 2px solid #27ae60;">S/ ${total.toFixed(2)}</td>
                </tr>
            </tfoot>
        </table>

        <div style="margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>Atendido por: <strong>${vendedor}</strong></p>
            <p>¡GRACIAS POR ELEGIR INFOCOM!</p>
            <p style="font-size: 11px; margin: 0;">Esperamos que su equipo quede perfecto. Nuestro compromiso es ofrecerle el mejor servicio técnico.</p>
        </div>
    </div>`;
}

// --- UTILIDADES ---
function formatearFecha(f) {
    if(!f) return '';
    return new Date(f).toLocaleDateString('es-ES');
}
function mostrarCargaTabla(show) {
    const el = document.getElementById('table-loading');
    if(el) el.style.display = show ? 'flex' : 'none';
}
function mostrarNotificacion(msg, type) {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i> ${msg}`;
  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add('show'), 100);
  setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 500);
  }, 3000);
}