// --- FUNCIÓN AUXILIAR AGREGADA: RUTAS ABSOLUTAS ---
/**
 * Convierte una ruta relativa en una URL absoluta completa para resolver problemas
 * de carga en impresión y documentos exportados.
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
// --- FIN FUNCIÓN AUXILIAR ---

//
// javascript/reporte.js
// Variables globales
let boletasPaginaActual = 1;
const BOLETAS_POR_PAGINA = 6;
let boletasActuales = [];
let reportesSemanales = [];
let reportesMensuales = [];

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    cargarReportesGuardados();
    configurarSelectoresFecha();
    establecerFechasPorDefecto();
    
    // Asignar el menú activo
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeItem = document.querySelector('a[href*="reporte.html"]');
    if (activeItem) {
        activeItem.classList.add('active');
    }
});

// Cargar reportes guardados del localStorage
function cargarReportesGuardados() {
    try {
        const reportesGuardados = localStorage.getItem('reportesSemanales');
        if (reportesGuardados) {
            reportesSemanales = JSON.parse(reportesGuardados);
        }
    } catch(e) { console.error("Error al parsear reportes semanales", e); reportesSemanales = []; }
    
    try {
        const reportesMensualesGuardados = localStorage.getItem('reportesMensuales');
        if (reportesMensualesGuardados) {
            reportesMensuales = JSON.parse(reportesMensualesGuardados);
        }
    } catch(e) { console.error("Error al parsear reportes mensuales", e); reportesMensuales = []; }
    
    cargarReportesSemanales();
    cargarReportesMensuales();
}

// Guardar reportes en localStorage
function guardarReportes() {
    try {
        localStorage.setItem('reportesSemanales', JSON.stringify(reportesSemanales));
        localStorage.setItem('reportesMensuales', JSON.stringify(reportesMensuales));
    } catch (e) {
        console.error("Error al guardar reportes en localStorage", e);
        alert("No se pudo guardar el reporte, el almacenamiento está lleno.");
    }
}

// Configurar selectores de fecha según tipo de reporte
function configurarSelectoresFecha() {
    const reportType = document.getElementById('report-type');
    const monthSelector = document.getElementById('month-selector');
    const weekSelector = document.getElementById('week-selector');
    
    if (!reportType || !monthSelector || !weekSelector) return;
    
    const toggleSelectors = () => {
        if (reportType.value === 'semanal') {
            monthSelector.style.display = 'none';
            weekSelector.style.display = 'block';
        } else {
            monthSelector.style.display = 'block';
            weekSelector.style.display = 'none';
        }
    };
    
    toggleSelectors(); // Llamada inicial
    reportType.addEventListener('change', toggleSelectors);
}

// Establecer fechas por defecto
function establecerFechasPorDefecto() {
    const hoy = new Date();
    
    // Corregir para que use la zona horaria local
    const hoyISO = new Date(hoy.getTime() - (hoy.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    
    // Establecer mes actual
    document.getElementById('period').value = hoyISO.substring(0, 7); // 'YYYY-MM'
    
    // Establecer semana actual (lunes a domingo)
    const diaSemana = hoy.getDay();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1)); // Lunes
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6); // Domingo
    
    document.getElementById('start-date').value = formatearFechaISO(lunes);
    document.getElementById('end-date').value = formatearFechaISO(domingo);
}

// Formatear fecha a YYYY-MM-DD
function formatearFechaISO(fecha) {
    return new Date(fecha.getTime() - (fecha.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
}

// Cargar reportes semanales
function cargarReportesSemanales() {
    const tbody = document.getElementById('weekly-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!reportesSemanales || reportesSemanales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No hay reportes semanales generados</td></tr>`;
        return;
    }

    reportesSemanales.forEach((reporte, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${reporte.semana}</td>
            <td>${reporte.inicio}</td>
            <td>${reporte.fin}</td>
            <td>S/ ${reporte.total.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            <td>${reporte.ventas}</td>
            <td>${reporte.productos}</td>
            <td>
                <button class="btn btn-primary" onclick="verBoletas('semanal', ${index})">
                    <i class="fa-solid fa-eye"></i> Ver Boletas
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Cargar reportes mensuales
function cargarReportesMensuales() {
    const tbody = document.getElementById('monthly-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!reportesMensuales || reportesMensuales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No hay reportes mensuales generados</td></tr>`;
        return;
    }

    reportesMensuales.forEach((reporte, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${reporte.mes}</td>
            <td>${reporte.año}</td>
            <td>S/ ${reporte.total.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            <td>${reporte.ventas}</td>
            <td>${reporte.productos}</td>
            <td>
                <button class="btn btn-primary" onclick="verBoletas('mensual', ${index})">
                    <i class="fa-solid fa-eye"></i> Ver Boletas
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}


// Generar reporte
async function generarReporte() {
    const tipo = document.getElementById('report-type').value;
    let periodo = '';
    let boletas = [];
    let startDate, endDate;
    
    try {
        if (tipo === 'semanal') {
            startDate = document.getElementById('start-date').value;
            endDate = document.getElementById('end-date').value;
            
            if (!startDate || !endDate) {
                alert('Por favor seleccione ambas fechas');
                return;
            }
            
            periodo = `${formatearFecha(startDate)} a ${formatearFecha(endDate)}`;
            boletas = await obtenerBoletas(startDate, endDate);
            
            if (boletas.length === 0) {
                alert('No se encontraron ventas ni servicios para el rango de fechas seleccionado');
                return;
            }
            
            const reporte = {
                semana: `Semana ${getNumeroSemana(new Date(startDate + 'T00:00:00-05:00'))}`,
                inicio: formatearFecha(startDate),
                fin: formatearFecha(endDate),
                total: calcularTotal(boletas),
                ventas: boletas.length,
                productos: calcularProductosVendidos(boletas),
                boletas: boletas
            };
            
            reportesSemanales.push(reporte);
            guardarReportes();
            cargarReportesSemanales();
            
        } else {
            const month = document.getElementById('period').value; // 'YYYY-MM'
            
            const fecha = new Date(month + '-02T00:00:00-05:00'); // Usar día 2 para evitar problemas de zona horaria
            periodo = formatearMes(month);
            
            startDate = month + '-01';
            const ultimoDiaNum = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
            endDate = month + '-' + ultimoDiaNum;
            
            boletas = await obtenerBoletas(startDate, endDate);
            
            if (boletas.length === 0) {
                alert('No se encontraron ventas ni servicios para el mes seleccionado');
                return;
            }
            
            const reporte = {
                mes: fecha.toLocaleDateString('es-ES', { month: 'long' }),
                año: fecha.getFullYear().toString(),
                total: calcularTotal(boletas),
                ventas: boletas.length,
                productos: calcularProductosVendidos(boletas),
                boletas: boletas
            };
            
            reportesMensuales.push(reporte);
            guardarReportes();
            cargarReportesMensuales();
        }
        
        boletasActuales = boletas;
        verBoletas(tipo, periodo);
        
    } catch (error) {
        console.error('Error al generar reporte:', error);
        alert('Error al generar el reporte: ' + error.message);
    }
}

// Obtener boletas (función unificada)
async function obtenerBoletas(inicio, fin) {
    try {
        const formData = new FormData();
        formData.append('action', 'obtener_boletas_rango');
        formData.append('fecha_inicio', inicio);
        formData.append('fecha_fin', fin);
        
        const response = await fetch('../api/ventas.php', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Error en la respuesta del servidor: ${response.status} ${errText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            return data.boletas;
        } else {
            throw new Error(data.message || 'Error al obtener boletas');
        }
    } catch (error) {
        console.error('Error al obtener boletas por rango:', error);
        throw error;
    }
}

// --- Funciones de Cálculo ---

function getNumeroSemana(fecha) {
    const primerDiaAño = new Date(fecha.getFullYear(), 0, 1);
    const dias = Math.floor((fecha - primerDiaAño) / (24 * 60 * 60 * 1000));
    return Math.ceil((dias + primerDiaAño.getDay() + 1) / 7);
}

function calcularTotal(boletas) {
    if (!boletas) return 0;
    return boletas.reduce((total, boleta) => total + (boleta.total || 0), 0);
}

function calcularProductosVendidos(boletas) {
    if (!boletas) return 0;
    return boletas.reduce((total, boleta) => {
        const totalProductos = boleta.productos ? boleta.productos.reduce((sum, producto) => sum + (parseInt(producto.cantidad) || 0), 0) : 0;
        // Sumar 1 por la "mano de obra" si es un servicio
        const totalServicio = (boleta.tipo_venta === 'servicio' && boleta.costo_servicio > 0) ? 1 : 0;
        return total + totalProductos + totalServicio;
    }, 0);
}

// --- Funciones de Visualización de Boletas ---

function verBoletas(tipo, parametro) {
    const section = document.getElementById('receipts-section');
    const title = document.getElementById('receipts-title');
    
    if (typeof parametro === 'number') {
        if (tipo === 'semanal') {
            boletasActuales = reportesSemanales[parametro].boletas;
            title.textContent = `Boletas de Venta - ${reportesSemanales[parametro].semana} (Total: ${boletasActuales.length} ventas)`;
        } else {
            boletasActuales = reportesMensuales[parametro].boletas;
            title.textContent = `Boletas de Venta - ${reportesMensuales[parametro].mes} ${reportesMensuales[parametro].año} (Total: ${boletasActuales.length} ventas)`;
        }
    } else {
        title.textContent = `Boletas de Venta - ${parametro} (Total: ${boletasActuales.length} ventas)`;
    }
    
    const totalPaginas = Math.ceil(boletasActuales.length / BOLETAS_POR_PAGINA);
    configurarPaginacion(totalPaginas);
    
    mostrarPagina(1);
    
    section.classList.add('active');
    section.scrollIntoView({ behavior: 'smooth' });
}

function configurarPaginacion(totalPaginas) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    for (let i = 1; i <= totalPaginas; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${i === 1 ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => mostrarPagina(i);
        pagination.appendChild(pageBtn);
    }
}

// *** ESTA ES LA FUNCIÓN CLAVE MODIFICADA ***
function mostrarPagina(pagina) {
    const container = document.getElementById('receipts-container');
    const pageBtns = document.querySelectorAll('.page-btn');
    
    pageBtns.forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.textContent) === pagina) {
            btn.classList.add('active');
        }
    });
    
    const inicio = (pagina - 1) * BOLETAS_POR_PAGINA;
    const fin = inicio + BOLETAS_POR_PAGINA;
    const boletasPagina = boletasActuales.slice(inicio, fin);
    
    container.innerHTML = '';
    
    boletasPagina.forEach(boleta => {
        const boletaElement = document.createElement('div');
        boletaElement.className = 'receipt'; // Esta clase la define reporte.css
        
        let boletaHTML = '';
        
        // Comprobar si es venta de 'producto' o 'servicio'
        if (boleta.tipo_venta === 'servicio') {
            boletaHTML = generarTicketServicio(boleta);
        } else {
            boletaHTML = generarTicketProducto(boleta);
        }
        
        boletaElement.innerHTML = boletaHTML;
        container.appendChild(boletaElement);
    });
    
    // Rellenar espacios vacíos
    for (let i = boletasPagina.length; i < BOLETAS_POR_PAGINA; i++) {
        const espacioVacio = document.createElement('div');
        espacioVacio.className = 'receipt';
        espacioVacio.style.visibility = 'hidden';
        container.appendChild(espacioVacio);
    }
    
    boletasPaginaActual = pagina;
}

function cerrarBoletas() {
    document.getElementById('receipts-section').classList.remove('active');
}

// --- Funciones de Soporte (Copiadas y Adaptadas) ---

// Función para alinear texto en POS (Usada por ambos generadores)
function alinearPOS_formato_nuevo(cant, desc, pu, subt) {
    const descCompleta = desc || 'Producto';
    const puCompleto = `P.U.: S/${pu}`;
    const subtCompleto = `Subt.: S/${subt}`;

    const style_row_desc = 'style="display: flex; width: 100%; padding-top: 2px; font-size: 10px; line-height: 1.2;"';
    const style_row_price = 'style="display: flex; width: 100%; padding-top: 1px; font-size: 9px; line-height: 1.2;"';
    const style_c_cant = 'style="width: 12%; text-align: left; font-weight: bold;"';
    const style_c_desc = 'style="width: 88%; text-align: left; word-break: break-all; padding: 0 2px;"';
    const style_c_indent = 'style="width: 12%;"';
    const style_c_pu = 'style="width: 44%; text-align: right; white-space: nowrap; padding-right: 2px;"';
    const style_c_subt = 'style="width: 44%; text-align: right; white-space: nowrap;"';

    let html = '';
    html += `<div ${style_row_desc}><span ${style_c_cant}>${cant}</span><span ${style_c_desc}>${descCompleta}</span></div>`;
    html += `<div ${style_row_price}><span ${style_c_indent}></span><span ${style_c_pu}>${puCompleto}</span><span ${style_c_subt}>${subtCompleto}</span></div>`;
    return html;
};

// Generador de Ticket para VENTA DE PRODUCTO (Adaptado de cliente.js)
function generarTicketProducto(venta) {
    const { tipo_comprobante, subtotal = 0, igv = 0, total = 0 } = venta;
    
    // --- INICIO DE MODIFICACIÓN ---
    const vendedor_nombre = venta.vendedor_nombre || 'N/A';
    // --- FIN DE MODIFICACIÓN ---

    let productosHTML = '';
    if (venta.productos && venta.productos.length > 0) {
        venta.productos.forEach(item => {
            productosHTML += alinearPOS_formato_nuevo(
                item.cantidad || 0,
                item.nombre || 'Producto',
                (item.precio_unitario || 0).toFixed(2),
                (item.subtotal || 0).toFixed(2)
            );
        });
    }

    let totalesHTML = '';
    if (tipo_comprobante === 'FACTURA') {
        totalesHTML = `
            <div style="display: grid; grid-template-columns: 1fr auto; font-weight: bold; font-size: 10px;"><span style="text-align: left;">SUBTOTAL:</span><span style="text-align: right;">S/ ${subtotal.toFixed(2)}</span></div>
            <div style="display: grid; grid-template-columns: 1fr auto; font-weight: bold; font-size: 10px;"><span style="text-align: left;">IGV (18%):</span><span style="text-align: right;">S/ ${igv.toFixed(2)}</span></div>
        `;
    }
    totalesHTML += `
        <div style="display: grid; grid-template-columns: 1fr auto; font-weight: bold; font-size: 12px; border-top: 1px solid #000; padding-top: 2px; margin-top: 2px;">
            <span style="text-align: left;">TOTAL:</span>
            <span style="text-align: right;">S/ ${total.toFixed(2)}</span>
        </div>
    `;

    return `
        <div class="ticket" style="width: 100%; max-width: 300px; margin: 0 auto; background: #fff; padding: 10px; font-family: 'Courier New', monospace; font-size: 10px; line-height: 1.4;">
            <div style="text-align: center;">
                <img src="../logoinfo.png" alt="Logo" style="max-width: 100px; height: auto; margin-bottom: 10px;">
                <div style="font-size: 12px; font-weight: bold; margin: 0; padding: 0;">INFOCOM TECNOLOGY</div>
                <div style="font-size: 10px; margin: 0; padding: 0;">FRANCO TARAPA EDSON ADRIAN</div>
                <div style="font-size: 10px; margin: 0; padding: 0;">RUC: 10479533852</div>
                <div style="font-size: 10px; margin: 0; padding: 0;">24 de Octubre MZ 53 LT 03</div>
                <div style="font-size: 10px; margin: 0; padding: 0;">ILO - MOQUEGUA</div>
                <div style="font-size: 10px; margin: 0; padding: 0;">TEL: 983326971</div>
                <hr style="border: none; border-top: 1px dashed #000; margin: 5px 0;">
                <div style="font-size: 12px; font-weight: bold;">${tipo_comprobante} DE VENTA</div>
                <p style="margin: 2px 0;">N°: ${venta.numero_comprobante || 'N/A'}</p>
                <p style="margin: 2px 0;">Fecha: ${venta.fecha_venta_formateada || 'N/A'}</p>
            </div>
            <hr style="border: none; border-top: 1px dashed #000; margin: 5px 0;">
            <div>
                <p style="margin: 2px 0;"><strong>Cliente:</strong> ${venta.cliente_nombre || 'Cliente General'}</p>
                <p style="margin: 2px 0;"><strong>${venta.cliente_tipo_documento || 'DNI'}:</strong> ${venta.cliente_documento || 'S/N'}</p>
            </div>
            <hr style="border: none; border-top: 1px dashed #000; margin: 5px 0;">
            <div style="width: 100%;">
                <div style="display: flex; width: 100%; font-weight: bold; border-bottom: 1px dashed #000; padding-bottom: 2px; font-size: 10px;">
                    <span style="width: 12%; text-align: left;">Cant</span>
                    <span style="width: 88%; text-align: left; padding: 0 2px;">Descripción</span>
                </div>
                ${productosHTML}
            </div>
            <div style="margin-top: 5px; padding-top: 5px; border-top: 1px dashed #000;">
                ${totalesHTML}
            </div>
            <hr style="border: none; border-top: 1px dashed #000; margin: 5px 0;">
            <div style="text-align: center;">
                <p style="margin: 2px 0;">Atendido por: ${vendedor_nombre}</p>
            </div>
            <div style="text-align: center;">
                <p style="margin: 5px 0 0 0; font-weight: bold; font-size: 11px;">¡GRACIAS POR ELEGIR INFOCOM!</p>
                <p style="font-size: 9px; margin: 0;">Esperamos que disfrute su compra. Nuestro compromiso es ofrecerle siempre la mejor tecnología y servicio técnico.</p>
            </div>
        </div>
    `;
}

// Generador de Ticket para VENTA DE SERVICIO (Adaptado de servicios.js)
function generarTicketServicio(servicio) {
    const { tipo_comprobante, total = 0, subtotal_productos = 0, costo_servicio = 0 } = servicio;
    
    // --- INICIO DE MODIFICACIÓN ---
    const vendedor_nombre = servicio.vendedor_nombre || 'N/A';
    // --- FIN DE MODIFICACIÓN ---

    let titulo = '';
    let conIGV = false;

    if (tipo_comprobante === 'boleta') {
        titulo = 'BOLETA DE VENTA';
        conIGV = false;
    } else if (tipo_comprobante === 'factura') {
        titulo = 'FACTURA DE VENTA';
        conIGV = true;
    } else {
        titulo = 'ORDEN DE SERVICIO'; 
        conIGV = false;
    }
    
    let totalNeto = total;
    let subtotalFactura = servicio.subtotal; // Usamos el subtotal calculado en PHP
    let igv = servicio.igv; // Usamos el IGV calculado en PHP
    
    let itemsHTML = '';
    if (servicio.productos && servicio.productos.length > 0) {
        servicio.productos.forEach(p => {
            itemsHTML += alinearPOS_formato_nuevo(
                p.cantidad,
                p.nombre,
                (p.precio_unitario || 0).toFixed(2),
                (p.subtotal || 0).toFixed(2)
            );
        });
    }
    // Añadir mano de obra como un item más
    itemsHTML += alinearPOS_formato_nuevo(
        1,
        'Mano de Obra / Serv. Téc.',
        costo_servicio.toFixed(2),
        costo_servicio.toFixed(2)
    );
    
    let totalesHTML = '';
    if (conIGV) {
        totalesHTML = `
            <div style="display: grid; grid-template-columns: 1fr auto; font-weight: bold; font-size: 10px;"><span style="text-align: left;">SUBTOTAL:</span><span style="text-align: right;">S/ ${subtotalFactura.toFixed(2)}</span></div>
            <div style="display: grid; grid-template-columns: 1fr auto; font-weight: bold; font-size: 10px;"><span style="text-align: left;">IGV (18%):</span><span style="text-align: right;">S/ ${igv.toFixed(2)}</span></div>
        `;
    } else {
         totalesHTML = `
            <div style="display: grid; grid-template-columns: 1fr auto; font-weight: bold; font-size: 10px;"><span style="text-align: left;">T. PRODUCTOS:</span><span style="text-align: right;">S/ ${subtotal_productos.toFixed(2)}</span></div>
            <div style="display: grid; grid-template-columns: 1fr auto; font-weight: bold; font-size: 10px;"><span style="text-align: left;">T. SERVICIO:</span><span style="text-align: right;">S/ ${costo_servicio.toFixed(2)}</span></div>
        `;
    }
    totalesHTML += `
        <div style="display: grid; grid-template-columns: 1fr auto; font-weight: bold; font-size: 12px; border-top: 1px solid #000; padding-top: 2px; margin-top: 2px;">
            <span style="text-align: left;">TOTAL:</span>
            <span style="text-align: right;">S/ ${totalNeto.toFixed(2)}</span>
        </div>
    `;

    return `
        <div class="ticket" style="width: 100%; max-width: 300px; margin: 0 auto; background: #fff; padding: 10px; font-family: 'Courier New', monospace; font-size: 10px; line-height: 1.4;">
            <div style="text-align: center;">
                <img src="../logoinfo.png" alt="Logo" style="max-width: 100px; height: auto; margin-bottom: 10px;">
                <div style="font-size: 12px; font-weight: bold; margin: 0; padding: 0;">INFOCOM TECNOLOGY</div>
                <div style="font-size: 10px; margin: 0; padding: 0;">FRANCO TARAPA EDSON ADRIAN</div>
                <div style="font-size: 10px; margin: 0; padding: 0;">RUC: 10479533852</div>
                <div style="font-size: 10px; margin: 0; padding: 0;">24 de Octubre MZ 53 LT 03</div>
                <div style="font-size: 10px; margin: 0; padding: 0;">ILO - MOQUEGUA</div>
                <div style="font-size: 10px; margin: 0; padding: 0;">TEL: 983326971</div>
                <hr style="border: none; border-top: 1px dashed #000; margin: 5px 0;">
                <div style="font-size: 12px; font-weight: bold;">${titulo}</div>
                <p style="margin: 2px 0;">N°: ${servicio.numero_comprobante}</p>
            </div>
            <hr style="border: none; border-top: 1px dashed #000; margin: 5px 0;">
            <div>
                <p style="margin: 2px 0;"><strong>Fecha:</strong> ${servicio.fecha_venta_formateada}</p>
                <p style="margin: 2px 0;"><strong>Cliente:</strong> ${servicio.cliente_nombre}</p>
                <p style="margin: 2px 0;"><strong>${servicio.cliente_tipo_documento}:</strong> ${servicio.cliente_documento}</p>
                <p style="margin: 2px 0;"><strong>Teléfono:</strong> ${servicio.cliente_telefono || ''}</p>
            </div>
            <hr style="border: none; border-top: 1px dashed #000; margin: 5px 0;">
            <div>
                <p style="margin: 2px 0;"><strong>Equipo:</strong> ${servicio.equipo_nombre || 'N/A'}</p>
                <div style="border: 1px solid #000; padding: 5px; margin: 5px 0; text-align: left; font-size: 9px; word-break: break-all;">
                    <strong>Problema:</strong> ${servicio.equipo_problema || 'N/A'}
                </div>
            </div>
            <div style="width: 100%;">
                <div style="display: flex; width: 100%; font-weight: bold; border-bottom: 1px dashed #000; padding-bottom: 2px; font-size: 10px;">
                    <span style="width: 12%; text-align: left;">Cant</span>
                    <span style="width: 88%; text-align: left; padding: 0 2px;">Descripción</span>
                </div>
                ${itemsHTML}
            </div>
            <div style="margin-top: 5px; padding-top: 5px; border-top: 1px dashed #000;">
                ${totalesHTML}
            </div>
            <hr style="border: none; border-top: 1px dashed #000; margin: 5px 0;">
            <div style="text-align: center;">
                <p style="margin: 2px 0;">Atendido por: ${vendedor_nombre}</p>
            </div>
            <div style="text-align: center;">
                <p style="margin: 5px 0 0 0; font-weight: bold; font-size: 11px;">¡GRACIAS POR ELEGIR INFOCOM!</p>
                <p style="font-size: 9px; margin: 0;">Esperamos que su equipo quede perfecto. Nuestro compromiso es ofrecerle el mejor servicio técnico.</p>
            </div>
        </div>
    `;
}


// --- Funciones auxiliares de formato ---
function formatearFecha(fechaISO) {
    if (!fechaISO) return 'N/A';
    const fecha = new Date(fechaISO + 'T00:00:00-05:00'); // Asumir zona horaria local
    return `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
}

function formatearMes(mesISO) {
    const fecha = new Date(mesISO + '-02T00:00:00-05:00'); // Usar día 2
    const opciones = { month: 'long', year: 'numeric', timeZone: 'America/Lima' };
    return fecha.toLocaleDateString('es-ES', opciones);
}

function guardarReporte() {
    // La función "Guardar" ahora solo manda a imprimir la vista actual
    window.print();
}

async function descargarReportePDF() {
    if (!boletasActuales || boletasActuales.length === 0) {
        alert("No hay datos para generar el reporte PDF.");
        return;
    }

    const btn = document.querySelector('.btn-success i.fa-file-pdf').parentNode;
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';
    btn.disabled = true;

    // 1. Separar los datos
    const listaVentas = boletasActuales.filter(b => b.tipo_venta === 'producto');
    const listaServicios = boletasActuales.filter(b => b.tipo_venta === 'servicio');

    // 2. Calcular totales independientes
    const totalVentas = listaVentas.reduce((sum, b) => sum + (parseFloat(b.total) || 0), 0);
    const totalServicios = listaServicios.reduce((sum, b) => sum + (parseFloat(b.total) || 0), 0);

    // 3. Obtener título del periodo
    const tituloTexto = document.getElementById('receipts-title').textContent
        .replace('Boletas de Venta - ', '')
        .split('(')[0].trim();

    // 4. Preparar objeto estructurado
    const datosReporte = {
        periodo: tituloTexto,
        total_ventas: totalVentas,
        total_servicios: totalServicios,
        lista_ventas: listaVentas,
        lista_servicios: listaServicios
    };

    try {
        const response = await fetch('../api/descargar_reporte.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosReporte)
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Reporte_Infocom_${new Date().toISOString().slice(0,10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } else {
            throw new Error("Error en el servidor al generar PDF");
        }
    } catch (error) {
        console.error(error);
        alert("Error al generar el reporte.");
    } finally {
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
    }
}

// --- FUNCIÓN AGREGADA: DESCARGAR REPORTE EN FORMATO EXCEL (XLS) ---

function descargarReporteExcel() {
    if (!boletasActuales || boletasActuales.length === 0) {
        alert("No hay datos para generar el reporte en Excel.");
        return;
    }

    // 1. Separar datos y calcular totales
    const listaVentas = boletasActuales.filter(b => b.tipo_venta === 'producto');
    const listaServicios = boletasActuales.filter(b => b.tipo_venta === 'servicio');
    const totalGeneral = calcularTotal(boletasActuales);
    const totalVentas = listaVentas.reduce((sum, b) => sum + (parseFloat(b.total) || 0), 0);
    const totalServicios = listaServicios.reduce((sum, b) => sum + (parseFloat(b.total) || 0), 0);
    
    // 2. Obtener título del periodo
    const tituloTexto = document.getElementById('receipts-title').textContent
        .replace('Boletas de Venta - ', '')
        .split('(')[0].trim();

    // 3. Generar el contenido HTML para Excel
    const htmlContent = generarHTMLParaExcel(
        tituloTexto, 
        totalGeneral, 
        totalVentas, 
        totalServicios, 
        listaVentas, 
        listaServicios
    );

    // 4. Crear Blob y descargar como archivo .xls
    const link = document.createElement('a');
    // El carácter \uFEFF es el BOM (Byte Order Mark), crucial para que Excel maneje UTF-8 y acentos correctamente
    const blob = new Blob(["\uFEFF", htmlContent], {
        type: 'application/vnd.ms-excel;charset=utf-8'
    });
    
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_Infocom_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert("Archivo Excel generado y descargado.");
}

// --- GENERADOR DE HTML CON ESTILOS PARA EXCEL (XLS) ---

function generarHTMLParaExcel(periodo, totalGeneral, totalVentas, totalServicios, ventas, servicios) {
    const primaryColor = '#27ae60';
    const darkText = '#2c3e50';
    // Se usa la función auxiliar getAbsoluteUrl
    const logoUrl = getAbsoluteUrl('../logoinfo.png'); 

    // Función para formatear fechas (si no existe)
    const formatFecha = (f) => f ? f.split(' ')[0] : 'N/A';

    let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <style>
                body { font-family: 'Poppins', sans-serif; }
                table { border-collapse: collapse; width: 100%; margin-bottom: 25px; font-size: 10pt; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background-color: ${primaryColor}; color: white; font-weight: bold; border-color: ${primaryColor}; }
                .header-main-row td { background-color: #f1f9f4; font-size: 16px; color: ${darkText}; font-weight: bold; padding: 15px 10px; }
                .summary-table td { font-weight: bold; padding: 10px; }
                .total-general-row td { background-color: #d5f4e6; color: ${darkText}; font-size: 11pt; border-color: #ccc; }
                .detail-header-row th { background-color: #34495e; color: white; }
                .detail-item-row td { background-color: #f8f8f8; font-size: 9pt; }
            </style>
        </head>
        <body>
            <table>
                <tr>
                    <td colspan="9" style="text-align: center; border: none; padding: 20px;">
                        <img src="${logoUrl}" width="120" height="auto" alt="Logo INFOCOM" style="display: block; margin: 0 auto 15px auto;">
                        <h1 style="color: ${primaryColor}; margin: 0; font-size: 18pt;">INFOCOM TECNOLOGY</h1>
                        <h2 style="color: ${darkText}; font-size: 14pt; margin: 5px 0 0 0;">REPORTE FINANCIERO</h2>
                        <h3 style="color: ${darkText}; font-size: 11pt; margin: 5px 0 10px 0;">Período: ${periodo}</h3>
                    </td>
                </tr>
            </table>

            <table class="summary-table">
                <thead>
                    <tr class="header-main-row" style="background-color: ${primaryColor}; color: white;">
                        <td colspan="2" style="background-color: ${primaryColor}; color: white;">RESUMEN DE TOTALES</td>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>Total Ventas Productos:</td><td style="text-align: right;">S/ ${totalVentas.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td></tr>
                    <tr><td>Total Servicios Técnicos:</td><td style="text-align: right;">S/ ${totalServicios.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td></tr>
                    <tr class="total-general-row"><td>TOTAL GENERAL:</td><td style="text-align: right; color: ${primaryColor}; font-size: 12pt;">S/ ${totalGeneral.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td></tr>
                </tbody>
            </table>
            
            <table>
                <thead>
                    <tr class="header-main-row" style="background-color: #34495e; color: white;">
                        <td colspan="9">1. VENTAS DE PRODUCTOS (${ventas.length} Transacciones)</td>
                    </tr>
                    <tr class="detail-header-row">
                        <th>N° Comprobante</th><th>Tipo</th><th>Fecha</th><th>Cliente</th><th>Documento</th><th>Teléfono</th><th>Vendedor</th><th>Subtotal</th><th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${ventas.map(v => `
                        <tr>
                            <td>${v.numero_comprobante}</td>
                            <td>${v.tipo_comprobante}</td>
                            <td>${formatFecha(v.fecha_venta)}</td>
                            <td>${v.cliente_nombre}</td>
                            <td>${v.cliente_documento}</td>
                            <td>${v.cliente_telefono || ''}</td>
                            <td>${v.vendedor_nombre}</td>
                            <td style="text-align: right;">S/ ${v.subtotal.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
                            <td style="text-align: right; font-weight: bold;">S/ ${v.total.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
                        </tr>
                        ${v.productos.map(p => `
                            <tr class="detail-item-row">
                                <td colspan="3" style="border: none;"></td>
                                <td colspan="3">Producto: ${p.nombre}</td>
                                <td>Cant: ${p.cantidad}</td>
                                <td style="text-align: right;">P.U.: S/ ${p.precio_unitario.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
                                <td style="text-align: right;">Subt: S/ ${p.subtotal.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
                            </tr>
                        `).join('')}
                    `).join('')}
                    <tr><td colspan="8" style="text-align: right; font-weight: bold; background-color: #f1f9f4;">TOTAL VENTA PRODUCTOS:</td><td style="text-align: right; font-weight: bold; background-color: #f1f9f4;">S/ ${totalVentas.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td></tr>
                </tbody>
            </table>

            <table>
                <thead>
                    <tr class="header-main-row" style="background-color: #34495e; color: white;">
                        <td colspan="9">2. SERVICIOS TÉCNICOS (${servicios.length} Transacciones)</td>
                    </tr>
                    <tr class="detail-header-row">
                        <th>N° Servicio</th><th>Tipo</th><th>Fecha Ingreso</th><th>Cliente</th><th>Documento</th><th>Teléfono</th><th>Vendedor</th><th>Costo M.O.</th><th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${servicios.map(s => `
                        <tr>
                            <td>SERV-${String(s.id).padStart(6, '0')}</td>
                            <td>${s.tipo_comprobante.toUpperCase()}</td>
                            <td>${formatFecha(s.fecha_venta)}</td>
                            <td>${s.cliente_nombre}</td>
                            <td>${s.cliente_documento}</td>
                            <td>${s.cliente_telefono || ''}</td>
                            <td>${s.vendedor_nombre}</td>
                            <td style="text-align: right;">S/ ${s.costo_servicio.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
                            <td style="text-align: right; font-weight: bold;">S/ ${s.total.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
                        </tr>
                        <tr>
                            <td style="background-color: #f8f8f8;" colspan="9">
                                <strong>Problema:</strong> ${s.equipo_problema || 'N/A'} - 
                                <strong>Equipo:</strong> ${s.equipo_nombre || 'N/A'}
                            </td>
                        </tr>
                        ${s.productos.length > 0 ? s.productos.map(p => `
                            <tr class="detail-item-row">
                                <td colspan="3" style="border: none;"></td>
                                <td colspan="3">Producto Usado: ${p.nombre}</td>
                                <td>Cant: ${p.cantidad}</td>
                                <td style="text-align: right;">P.U.: S/ ${p.precio_unitario.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
                                <td style="text-align: right;">Subt: S/ ${p.subtotal.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
                            </tr>
                        `).join(''):''}
                    `).join('')}
                    <tr><td colspan="8" style="text-align: right; font-weight: bold; background-color: #f1f9f4;">TOTAL SERVICIOS TÉCNICOS:</td><td style="text-align: right; font-weight: bold; background-color: #f1f9f4;">S/ ${totalServicios.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td></tr>
                </tbody>
            </table>
            
        </body>
        </html>
    `;

    return html;
}