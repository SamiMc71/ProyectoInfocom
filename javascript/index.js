// javascript/index.js
// CÓDIGO LIMPIO: Solo para el panel de control (Dashboard)

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Panel de control inicializado');

  // Elementos del DOM (Solo para estadísticas y tablas)
  const clientsTodayEl = document.getElementById('clients-today');
  const productsSoldEl = document.getElementById('products-sold');
  const incomeTodayEl = document.getElementById('income-today');
  const quotationsTodayEl = document.getElementById('quotations-today');
  const servicesTodayEl = document.getElementById('services-today');
  
  const refreshBtn = document.getElementById('refresh-btn');
  
  // Elementos de la tabla de ventas
  const salesTableBody = document.getElementById('sales-table-body');
  const salesTable = document.getElementById('sales-table');
  const tableLoading = document.getElementById('table-loading');
  const tableEmpty = document.getElementById('table-empty');

  // Elementos para la tabla de servicios
  const servicesTableBody = document.getElementById('services-table-body');
  const servicesTable = document.getElementById('services-table');
  const servicesTableLoading = document.getElementById('services-table-loading');
  const servicesTableEmpty = document.getElementById('services-table-empty');
  
  // URL de la API (solo la de dashboard)
  const DASHBOARD_API = '../api/dashboard.php';
  
  // Función para inicializar la aplicación
  function initApp() {
    // auth.js ya se encargó de la sesión y el menú.
    // Cargamos los datos del panel directamente.
    loadDashboardData();
    loadTodaySales();
    loadTodayServices();
  }
  
  // Cargar datos del dashboard (Estadísticas)
  async function loadDashboardData() {
    console.log('📊 Cargando estadísticas...');
    try {
      const response = await fetch(`${DASHBOARD_API}?action=stats`);
      if (!response.ok) throw new Error('Respuesta de red no fue OK');
      const data = await response.json();
      
      if (data.success) {
        console.log('Estadísticas recibidas:', data.data);
        updateStats(data.data);
      } else {
        throw new Error(data.message || 'Error al cargar estadísticas.');
      }
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
      showNotification(error.message, 'error');
    }
  }
  
  // Cargar ventas de hoy
  async function loadTodaySales() {
    console.log('💰 Cargando ventas de hoy...');
    showTableLoading(true);
    try {
      const response = await fetch(`${DASHBOARD_API}?action=sales_today`);
      if (!response.ok) throw new Error('Respuesta de red no fue OK');
      const data = await response.json();
      
      if (data.success) {
        console.log('Ventas recibidas:', data.data);
        updateSalesTable(data.data);
      } else {
        throw new Error(data.message || 'Error al cargar ventas.');
      }
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      showNotification(error.message, 'error');
      updateSalesTable([]);
    } finally {
      showTableLoading(false);
    }
  }

  // Cargar servicios de hoy
  async function loadTodayServices() {
    console.log('🔧 Cargando servicios de hoy...');
    showServiceTableLoading(true);
    try {
      const response = await fetch(`${DASHBOARD_API}?action=services_today`);
      if (!response.ok) throw new Error('Respuesta de red no fue OK');
      const data = await response.json();
      
      if (data.success) {
        console.log('Servicios recibidos:', data.data);
        updateServicesTable(data.data);
      } else {
        throw new Error(data.message || 'Error al cargar servicios.');
      }
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      showNotification(error.message, 'error');
      updateServicesTable([]);
    } finally {
      showServiceTableLoading(false);
    }
  }
  
  // Función para actualizar estadísticas
  function updateStats(stats) {
    if (clientsTodayEl) clientsTodayEl.textContent = stats.clients_today || '0';
    if (productsSoldEl) productsSoldEl.textContent = stats.products_sold_today || '0';
    if (incomeTodayEl) incomeTodayEl.textContent = `S/ ${parseFloat(stats.income_today || 0).toFixed(2)}`;
    if (quotationsTodayEl) quotationsTodayEl.textContent = stats.quotations_today || '0';
    if (servicesTodayEl) servicesTodayEl.textContent = stats.services_today || '0';
  }
    
  // Función para actualizar tabla de ventas
  function updateSalesTable(sales) {
    if (!salesTableBody || !salesTable || !tableEmpty) return;

    salesTableBody.innerHTML = '';
    
    if (!sales || sales.length === 0) {
      salesTable.style.display = 'none';
      tableEmpty.style.display = 'flex';
      return;
    }
    
    tableEmpty.style.display = 'none';
    salesTable.style.display = 'table';
    
    sales.forEach(sale => {
      const row = document.createElement('tr');
      const saleDate = new Date(sale.fecha_venta);
      const formattedTime = saleDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });

      row.innerHTML = `
        <td>${sale.numero_comprobante || 'N/A'}</td>
        <td>${sale.cliente_nombre || 'Cliente General'}</td>
        <td>${sale.primer_producto || 'Varios'} (${sale.cantidad_total} u.)</td>
        <td>S/ ${parseFloat(sale.total).toFixed(2)}</td>
        <td><span class="status-badge status-${sale.estado.toLowerCase()}">${sale.estado}</span></td>
        <td>${formattedTime}</td>
      `;
      salesTableBody.appendChild(row);
    });
  }

  // Función para actualizar tabla de servicios
  function updateServicesTable(services) {
    if (!servicesTableBody || !servicesTable || !servicesTableEmpty) return;

    servicesTableBody.innerHTML = '';
    
    if (!services || services.length === 0) {
      servicesTable.style.display = 'none';
      servicesTableEmpty.style.display = 'flex';
      return;
    }
    
    servicesTableEmpty.style.display = 'none';
    servicesTable.style.display = 'table';
    
    services.forEach(service => {
      const row = document.createElement('tr');
      const serviceDate = new Date(service.fecha_ingreso);
      const formattedTime = serviceDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });
      
      const estado = (service.estado || 'pendiente').charAt(0).toUpperCase() + (service.estado || 'pendiente').slice(1);

      row.innerHTML = `
        <td>${service.id}</td>
        <td>${service.cliente_nombre || 'N/A'}</td>
        <td>${service.equipo_nombre || 'N/A'}</td>
        <td><span class="status-badge status-${(service.estado || 'pendiente').toLowerCase()}">${estado}</span></td>
        <td>${formattedTime}</td>
      `;
      servicesTableBody.appendChild(row);
    });
  }
  
  // Función para mostrar/ocultar carga de tabla de VENTAS
  function showTableLoading(show) {
    if (!tableLoading || !salesTable || !tableEmpty) return;
    tableLoading.style.display = show ? 'flex' : 'none';
    if(show) {
        salesTable.style.display = 'none';
        tableEmpty.style.display = 'none';
    }
  }

  // Función para mostrar/ocultar carga de tabla de SERVICIOS
  function showServiceTableLoading(show) {
    if (!servicesTableLoading || !servicesTable || !servicesTableEmpty) return;
    servicesTableLoading.style.display = show ? 'flex' : 'none';
    if(show) {
        servicesTable.style.display = 'none';
        servicesTableEmpty.style.display = 'none';
    }
  }
  
  // Función para mostrar notificaciones
  function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <i class="fa-solid fa-${type === 'success' ? 'check' : type === 'warning' ? 'exclamation-triangle' : 'exclamation'}-circle"></i>
      <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 400);
    }, 3000);
  }
  
  // --- Event Listeners ---
  
  // Botón de Refrescar
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
      const icon = this.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-spinner fa-spin';
      
      showNotification('Actualizando datos...', 'success');
      
      // Recargar todos los datos
      loadDashboardData();
      loadTodaySales();
      loadTodayServices();
      
      setTimeout(() => {
        if (icon) icon.className = 'fa-solid fa-rotate';
      }, 1000);
    });
  }
  
  // Iniciar la aplicación
  initApp();
});