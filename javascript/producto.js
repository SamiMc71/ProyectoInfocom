//
// Variables globales
let productosData = [];
let productosFiltrados = [];
let productoAEliminar = null;
let productoActual = null;

// === INICIO: FUNCIÓN AUXILIAR PARA RUTAS ABSOLUTAS (CORRECCIÓN CRÍTICA) ===
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
    // Crea un elemento 'a' temporal para resolver la URL relativa a la ubicación actual.
    const a = document.createElement('a');
    a.href = relativePath;
    return a.href;
}
// === FIN: FUNCIÓN AUXILIAR PARA RUTAS ABSOLUTAS ===

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
  cargarProductosDesdeBD();
  
  // Configurar event listeners para filtros
  document.getElementById('searchInput').addEventListener('input', filtrarProductos);
  document.getElementById('category-filter').addEventListener('change', filtrarProductos);
  document.getElementById('stock-filter').addEventListener('change', filtrarProductos);
  
  // Configurar formularios
  document.getElementById('edit-form').addEventListener('submit', guardarEdicion);
  document.getElementById('add-form').addEventListener('submit', guardarNuevoProducto);
  
  // Configurar botón de eliminar
  document.getElementById('confirm-delete').addEventListener('click', eliminarProducto);
});

// ==================================================
// ***** FUNCIÓN: Formatear Descripción (código auxiliar) *****
// ==================================================
/**
 * Convierte un texto simple con pseudo-markup a HTML.
 * - *texto* se convierte en <strong>texto</strong>
 * - - item se convierte en <li>item</li> (y se envuelve en <ul>)
 * - \n se convierte en <br>
 */
function formatDescriptionAsHtml(text) {
  if (!text || text.trim() === '') {
    return 'Sin descripción';
  }

  let html = text
    .trim()
    // 1. Convertir *texto* en <strong>texto</strong>
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    
    // 2. Convertir saltos de línea en <br>
    .replace(/\n/g, '<br>');

  // 3. Manejar listas de guiones
  // Buscar bloques de líneas que empiecen con '- '
  html = html.replace(/(- (.*?)<br>)+/g, (match) => {
    // Envolver todo el bloque en <ul>
    return '<ul>' + match
      // Convertir cada línea '- item<br>' en '<li>$1</li>'
      .replace(/- (.*?)<br>/g, '<li>$1</li>') + 
    '</ul>';
  });
  
  // Manejar el último item de una lista (que no tiene <br> al final)
  html = html.replace(/- (.*?)$/g, (match) => {
    // Si no está ya en una <ul>, envolverlo
    if (html.endsWith('</ul>')) {
        return match.replace(/- (.*)/, '<li>$1</li>') + '</ul>';
    } else {
        return '<ul>' + match.replace(/- (.*)/, '<li>$1</li>') + '</ul>';
    }
  });

  return html;
}

// Cargar productos desde la base de datos
async function cargarProductosDesdeBD() {
  mostrarCargaTabla(true);
  
  try {
    const response = await fetch('../api/productos.php');
    if (!response.ok) {
      throw new Error('Error en la respuesta del servidor: ' + response.status);
    }
    productosData = await response.json();
    productosFiltrados = [...productosData];
    cargarProductos();
    mostrarCargaTabla(false);
    
  } catch (error) {
    console.error('Error al cargar productos:', error);
    mostrarNotificacion('Error al cargar los productos desde la base de datos: ' + error.message, 'error');
    mostrarCargaTabla(false);
  }
}

// Cargar productos en la tabla
function cargarProductos() {
  const tbody = document.getElementById('productos-body');
  const table = document.getElementById('productTable');
  const emptyState = document.getElementById('table-empty');
  
  if (productosFiltrados.length === 0) {
    table.style.display = 'none';
    emptyState.style.display = 'flex';
    return;
  }
  
  table.style.display = 'table';
  emptyState.style.display = 'none';
  tbody.innerHTML = '';
  
  productosFiltrados.forEach(producto => {
    const tr = document.createElement('tr');
    const stockClass = getStockClass(producto.stock);
    const stockStatus = getStockStatus(producto.stock);
    
    // === MODIFICACIÓN: Usar el texto plano para el 'title' (tooltip) ===
    const descripcion = producto.descripcion || 'Sin descripción';
    
    tr.className = stockClass;
    tr.innerHTML = `
      <td>${producto.id}</td>
      <td><img src="${producto.imagen}" width="40" height="40" style="border-radius: 4px; object-fit: cover;" onerror="this.src='https://via.placeholder.com/40'"></td>
      <td>${producto.nombre}</td>
      
      <td class="truncate-description" title="${descripcion}">${descripcion}</td>
      
      <td>${producto.marca}</td>
      <td>${producto.categoria}</td>
      <td><span class="stock-badge ${stockClass}">${producto.stock} ${stockStatus}</span></td>
      <td>S/ ${parseFloat(producto.precio).toFixed(2)}</td>
      <td class="actions">
        <button class="action-btn btn-view" onclick="verProducto('${producto.id}')">
          <i class="fa-solid fa-eye"></i> 
        </button>
        <button class="action-btn btn-print" onclick="imprimirProductoDesdeTabla('${producto.id}')">
          <i class="fa-solid fa-print"></i> 
        </button>
        <button class="action-btn btn-edit" onclick="editarProducto('${producto.id}')">
          <i class="fa-solid fa-edit"></i>
        </button>
        <button class="action-btn btn-delete" onclick="confirmarEliminar('${producto.id}')">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Filtrar productos
function filtrarProductos() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const categoryFilter = document.getElementById('category-filter').value;
  const stockFilter = document.getElementById('stock-filter').value;
  
  productosFiltrados = productosData.filter(producto => {
    // Filtrar por búsqueda
    const matchesSearch = searchTerm === '' || 
      producto.nombre.toLowerCase().includes(searchTerm) ||
      (producto.marca && producto.marca.toLowerCase().includes(searchTerm)) ||
      (producto.categoria && producto.categoria.toLowerCase().includes(searchTerm));
    
    // Filtrar por categoría
    const matchesCategory = categoryFilter === 'all' || producto.categoria === categoryFilter;
    
    // Filtrar por stock
    let matchesStock = true;
    if (stockFilter !== 'all') {
      if (stockFilter === 'normal' && producto.stock < 10) matchesStock = false;
      if (stockFilter === 'low' && (producto.stock >= 10 || producto.stock < 3)) matchesStock = false;
      if (stockFilter === 'critical' && producto.stock >= 3) matchesStock = false;
    }
    
    return matchesSearch && matchesCategory && matchesStock;
  });
  
  cargarProductos();
}

// Obtener clase CSS según stock
function getStockClass(stock) {
  if (stock >= 10) return 'stock-normal';
  if (stock >= 3) return 'stock-low';
  return 'stock-critical';
}

// Obtener estado de stock
function getStockStatus(stock) {
  if (stock >= 10) return '';
  if (stock >= 3) return '(Bajo)';
  return '(Crítico)';
}

// Funciones para los modales
function verProducto(id) {
  const producto = productosData.find(p => p.id === id);
  if (producto) {
    productoActual = producto;
    document.getElementById('view-product-image').src = producto.imagen;
    document.getElementById('view-product-name').textContent = producto.nombre;
    
    // === MODIFICACIÓN: Usar .innerHTML y la función de formato ===
    document.getElementById('view-product-description').innerHTML = formatDescriptionAsHtml(producto.descripcion);
    
    document.getElementById('view-product-brand').textContent = producto.marca;
    document.getElementById('view-product-category').textContent = producto.categoria;
    document.getElementById('view-product-stock').textContent = producto.stock;
    document.getElementById('view-product-price').textContent = parseFloat(producto.precio).toFixed(2);
    
    const statusElement = document.getElementById('view-product-status');
    statusElement.textContent = getStockStatus(producto.stock).replace(/[()]/g, '') || 'Normal';
    statusElement.className = 'stock-badge ' + getStockClass(producto.stock);
    
    document.getElementById('viewModal').style.display = 'flex';
  }
}

// INICIO MODIFICACIÓN: Cargar URL de imagen al editar
function editarProducto(id) {
  const producto = productosData.find(p => p.id === id);
  if (producto) {
    document.getElementById('edit-product-id').value = producto.id;
    document.getElementById('edit-product-name').value = producto.nombre;
    document.getElementById('edit-product-description').value = producto.descripcion || '';
    document.getElementById('edit-product-brand').value = producto.marca;
    document.getElementById('edit-product-category').value = producto.categoria;
    document.getElementById('edit-product-stock').value = producto.stock;
    document.getElementById('edit-product-price').value = parseFloat(producto.precio).toFixed(2);
    // NUEVA LÍNEA: Cargar la URL de la imagen
    document.getElementById('edit-product-image').value = producto.imagen || ''; 
    
    document.getElementById('editModal').style.display = 'flex';
  }
}
// FIN MODIFICACIÓN

function confirmarEliminar(id) {
  const producto = productosData.find(p => p.id === id);
  if (producto) {
    productoAEliminar = id;
    document.getElementById('delete-message').textContent = 
      `¿Está seguro de eliminar el producto "${producto.nombre}"? Esta acción no se puede deshacer.`;
    document.getElementById('deleteModal').style.display = 'flex';
  }
}

function openModal(modalId) {
  document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// Funciones para guardar datos
// INICIO MODIFICACIÓN: Incluir URL de imagen en guardarEdicion
async function guardarEdicion(e) {
  e.preventDefault();
  
  const id = document.getElementById('edit-product-id').value;
  
  try {
    const response = await fetch(`../api/productos.php?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: id,
        nombre: document.getElementById('edit-product-name').value,
        descripcion: document.getElementById('edit-product-description').value,
        marca: document.getElementById('edit-product-brand').value,
        categoria: document.getElementById('edit-product-category').value,
        stock: parseInt(document.getElementById('edit-product-stock').value),
        precio: parseFloat(document.getElementById('edit-product-price').value),
        // NUEVA LÍNEA: Incluir imagen
        imagen: document.getElementById('edit-product-image').value || 'https://via.placeholder.com/150' 
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      await cargarProductosDesdeBD();
      closeModal('editModal');
      mostrarNotificacion('Producto actualizado correctamente', 'success');
    } else {
      throw new Error(result.error || 'Error desconocido');
    }
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    mostrarNotificacion('Error al actualizar el producto: ' + error.message, 'error');
  }
}
// FIN MODIFICACIÓN

async function guardarNuevoProducto(e) {
  e.preventDefault();
  
  try {
    const response = await fetch('../api/productos.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: document.getElementById('add-product-name').value,
        descripcion: document.getElementById('add-product-description').value,
        marca: document.getElementById('add-product-brand').value,
        categoria: document.getElementById('add-product-category').value,
        stock: parseInt(document.getElementById('add-product-stock').value),
        precio: parseFloat(document.getElementById('add-product-price').value),
        imagen: document.getElementById('add-product-image').value || 'https://via.placeholder.com/150'
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      await cargarProductosDesdeBD();
      closeModal('addProductModal');
      mostrarNotificacion('Producto agregado correctamente', 'success');
      document.getElementById('add-form').reset();
    } else {
      throw new Error(result.error || 'Error desconocido');
    }
  } catch (error) {
    console.error('Error al agregar producto:', error);
    mostrarNotificacion('Error al agregar el producto: ' + error.message, 'error');
  }
}

async function eliminarProducto() {
  if (productoAEliminar) {
    try {
      const response = await fetch(`../api/productos.php?id=${productoAEliminar}`, {
        method: 'DELETE' 
      });
      
      const result = await response.json();
      
      if (response.ok) {
        await cargarProductosDesdeBD();
        closeModal('deleteModal');
        mostrarNotificacion('Producto eliminado correctamente', 'success');
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      mostrarNotificacion('Error al eliminar el producto: ' + error.message, 'error');
    }
    productoAEliminar = null;
  }
}

// Imprimir producto
function imprimirProductoDesdeTabla(id) {
  const producto = productosData.find(p => p.id === id);
  if (producto) {
    productoActual = producto;
    imprimirProducto();
  }
}

// ==================================================
// ***** FUNCIÓN DE IMPRESIÓN WEB (con código ORIGINAL CORREGIDO) *****
// ==================================================
function imprimirProducto() {
  if (!productoActual) {
    mostrarNotificacion('No hay producto seleccionado para imprimir', 'warning');
    return;
  }
  
  const ventana = window.open('', '', 'width=800,height=600');
  ventana.document.write(`
      <html>
      <head>
          <title>Ficha Técnica - ${productoActual.nombre}</title>
          <style>
            /* Copiado de generarHTMLContent */
            body { font-family: Arial, sans-serif; margin: 0; line-height: 1.4; font-size: 11pt; } 
            .header { margin-bottom: 20px; border-bottom: 2px solid #27ae60; padding-bottom: 20px; }
            .header-main { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
            .logo-container { flex-shrink: 0; }
            .logo-img { max-width: 120px; height: auto; }
            .company-info { flex-grow: 1; text-align: left; }
            .company-info h2 { font-size: 18px; margin-bottom: 8px; color: #2c3e50; margin-top: 0; }
            .company-info p { font-size: 12px; margin: 2px 0; color: #2c3e50; font-weight: 500; }
            .title-container { text-align: center; }
            .title-container hr { margin-top: 0; border: 0; border-top: 1px solid #ccc; margin-bottom: 15px; }
            .product-info { display: flex; gap: 30px; margin-bottom: 15px; } 
            .product-image { width: 180px; } 
            .product-details { flex: 1; }
            .section { margin-bottom: 15px; } 
            .label { font-weight: bold; color: #2c3e50; font-size: 11pt; } 
            .section p, .product-details p { margin: 0; }
            @media print { 
                @page { margin: 10mm; } 
                body { margin: 0 !important; padding: 0 !important; } 
            }
            .description-formatted { line-height: 1.4; color: #2c3e50; white-space: normal; }
            .description-formatted ul { padding-left: 20px; margin-top: 5px; margin-bottom: 10px; }
            .description-formatted li { margin-bottom: 4px; }
            .description-formatted strong { color: #219150; }
            /* Estilos adicionales para la vista web que no están en el PDF */
            .ficha-tecnica-print {
                padding: 0; 
            }
          </style>
      </head>
      <body>
          ${generarHTMLContentPuro(productoActual)}
          <script>
              window.onload = function() { window.print(); setTimeout(() => window.close(), 100); };
          <\/script>
      </body>
      </html>
  `);
  ventana.document.close();
}

// ==================================================
// ***** NUEVA FUNCIÓN: Enviar por WhatsApp *****
// ==================================================

function enviarProductoPorWhatsApp() {
  if (!productoActual) {
    mostrarNotificacion('No hay producto seleccionado para enviar', 'warning');
    return;
  }
  
  // Abrir modal de input de número
  const phoneModal = document.createElement('div');
  phoneModal.id = 'whatsapp-input-modal';
  phoneModal.className = 'modal';
  
  phoneModal.innerHTML = `
      <div class="modal-content" style="max-width: 400px;">
          <span class="btn-close" onclick="document.body.removeChild(document.getElementById('whatsapp-input-modal'))">&times;</span>
          <h2>Enviar Ficha por WhatsApp</h2>
          <p>Ingrese el número de teléfono (9 dígitos) del cliente:</p>
          <div class="form-group">
              <label for="client-phone-input">Teléfono (Ej: 987654321)</label>
              <input type="tel" id="client-phone-input" class="form-input" maxlength="9" placeholder="9 dígitos" required>
          </div>
          <div class="modal-buttons">
              <button class="btn-cancel" onclick="document.body.removeChild(document.getElementById('whatsapp-input-modal'))">Cancelar</button>
              <button class="btn-whatsapp" id="send-whatsapp-btn">
                  <i class="fa-brands fa-whatsapp"></i> Enviar PDF
              </button>
          </div>
      </div>
  `;
  
  document.body.appendChild(phoneModal);
  phoneModal.style.display = 'flex';
  
  document.getElementById('send-whatsapp-btn').onclick = function() {
      const clientPhone = document.getElementById('client-phone-input').value.trim();
      
      if (!clientPhone || clientPhone.length !== 9 || !/^\d{9}$/.test(clientPhone)) {
          alert('Por favor ingrese un número de teléfono válido de 9 dígitos.');
          return;
      }
      
      // Cerrar modal de número
      document.body.removeChild(phoneModal);
      
      // Llamar a la función de generación y envío con el número
      generarPDFyEnviarWhatsApp(clientPhone);
  };
}

function generarPDFyEnviarWhatsApp(clientPhone) {
    const btnWhatsapp = document.querySelector('.btn-whatsapp');
    const originalBtnHtml = btnWhatsapp ? btnWhatsapp.innerHTML : 'Enviar PDF';
    if(btnWhatsapp) {
        btnWhatsapp.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';
        btnWhatsapp.disabled = true;
    }
    
    // Crear un contenedor temporal para la generación del PDF
    const tempContainer = document.createElement('div');
    tempContainer.id = 'pdf-render-container';
    // Mover el contenedor fuera de la vista en lugar de usar display: none
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '0';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '210mm'; 
    document.body.appendChild(tempContainer);
    
    // Asignar el HTML COMPLETO con <style> y estructura <html>
    tempContainer.innerHTML = generarHTMLContentCompleto(productoActual); 
    
    // Configuración para A4
    const nombreArchivo = `FichaTecnica-${productoActual.id}.pdf`;
    const opt = {
      margin:       [5, 10, 5, 10], // Márgenes [Top, Right, Bottom, Left]
      filename:     nombreArchivo,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
          scale: 2, 
          useCORS: true, // CLAVE para cargar imágenes de origen cruzado/local
          logging: false 
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Target the inner DIV for rendering
    const renderElement = tempContainer.querySelector('.ficha-tecnica-print'); 

    // Generar PDF
    html2pdf().from(renderElement).set(opt).save().then(() => {
        // Limpiar el contenedor temporal
        document.body.removeChild(tempContainer);
        
        // Restaurar botón en caso de éxito
        mostrarNotificacion('PDF generado y descargado. Abriendo WhatsApp...', 'success');
        if(btnWhatsapp) {
            btnWhatsapp.innerHTML = originalBtnHtml;
            btnWhatsapp.disabled = false;
        }

        // Abrir WhatsApp
        const numeroLimpio = clientPhone.replace(/[^0-9]/g, '');
        const numeroWhatsApp = `51${numeroLimpio}`; // Asumimos 51 (Perú)
        const message = `Estimado(a) cliente, le compartimos la Ficha Técnica de nuestro producto *${productoActual.nombre}*.`;
        const link = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(message)}`;
        
        window.open(link, '_blank');
        
    }).catch((err) => {
        // Restaurar botón en caso de error
        if(btnWhatsapp) {
            btnWhatsapp.innerHTML = originalBtnHtml;
            btnWhatsapp.disabled = false;
        }
        
        if(document.body.contains(tempContainer)) {
           document.body.removeChild(tempContainer);
        }
        console.error("Error html2pdf:", err);
        mostrarNotificacion('❌ Error al generar PDF. Asegure que la URL de la imagen es válida y el navegador permite pop-ups.', 'error');
    });
}


// --- Función que genera SOLO el contenido HTML a imprimir (usada por el browser print) ---
function generarHTMLContentPuro(producto) {
    // Valores de color directos para impresión
    const primaryColor = '#27ae60';
    const primaryDark = '#219150';
    const textDark = '#2c3e50';
    const textLight = '#7f8c8d';
    const borderColor = '#e5e8eb';

    return `
        <div class="ficha-tecnica-print">
            <div class="header">
                <div class="header-main" style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
                    <div class="logo-container" style="flex-shrink: 0;">
                        <img src="${getAbsoluteUrl('../logoinfo.png')}" alt="Logo INFOCOM" style="max-width: 120px; height: auto; display: block;">
                    </div>
                    <div class="company-info" style="flex-grow: 1; text-align: left;">
                        <h2 style="font-size: 18px; color: ${textDark}; margin: 0 0 8px 0;">INFOCOM TECNOLOGY</h2>
                        <p style="font-size: 12px; margin: 2px 0; color: ${textDark}; font-weight: 500;">FRANCO TARAPA EDSON ADRIAN</p>
                        <p style="font-size: 12px; margin: 2px 0; color: ${textDark}; font-weight: 500;">RUC: 10479533852</p>
                        <p style="font-size: 12px; margin: 2px 0; color: ${textDark}; font-weight: 500;">ILO - MOQUEGUA</p>
                        <p style="font-size: 12px; margin: 2px 0; color: ${textDark}; font-weight: 500;">TEL: 983326971</p>
                    </div>
                </div>
                
                <div class="title-container" style="text-align: center;">
                    <hr style="margin: 0 0 15px 0; border: 0; border-top: 1px solid ${borderColor};">
                    <h3 style="font-size: 14pt; color: ${textDark}; margin: 0;">Ficha Técnica del Producto</h3>
                    <p style="font-size: 10pt; color: ${textLight}; margin-top: 5px;">Fecha: ${new Date().toLocaleDateString()}</p>
                </div>
            </div>
            
            <div class="product-info" style="display: flex; gap: 30px; margin-bottom: 15px;">
                <div class="product-image" style="width: 180px; flex-shrink: 0;">
                    <img src="${getAbsoluteUrl(producto.imagen)}" alt="${producto.nombre}" style="width: 180px; height: auto;">
                </div>
                <div class="product-details" style="flex: 1; display: flex; flex-direction: column; gap: 10px;">
                    <div class="section">
                        <p style="font-weight: bold; color: ${textDark}; font-size: 11pt; margin: 0;">Nombre:</p>
                        <p style="margin: 0;">${producto.nombre}</p>
                    </div>
                    <div class="section">
                        <p style="font-weight: bold; color: ${textDark}; font-size: 11pt; margin: 0;">Descripción:</p>
                        <div class="description-formatted">
                            ${formatDescriptionAsHtml(producto.descripcion)}
                        </div>
                    </div>
                    <div class="section">
                        <p style="font-weight: bold; color: ${textDark}; font-size: 11pt; margin: 0;">Marca:</p>
                        <p style="margin: 0;">${producto.marca}</p>
                    </div>
                    
                    <div class="section">
                        <p style="font-weight: bold; color: ${textDark}; font-size: 11pt; margin: 0;">Precio:</p>
                        <p style="font-size: 1.1em; font-weight: bold; color: ${primaryColor}; margin: 0;">S/ ${parseFloat(producto.precio).toFixed(2)}</p>
                    </div>
                </div>
            </div>
            
            <div class="footer" style="margin-top: 30px; border-top: 1px solid ${borderColor}; padding-top: 20px; text-align: center; font-size: 10pt; color: ${textLight};">
                <p>Documento generado el ${new Date().toLocaleString()}</p>
            </div>
        </div>
    `;
}

// --- Función que genera el documento COMPLETO con estilos incrustados para html2pdf ---
function generarHTMLContentCompleto(producto) {
    
    // Valores de color directos (reemplazando variables)
    const primaryColor = '#27ae60';
    const primaryDark = '#219150';
    const textDark = '#2c3e50';
    const textLight = '#7f8c8d';
    const borderColor = '#e5e8eb';

    // Se incrustan los estilos CSS dentro de <style> para que html2pdf los lea.
    const cssContent = `
        /* Estilos CRÍTICOS para el PDF */
        .ficha-tecnica-print { 
            font-family: Arial, sans-serif; 
            font-size: 11pt; 
            line-height: 1.4;
            padding: 0; 
            color: ${textDark};
            width: 100%;
        }
        
        body { 
            margin: 0; 
            padding: 0;
            background: #fff;
        }

        .header { 
            margin-bottom: 15px; 
            border-bottom: 2px solid ${primaryColor}; 
            padding-bottom: 15px; 
        }

        .header-main {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 20px;
        }

        .logo-img { 
            max-width: 120px; 
            height: auto; 
            display: block; 
            margin: 0 auto;
        }
        
        .product-info { 
            display: flex; 
            gap: 30px; 
            margin-bottom: 15px; 
        } 
        .product-image { 
            width: 180px; 
            flex-shrink: 0; 
        } 
        
        .product-image img {
            width: 180px; /* Tamaño fijo para la imagen */
            height: auto;
        }
        
        .product-details { 
            flex: 1; 
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .description-formatted { 
            line-height: 1.4; 
            color: ${textDark}; 
            white-space: normal; 
            word-wrap: break-word; 
            word-break: break-word; 
        }
        
        .description-formatted strong { 
            color: ${primaryDark}; 
        }
        
        /* Resto de estilos para asegurar que todo el texto y estructura sean correctos */
        .company-info h2, .title-container h3 { 
            color: ${textDark}; 
        }
        .footer { 
            margin-top: 30px; 
            border-top: 1px solid ${borderColor}; 
            padding-top: 20px; 
            text-align: center; 
            font-size: 10pt; 
            color: ${textLight}; 
        }
    `;
    
    // La función devuelve el HTML completo (incluyendo el contenido generado por generarHTMLContentPuro)
    return `
      <html>
        <head>
          <title>Ficha Técnica</title>
          <style>${cssContent}</style>
        </head>
        <body style="margin: 0; padding: 0;">
          ${generarHTMLContentPuro(producto)}
        </body>
      </html>
    `;
}

// Funciones auxiliares
function mostrarCargaTabla(mostrar) {
  const loading = document.getElementById('table-loading');
  loading.style.display = mostrar ? 'flex' : 'none';
}

function mostrarNotificacion(mensaje, tipo) {
  const notification = document.createElement('div');
  notification.className = `notification ${tipo}`;
  notification.innerHTML = `
    <i class="fa-solid fa-${tipo === 'success' ? 'check' : tipo === 'warning' ? 'exclamation-triangle' : 'exclamation'}-circle"></i>
    <span>${mensaje}</span>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 400);
  }, 3000);
}

// Cerrar modal al hacer clic fuera de él
window.onclick = function(event) {
  const modals = document.getElementsByClassName('modal');
  for (let modal of modals) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  }
}