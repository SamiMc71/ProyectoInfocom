// --- VARIABLES GLOBALES ---
let carrito = [];
let productosData = [];
let vendedorActual = 'Usuario';

// Configuración de impresión
function getPrintParams(size) {
    const is80mm = size === '80';
    return {
        width: is80mm ? '80mm' : '58mm',
        windowWidth: is80mm ? 500 : 380,
        scale: is80mm ? 1.5 : 2.0
    };
}

document.addEventListener('DOMContentLoaded', function() {
    cargarProductosDesdeAPI();
    cargarVendedorActual();
    
    document.getElementById('catalogSearch')?.addEventListener('input', filtrarCatalogo);
    document.getElementById('categoriaFilter')?.addEventListener('change', filtrarCatalogo);
    document.getElementById('marcaFilter')?.addEventListener('change', filtrarCatalogo);
    document.getElementById('invoiceForm')?.addEventListener('submit', guardarVenta);

    document.querySelectorAll('input[name="comprobanteTipo"]').forEach(radio => {
        radio.addEventListener('change', actualizarCalculoModal);
    });
    
    actualizarTipoDocumento();
});

// --- FUNCIONES DE EDICIÓN EN EL MODAL ---

function actualizarNombreProducto(index, nuevoNombre) {
    if (index >= 0 && index < carrito.length) {
        carrito[index].nombre = nuevoNombre;
        actualizarCarrito(); // Sincroniza con la vista lateral
    }
}

function actualizarPrecioDesdeModal(index, nuevoPrecio) {
    const precio = parseFloat(nuevoPrecio);
    if (!isNaN(precio) && precio >= 0) {
        carrito[index].precio = precio;
        cargarProductosBoleta(); // Recalcula la tabla del modal
    } else {
        alert('Ingrese un precio válido');
        cargarProductosBoleta();
    }
}

function eliminarProductoDelModal(index) {
    carrito.splice(index, 1);
    actualizarCarrito();
    cargarProductosBoleta();
    mostrarCatalogo();
}

// --- GESTIÓN DE PRODUCTOS Y CATÁLOGO ---

async function cargarProductosDesdeAPI() {
    try {
        const response = await fetch('../api/productos.php');
        const data = await response.json();
        productosData = data;
        cargarFiltros();
        mostrarCatalogo();
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

function mostrarCatalogo() {
    const grid = document.getElementById('catalogGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const termino = document.getElementById('catalogSearch').value.toLowerCase();
    const cat = document.getElementById('categoriaFilter').value;
    const marc = document.getElementById('marcaFilter').value;

    const filtrados = productosData.filter(p => {
        return p.nombre.toLowerCase().includes(termino) && 
               (!cat || p.categoria === cat) && 
               (!marc || p.marca === marc);
    });

    filtrados.forEach(item => {
        const cantEnCarrito = carrito.filter(c => c.id === item.id).reduce((s, c) => s + c.cantidad, 0);
        const stockReal = (item.stock || 0) - cantEnCarrito;
        
        const card = document.createElement('div');
        card.className = `product-card ${stockReal <= 0 ? 'out-of-stock' : ''}`;
        
        // Restauración de visualización de fotos
        card.innerHTML = `
            <div class="product-image">
                ${(item.imagen ? `<img src="${item.imagen}" alt="${item.nombre}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">` : '📦')}
            </div>
            <div class="product-name">${item.nombre}</div>
            <div class="product-info">
                <div class="product-price">S/ ${parseFloat(item.precio).toFixed(2)}</div>
                <div class="product-stock">Stock: ${stockReal}</div>
            </div>
            <button class="btn-add" onclick="agregarAlCarrito('${item.id}')" ${stockReal <= 0 ? 'disabled' : ''}>
                <i class="fa-solid fa-cart-plus"></i> ${stockReal > 0 ? 'Añadir' : 'Sin Stock'}
            </button>`;
        grid.appendChild(card);
    });
}

function agregarAlCarrito(id) {
    const item = productosData.find(p => p.id === id);
    const itemCar = carrito.find(i => i.id === id);
    if (itemCar) {
        if (itemCar.cantidad < item.stock) itemCar.cantidad++;
        else alert('Sin stock suficiente');
    } else {
        carrito.push({ 
            id: item.id, 
            nombre: item.nombre, 
            precio: parseFloat(item.precio), 
            cantidad: 1, 
            imagen: item.imagen, 
            stock: item.stock 
        });
    }
    actualizarCarrito();
    mostrarCatalogo();
}

function actualizarCarrito() {
    const container = document.getElementById('cartItems');
    if (!container) return;
    container.innerHTML = '';
    
    let subtotal = 0;
    carrito.forEach((item, index) => {
        subtotal += item.precio * item.cantidad;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-image">
                ${(item.imagen ? `<img src="${item.imagen}" style="width:40px;height:40px;border-radius:4px;">` : '📦')}
            </div>
            <div class="cart-item-details">
                <div class="cart-item-name">${item.nombre}</div>
                <div class="cart-item-price">S/ ${item.precio.toFixed(2)}</div>
            </div>
            <div class="cart-item-controls">
                <button onclick="cambiarCantidad(${index}, -1)">-</button>
                <span>${item.cantidad}</span>
                <button onclick="cambiarCantidad(${index}, 1)">+</button>
                <button onclick="eliminarDelCarrito(${index})"><i class="fa-solid fa-trash"></i></button>
            </div>`;
        container.appendChild(div);
    });

    const igv = subtotal * 0.18;
    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('igv').textContent = igv.toFixed(2);
    document.getElementById('total').textContent = (subtotal + igv).toFixed(2);
    document.getElementById('checkoutBtn').disabled = carrito.length === 0;
}

function cambiarCantidad(index, cambio) {
    const item = carrito[index];
    const nueva = item.cantidad + cambio;
    if (nueva > 0 && nueva <= item.stock) {
        item.cantidad = nueva;
    } else if (nueva <= 0) {
        carrito.splice(index, 1);
    }
    actualizarCarrito();
    mostrarCatalogo();
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarCarrito();
    mostrarCatalogo();
}

// --- PROCESO DE VENTA ---

async function guardarVenta(e) {
    e.preventDefault();
    const saveBtn = document.querySelector('.btn-save');
    const originalText = saveBtn.innerHTML;

    const ventaData = {
        cliente: {
            tipo_documento: document.getElementById('docType').value,
            numero_documento: document.getElementById('docNumber').value,
            nombres: document.getElementById('clientName').value,
            telefono: document.getElementById('clientPhone').value
        },
        tipo_comprobante: document.querySelector('input[name="comprobanteTipo"]:checked').value,
        subtotal: parseFloat(document.getElementById('modalSubtotal').textContent),
        igv: parseFloat(document.getElementById('modalIgv').textContent),
        total: parseFloat(document.getElementById('modalTotal').textContent),
        productos: carrito.map(i => ({ id: i.id, cantidad: i.cantidad, precio: i.precio, subtotal: i.precio * i.cantidad }))
    };

    try {
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
        saveBtn.disabled = true;

        const response = await fetch('../api/guardar_venta.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ventaData)
        });

        const res = await response.json();
        if (res.success) {
            document.getElementById('numeroComprobanteDisplay').textContent = `N°: ${res.numero_comprobante}`;
            alert(`✅ Venta guardada: ${res.numero_comprobante}`);
            
            carrito = [];
            actualizarCarrito();
            await cargarProductosDesdeAPI();
            
            setTimeout(() => {
                closeModal('invoiceModal');
                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;
            }, 3000);
        } else {
            throw new Error(res.error);
        }
    } catch (err) {
        alert('Error: ' + err.message);
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

// --- FUNCIONES DEL MODAL ---

function openModal(id) {
    if (id === 'invoiceModal') cargarProductosBoleta();
    document.getElementById(id).style.display = 'flex';
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function cargarProductosBoleta() {
    const tbody = document.getElementById('invoiceProducts');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    carrito.forEach((item, index) => {
        const tr = document.createElement('tr');
        // Restauración de campos editables en el modal
        tr.innerHTML = `
            <td>
                <input type="text" class="form-input" style="width:100%" 
                       value="${item.nombre}" 
                       oninput="actualizarNombreProducto(${index}, this.value)">
            </td>
            <td style="text-align:center">${item.cantidad}</td>
            <td>
                <input type="number" step="0.01" style="width:80px" 
                       value="${item.precio.toFixed(2)}" 
                       onchange="actualizarPrecioDesdeModal(${index}, this.value)">
            </td>
            <td style="text-align:right">S/ ${(item.precio * item.cantidad).toFixed(2)}</td>
            <td style="text-align:center">
                <button type="button" class="btn-remove" onclick="eliminarProductoDelModal(${index})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>`;
        tbody.appendChild(tr);
    });
    actualizarCalculoModal();
}

function actualizarCalculoModal() {
    const sub = carrito.reduce((s, i) => s + (i.precio * i.cantidad), 0);
    const tipo = document.querySelector('input[name="comprobanteTipo"]:checked').value;
    const igv = tipo === 'FACTURA' ? sub * 0.18 : 0;
    
    document.getElementById('modalSubtotal').textContent = sub.toFixed(2);
    document.getElementById('modalIgv').textContent = igv.toFixed(2);
    document.getElementById('modalTotal').textContent = (sub + igv).toFixed(2);
    document.getElementById('modalIgvRow').style.display = tipo === 'FACTURA' ? 'table-row' : 'none';
}

// --- AUXILIARES RESTANTES ---

async function buscarCliente() {
    const doc = document.getElementById('docNumber').value;
    const type = document.getElementById('docType').value;
    if (doc.length < 8) return;
    try {
        const res = await fetch(`../api/buscar_cliente.php?tipo_documento=${type}&numero_documento=${doc}`);
        const data = await res.json();
        if (data && !data.error) {
            document.getElementById('clientName').value = data.nombres || data.nombre_completo || '';
            document.getElementById('clientPhone').value = data.telefono || '';
        }
    } catch (e) { console.warn('Error cliente'); }
}

function filtrarCatalogo() { mostrarCatalogo(); }
function limpiarCarrito() { if(confirm('¿Limpiar?')){ carrito = []; actualizarCarrito(); mostrarCatalogo(); } }

async function cargarVendedorActual() {
    const res = await fetch('../php/check_session.php');
    const data = await res.json();
    if (data.success) vendedorActual = data.nombre_completo || 'Usuario';
}

function cargarFiltros() {
    const cats = [...new Set(productosData.map(p => p.categoria).filter(Boolean))];
    const selector = document.getElementById('categoriaFilter');
    cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = opt.textContent = c;
        selector.appendChild(opt);
    });
}

function actualizarTipoDocumento() {
    const type = document.getElementById('docType').value;
    const input = document.getElementById('docNumber');
    input.maxLength = type === 'DNI' ? 8 : 11;
    input.value = '';
}

function imprimirBoletaPOS(size) {
    alert('Función de impresión para ticket de ' + size + 'mm');
}