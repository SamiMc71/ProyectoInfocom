// javascript/cliente.js
let ventasData = [];
let ventasFiltradas = [];
let ventaSeleccionada = null;
let ventaAEliminar = null;
let usuariosRoles = []; 
const API_USERS_ROLES = '../php/get_users_by_role.php';
let isSuperUser = false; 

function getPrintParams(size) {
    const is80mm = size === '80';
    return {
        width: is80mm ? '80mm' : '58mm',
        windowWidth: is80mm ? 500 : 380, 
        pdfFormat: is80mm ? [80, 450] : [58, 350], 
        scale: is80mm ? 1.5 : 2.0 
    };
}

document.addEventListener('DOMContentLoaded', function() {
  setActiveMenuItem();
  checkUserRoleAndLoadData();
  
  document.getElementById('search-input').addEventListener('input', filtrarVentasLocal); 
  document.getElementById('tipo-comprobante-filter').addEventListener('change', filtrarVentasLocal);
  document.getElementById('month-filter').addEventListener('change', filtrarVentasLocal);
  document.getElementById('year-filter').addEventListener('change', filtrarVentasLocal);
  
  const userFilter = document.getElementById('sales-user-filter');
  if(userFilter) userFilter.addEventListener('change', cargarVentasDesdeBD); 
  
  document.getElementById('confirm-delete').addEventListener('click', anularVenta);
  document.getElementById('edit-form').addEventListener('submit', guardarEdicionVenta);
  document.getElementById('edit-tipo-comprobante').addEventListener('change', actualizarTotales);
});

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'flex';
}

function cerrarModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'none';
}

window.onclick = function(event) {
  if (event.target.classList.contains('modal')) cerrarModal(event.target.id);
}

async function checkUserRoleAndLoadData() {
    try {
        const response = await fetch('../php/check_session.php');
        const data = await response.json();
        const username = data.username || '';
        
        if (username === 'Edson') {
            isSuperUser = true;
            const filtersContainer = document.getElementById('sales-super-user-filters');
            if (filtersContainer) filtersContainer.style.display = 'flex';
            await loadSalesUsers();
        }
    } catch (e) {
        console.error('Error al verificar sesión:', e);
    }
    cargarVentasDesdeBD();
}

async function loadSalesUsers() {
    try {
        const response = await fetch(`${API_USERS_ROLES}?roles=ventas,admin`); 
        const data = await response.json();
        
        if (data.success) {
            usuariosRoles = data.users;
            const select = document.getElementById('sales-user-filter');
            if (!select) return;
            select.innerHTML = '<option value="all">Todos los Vendedores</option>';
            
            usuariosRoles.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `${user.nombre_completo} (${user.rol_asignado})`;
                select.appendChild(option);
            });
        }
    } catch (e) {
        console.error('Error al cargar usuarios de ventas:', e);
    }
}

async function cargarVentasDesdeBD() {
  mostrarCargaTabla(true);
  const userFilterValue = document.getElementById('sales-user-filter')?.value;
  let apiUrl = '../api/obtener_ventas.php';
  
  if (isSuperUser && userFilterValue && userFilterValue !== 'all') {
      apiUrl += `?usuario_id=${userFilterValue}`;
  }

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    
    const data = await response.json();
    if (data.success) {
      ventasData = data.ventas;
      filtrarVentasLocal(); 
    } else {
      throw new Error(data.error || 'Error al cargar ventas');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion('Error al cargar las ventas: ' + error.message, 'error');
  } finally {
    mostrarCargaTabla(false);
  }
}

function filtrarVentasLocal() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  const tipoFilter = document.getElementById('tipo-comprobante-filter').value;
  const monthFilter = document.getElementById('month-filter').value;
  const yearFilter = document.getElementById('year-filter').value;
  
  ventasFiltradas = ventasData.filter(venta => {
    const matchesSearch = searchTerm === '' || 
      (venta.cliente_nombres && venta.cliente_nombres.toLowerCase().includes(searchTerm)) ||
      (venta.numero_comprobante && venta.numero_comprobante.toLowerCase().includes(searchTerm)) ||
      (venta.cliente_documento && venta.cliente_documento.includes(searchTerm));
    
    const matchesTipo = tipoFilter === 'all' || venta.tipo_comprobante === tipoFilter;
    
    let matchesDate = true;
    if (monthFilter !== 'all' || yearFilter !== 'all') {
      const fecha = new Date(venta.fecha_venta);
      const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const año = fecha.getFullYear().toString();
      if (monthFilter !== 'all' && mes !== monthFilter) matchesDate = false;
      if (yearFilter !== 'all' && año !== yearFilter) matchesDate = false;
    }
    return matchesSearch && matchesTipo && matchesDate;
  });
  cargarVentas();
}

function cargarVentas() {
  const tbody = document.getElementById('ventas-body');
  const table = document.getElementById('ventas-table');
  const emptyState = document.getElementById('table-empty');
  
  if (ventasFiltradas.length === 0) {
    table.style.display = 'none';
    emptyState.style.display = 'flex';
    return;
  }
  
  table.style.display = 'table';
  emptyState.style.display = 'none';
  tbody.innerHTML = '';
  
  ventasFiltradas.forEach((venta) => {
    const cantidadTotal = venta.detalles ? venta.detalles.reduce((sum, detalle) => sum + (parseInt(detalle.cantidad) || 0), 0) : 0;
    const productos = venta.detalles ? venta.detalles.map(d => d.producto_nombre || d.producto_id).join(', ') : 'Sin productos';
    
    const tr = document.createElement('tr');
    tr.className = venta.estado === 'ANULADA' ? 'venta-anulada' : '';
    tr.innerHTML = `
      <td>
        <strong>${venta.numero_comprobante}</strong>
        ${venta.estado === 'ANULADA' ? '<span class="badge-anulado">ANULADA</span>' : ''}
      </td>
      <td>${formatearFecha(venta.fecha_venta)}</td>
      <td>${venta.cliente_nombres || 'Cliente no registrado'}</td>
      <td>${venta.cliente_documento || 'N/A'}</td>
      <td><span class="badge-tipo">${venta.tipo_comprobante}</span></td>
      <td class="productos-cell" title="${productos}">${productos}</td>
      <td class="text-center">${cantidadTotal}</td>
      <td class="text-right">S/ ${parseFloat(venta.subtotal).toFixed(2)}</td>
      <td class="text-right">S/ ${parseFloat(venta.igv).toFixed(2)}</td>
      <td class="text-right"><strong>S/ ${parseFloat(venta.total).toFixed(2)}</strong></td>
      <td class="actions">
        <button class="action-btn btn-view" onclick="verDetalleVenta(${venta.id})" title="Ver detalle">
          <i class="fa-solid fa-eye"></i>
        </button>
        <button class="action-btn btn-edit" onclick="editarVenta(${venta.id})" title="Editar venta" ${venta.estado === 'ANULADA' ? 'disabled' : ''}>
          <i class="fa-solid fa-edit"></i>
        </button>
        ${venta.estado !== 'ANULADA' ? `
          <button class="action-btn btn-delete" onclick="confirmarAnular(${venta.id})" title="Anular venta">
            <i class="fa-solid fa-ban"></i>
          </button>
        ` : ''}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function editarVenta(id) {
  const venta = ventasData.find(v => v.id == id);
  if (venta) {
    ventaSeleccionada = JSON.parse(JSON.stringify(venta)); 
    document.getElementById('edit-numero-comprobante').value = venta.numero_comprobante;
    document.getElementById('edit-tipo-comprobante').value = venta.tipo_comprobante;
    document.getElementById('edit-tipo-documento').value = venta.cliente_tipo_documento || 'DNI';
    document.getElementById('edit-numero-documento').value = venta.cliente_documento || '';
    document.getElementById('edit-nombres').value = venta.cliente_nombres || '';
    document.getElementById('edit-telefono').value = venta.cliente_telefono || '';
    document.getElementById('edit-email').value = venta.cliente_email || '';
    cargarProductosEdicion(ventaSeleccionada.detalles);
    actualizarTotales();
    openModal('modal-editar');
  }
}

function cargarProductosEdicion(detalles) {
  const contenedor = document.getElementById('productos-edicion');
  contenedor.innerHTML = '';
  if (!detalles || detalles.length === 0) {
    contenedor.innerHTML = '<p class="no-products">No hay productos en esta venta</p>';
    return;
  }
  detalles.forEach((detalle, index) => {
    const productoDiv = document.createElement('div');
    productoDiv.className = 'producto-edicion-item';
    productoDiv.innerHTML = `
      <div class="producto-header">
        <strong>${detalle.producto_nombre || detalle.producto_id}</strong>
        <button type="button" class="btn-remove-producto" onclick="eliminarProductoEdicion(${index})" title="Eliminar producto">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
      <div class="producto-controls">
        <div class="control-group">
          <label>Cantidad:</label>
          <input type="number" class="form-input cantidad-input" value="${detalle.cantidad}" 
                 min="1" onchange="actualizarSubtotal(${index})" data-index="${index}">
        </div>
        <div class="control-group">
          <label>Precio Unitario:</label>
          <input type="number" class="form-input precio-input" value="${parseFloat(detalle.precio_unitario).toFixed(2)}" 
                 step="0.01" min="0" onchange="actualizarSubtotal(${index})" data-index="${index}">
        </div>
        <div class="control-group">
          <label>Subtotal:</label>
          <span class="subtotal-display" id="subtotal-${index}">S/ ${parseFloat(detalle.subtotal).toFixed(2)}</span>
        </div>
      </div>
    `;
    contenedor.appendChild(productoDiv);
  });
}

function actualizarSubtotal(index) { actualizarTotales(); }

function eliminarProductoEdicion(index) {
  if (ventaSeleccionada && ventaSeleccionada.detalles) {
    ventaSeleccionada.detalles.splice(index, 1);
    cargarProductosEdicion(ventaSeleccionada.detalles);
    actualizarTotales();
  }
}

function actualizarTotales() {
  let subtotal = 0;
  const cantidadInputs = document.querySelectorAll('#productos-edicion .cantidad-input');
  const precioInputs = document.querySelectorAll('#productos-edicion .precio-input');
  
  for (let i = 0; i < cantidadInputs.length; i++) {
      const cantidad = parseFloat(cantidadInputs[i].value) || 0;
      const precio = parseFloat(precioInputs[i].value) || 0;
      const subtotalItem = cantidad * precio;
      const subtotalDisplay = document.getElementById(`subtotal-${i}`);
      if (subtotalDisplay) subtotalDisplay.textContent = `S/ ${subtotalItem.toFixed(2)}`;
      
      if (ventaSeleccionada && ventaSeleccionada.detalles[i]) {
          ventaSeleccionada.detalles[i].cantidad = cantidad;
          ventaSeleccionada.detalles[i].precio_unitario = precio;
          ventaSeleccionada.detalles[i].subtotal = subtotalItem;
      }
      subtotal += subtotalItem;
  }
  
  const tipoComprobante = document.getElementById('edit-tipo-comprobante').value;
  let igv = tipoComprobante === 'FACTURA' ? subtotal * 0.18 : 0;
  let total = subtotal + igv;
  
  document.getElementById('edit-subtotal-display').textContent = `S/ ${subtotal.toFixed(2)}`;
  document.getElementById('edit-igv-display').textContent = `S/ ${igv.toFixed(2)}`;
  document.getElementById('edit-total-display').textContent = `S/ ${total.toFixed(2)}`;
}

async function guardarEdicionVenta(e) {
  e.preventDefault();
  if (!ventaSeleccionada) return;
  try {
    const subtotal = parseFloat(document.getElementById('edit-subtotal-display').textContent.replace('S/ ', ''));
    const igv = parseFloat(document.getElementById('edit-igv-display').textContent.replace('S/ ', ''));
    const total = parseFloat(document.getElementById('edit-total-display').textContent.replace('S/ ', ''));

    const datosEdicion = {
      venta_id: ventaSeleccionada.id,
      tipo_comprobante: document.getElementById('edit-tipo-comprobante').value,
      cliente: {
        tipo_documento: document.getElementById('edit-tipo-documento').value,
        numero_documento: document.getElementById('edit-numero-documento').value,
        nombres: document.getElementById('edit-nombres').value,
        telefono: document.getElementById('edit-telefono').value,
        email: document.getElementById('edit-email').value
      },
      detalles: ventaSeleccionada.detalles,
      subtotal: subtotal, igv: igv, total: total
    };
    
    const response = await fetch('../api/editar_venta.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosEdicion)
    });
    
    const resultado = await response.json();
    if (resultado.success) {
      cargarVentasDesdeBD();
      cerrarModal('modal-editar');
      mostrarNotificacion('Venta actualizada correctamente', 'success');
    } else throw new Error(resultado.error);
  } catch (error) { mostrarNotificacion('Error: ' + error.message, 'error'); }
}

function setActiveMenuItem() {
  document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
  const item = document.querySelector('a[href*="cliente.html"]');
  if (item) item.classList.add('active');
}

function actualizarVentas() {
  cargarVentasDesdeBD();
  mostrarNotificacion('Datos actualizados', 'success');
}

function verDetalleVenta(id) {
  const venta = ventasData.find(v => v.id == id);
  if (venta) {
    ventaSeleccionada = venta;
    const detalleContent = document.getElementById('detalle-content');
    const compNumeroEl = document.getElementById('detalle-comprobante-numero');
    
    if (compNumeroEl) {
        compNumeroEl.textContent = `Comprobante N°: ${venta.numero_comprobante} (${venta.tipo_comprobante})`;
        compNumeroEl.style.color = venta.estado === 'ANULADA' ? 'var(--danger-color)' : 'var(--primary-dark)';
    }

    let productosHTML = '';
    if (venta.detalles && venta.detalles.length > 0) {
        productosHTML = `
            <h3 style="font-size: 16px; margin-bottom: 15px;">Productos (${venta.detalles.length} items)</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead><tr style="background: #f8f9fa;"><th style="padding: 10px; text-align: left;">Producto</th><th style="padding: 10px;">Cant</th><th style="padding: 10px;">P.U.</th><th style="padding: 10px;">Subtotal</th></tr></thead>
                <tbody>
                    ${venta.detalles.map(d => `<tr><td style="padding: 10px; border-bottom: 1px solid #eee;">${d.producto_nombre || 'N/A'}</td><td style="text-align: center;">${d.cantidad}</td><td style="text-align: right;">S/ ${parseFloat(d.precio_unitario).toFixed(2)}</td><td style="text-align: right;">S/ ${parseFloat(d.subtotal).toFixed(2)}</td></tr>`).join('')}
                </tbody>
            </table>`;
    }

    detalleContent.innerHTML = `
        <div class="detalle-header" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div><h3>Datos del Cliente</h3><p><strong>Nombre:</strong> ${venta.cliente_nombres || 'N/A'}</p><p><strong>Doc:</strong> ${venta.cliente_tipo_documento}: ${venta.cliente_documento}</p></div>
            <div style="border-left: 2px solid #eee; padding-left: 20px;"><h3>Info Venta</h3><p><strong>Vendedor:</strong> ${venta.vendedor_nombre}</p><p><strong>Fecha:</strong> ${formatearFecha(venta.fecha_venta)}</p></div>
        </div>
        <div style="margin: 25px 0;">${productosHTML}</div>
        <div style="text-align: right; border-top: 2px solid #eee; padding-top: 15px;">
            <p>Subtotal: S/ ${parseFloat(venta.subtotal).toFixed(2)}</p>
            <p>IGV (18%): S/ ${parseFloat(venta.igv).toFixed(2)}</p>
            <h2 style="color: var(--primary-dark);">TOTAL: S/ ${parseFloat(venta.total).toFixed(2)}</h2>
        </div>`;
    openModal('modal-detalle'); 
  }
}

function confirmarAnular(id) {
  const venta = ventasData.find(v => v.id == id);
  if (venta) {
    ventaAEliminar = id;
    document.getElementById('delete-message').textContent = `¿Anular venta ${venta.numero_comprobante}?`;
    openModal('modal-eliminar');
  }
}

async function anularVenta() {
  if (ventaAEliminar) {
    try {
      const response = await fetch('../api/anular_venta.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venta_id: ventaAEliminar })
      });
      const resultado = await response.json();
      if (resultado.success) {
        cargarVentasDesdeBD();
        cerrarModal('modal-eliminar');
        mostrarNotificacion('Venta anulada', 'success');
      } else throw new Error(resultado.error);
    } catch (error) { mostrarNotificacion('Error: ' + error.message, 'error'); }
    ventaAEliminar = null;
  }
}

function imprimirBoletaPOS(size) {
  if (!ventaSeleccionada) return mostrarNotificacion('No hay venta seleccionada.', 'error');
  const params = getPrintParams(size);
  const ticketHTML = generarHTMLTicket(ventaSeleccionada, size);
  const plantilla = `<html><head><style>@page { size: ${params.width} auto; margin: 0; } body { width: ${params.width}; font-family: 'Courier New', monospace; }</style></head><body>${ticketHTML}<script>window.onload = function() { window.print(); setTimeout(() => window.close(), 100); }<\/script></body></html>`;
  const ventana = window.open('', '', `width=${params.windowWidth},height=600`); 
  ventana.document.write(plantilla);
  ventana.document.close();
}

function generarHTMLTicket(venta, size = '58') {
    const tipo = venta.tipo_comprobante || 'BOLETA';
    let productosHTML = '';
    venta.detalles?.forEach(d => {
        productosHTML += `<div style="display: flex;">
            <div style="width: 15%;">${d.cantidad}</div>
            <div style="width: 60%;">${d.producto_nombre}</div>
            <div style="width: 25%; text-align: right;">${(d.precio_unitario * d.cantidad).toFixed(2)}</div>
        </div>`;
    });

    return `
        <div style="font-size: 10px; padding: 5px;">
            <div style="text-align: center;">
                <img src="../logoinfo.png" style="width: 50px;"><br>
                <strong>INFOCOM TECNOLOGY</strong><br>
                <span>RUC: 10479533852</span>
            </div>
            <hr style="border-top: 1px dashed #000;">
            <div>
                <strong>${tipo}: ${venta.numero_comprobante}</strong><br>
                Cliente: ${venta.cliente_nombres || ''}
            </div>
            <hr style="border-top: 1px dashed #000;">
            ${productosHTML}
            <hr style="border-top: 1px dashed #000;">
            <div style="text-align: right; font-weight: bold;">TOTAL: S/ ${parseFloat(venta.total).toFixed(2)}</div>
            <div style="text-align: center; margin-top: 10px;">¡GRACIAS POR SU COMPRA!</div>
        </div>`;
}

function formatearFecha(fechaString) {
  if (!fechaString) return '';
  const f = new Date(fechaString);
  return f.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit'});
}

function mostrarCargaTabla(show) {
  const el = document.getElementById('table-loading');
  if(el) el.style.display = show ? 'flex' : 'none';
}

function mostrarNotificacion(msg, type) {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = msg;
  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add('show'), 100);
  setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 500);
  }, 3000);
}