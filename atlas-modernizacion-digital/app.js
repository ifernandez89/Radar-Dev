/* ==========================================================================
   ATLAS DE MODERNIZACIÓN DIGITAL — LÓGICA DE APLICACIÓN JS
   ========================================================================== */

// 1. Estado Global de Datos
let sectoresData = [];
let problemasData = [];
let solucionesData = [];
let organizacionesData = [];
let ideasData = [];

let activeSectorFilter = 'todos';
let activeProvinciaFilter = 'todas';
let currentSearchQuery = '';

// 2. Inicialización de la Aplicación
document.addEventListener('DOMContentLoaded', () => {
    // Configurar Fecha Actual
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        dateEl.textContent = new Date().toISOString().split('T')[0];
    }
    
    // Carga de Datos JSON
    loadData();
    
    // Configurar Navegación y Listeners de UI
    setupEventListeners();
});

// Carga de Datos desde JSONs
async function loadData() {
    try {
        const [sectoresRes, problemasRes, solucionesRes, organizacionesRes, ideasRes] = await Promise.all([
            fetch('data/sectores.json'),
            fetch('data/problemas.json'),
            fetch('data/soluciones.json'),
            fetch('data/organizaciones.json'),
            fetch('data/ideas.json')
        ]);
        
        sectoresData = await sectoresRes.json();
        problemasData = await problemasRes.json();
        solucionesData = await solucionesRes.json();
        organizacionesData = await organizacionesRes.json();
        ideasData = await ideasRes.json();
        
        // Inicializar Dashboard e Interfaz
        buildDashboardKPIs();
        buildProspectosPrioritarios();
        
        // Manejar Ruta por Defecto o URL Hash actual
        handleRouting();
        
    } catch (error) {
        console.error('Error al cargar datos del Atlas Digital:', error);
        alert('Hubo un error al inicializar los datos del Atlas. Por favor, asegúrese de estar sirviendo el proyecto bajo un servidor HTTP.');
    }
}

// Configurar los Listeners del DOM
function setupEventListeners() {
    // Enrutamiento mediante Hash
    window.addEventListener('hashchange', handleRouting);
    
    // Sidebar Mobile Toggle
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('mobileNavToggle');
    
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
    
    // Cerrar sidebar si se hace clic fuera en móvil
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 992 && sidebar && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });
    
    // Buscador Global
    const searchInput = document.getElementById('globalSearch');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value.toLowerCase().trim();
            
            if (clearSearchBtn) {
                clearSearchBtn.style.display = currentSearchQuery ? 'block' : 'none';
            }
            
            triggerCurrentViewRender();
        });
    }
    
    if (clearSearchBtn && searchInput) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            currentSearchQuery = '';
            clearSearchBtn.style.display = 'none';
            triggerCurrentViewRender();
        });
    }
    
    // Modal Close Listeners
    const modal = document.getElementById('detailModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeDetailModal);
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeDetailModal();
            }
        });
    }
    
    // Filtro de Provincia
    const provFilterPills = document.getElementById('provincia-filter-pills');
    if (provFilterPills) {
        provFilterPills.addEventListener('click', (e) => {
            const button = e.target.closest('.filter-pill');
            if (!button) return;
            
            provFilterPills.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            activeProvinciaFilter = button.dataset.provincia;
            renderOrganizaciones();
        });
    }
    
    // KPI card redirects
    document.querySelectorAll('.kpi-card').forEach(card => {
        card.addEventListener('click', () => {
            const targetTab = card.dataset.targetTab;
            if (targetTab) {
                window.location.hash = `#${targetTab}`;
            }
        });
    });
}

// 3. Manejador de Enrutamiento (Hash Routing)
function handleRouting() {
    const hash = window.location.hash || '#inicio';
    const viewName = hash.replace('#', '');
    
    switchView(viewName);
}

// Cambiar de vista activa
function switchView(viewName) {
    // Ocultar todas las secciones
    const views = document.querySelectorAll('.dashboard-view');
    views.forEach(view => view.classList.remove('active'));
    
    // Desactivar todos los links de navegación
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    // Activar sección correspondiente
    const activeView = document.getElementById(`view-${viewName}`);
    if (activeView) {
        activeView.classList.add('active');
    } else {
        // Fallback a inicio
        document.getElementById('view-inicio').classList.add('active');
        viewName = 'inicio';
    }
    
    // Activar link de navegación correspondiente
    const activeNav = document.querySelector(`.nav-item[data-tab="${viewName}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }
    
    // Actualizar Breadcrumb y Título
    const breadcrumb = document.getElementById('breadcrumb');
    const titleEl = document.getElementById('current-view-title');
    
    const viewTitles = {
        'inicio': { breadcrumb: 'Atlas de Modernización', title: 'Tablero de Control' },
        'sectores': { breadcrumb: 'Sectores Críticos', title: 'Mapeo de Sectores' },
        'organizaciones': { breadcrumb: 'Directorio y CRM', title: 'Organizaciones Prospectadas' },
        'problemas': { breadcrumb: 'Catálogo de Dolores', title: 'Dolores Operativos Frecuentes' },
        'soluciones': { breadcrumb: 'Modernización', title: 'Propuestas de Solución' },
        'gestion-documental': { breadcrumb: 'Especialización', title: 'Gestión Documental + IA' },
        'ia': { breadcrumb: 'Innovación Tecnológica', title: 'Ideas de Productos IA' },
        'oportunidades': { breadcrumb: 'Priorización', title: 'Matriz de Oportunidades' }
    };
    
    if (breadcrumb && titleEl && viewTitles[viewName]) {
        breadcrumb.textContent = viewTitles[viewName].breadcrumb;
        titleEl.textContent = viewTitles[viewName].title;
    }
    
    // Renderizar los datos de la vista específica
    renderViewData(viewName);
    
    // Cerrar sidebar en móvil si está abierto
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.remove('open');
    }
}

// Desencadena el render de la vista actual (útil para búsquedas en tiempo real)
function triggerCurrentViewRender() {
    const hash = window.location.hash || '#inicio';
    const viewName = hash.replace('#', '');
    renderViewData(viewName);
}

// 4. Renderizadores de Vistas Específicas
function renderViewData(viewName) {
    switch (viewName) {
        case 'inicio':
            buildDashboardKPIs();
            buildProspectosPrioritarios();
            break;
        case 'sectores':
            renderSectores();
            break;
        case 'organizaciones':
            buildSectorFilterPills();
            renderOrganizaciones();
            break;
        case 'problemas':
            renderProblemas();
            break;
        case 'soluciones':
            renderSoluciones();
            break;
        case 'gestion-documental':
            renderGestionDocumentalEspecial();
            break;
        case 'ia':
            renderIdeasIA();
            break;
        case 'oportunidades':
            renderOportunidadesMatrix();
            break;
    }
}

// 5. Renderizado: INICIO (KPIs y Objetivos)
function buildDashboardKPIs() {
    document.getElementById('kpi-sectores').textContent = sectoresData.length;
    document.getElementById('kpi-organizaciones').textContent = organizacionesData.length;
    document.getElementById('kpi-problemas').textContent = problemasData.length;
    document.getElementById('kpi-soluciones').textContent = solucionesData.length;
    
    // Software Factories Count
    const sfCount = organizacionesData.filter(o => o.sector === 'software-factories').length;
    document.getElementById('kpi-fabricas-badge').textContent = `${sfCount} en Ecosistema`;
}

function buildProspectosPrioritarios() {
    const container = document.getElementById('prospectos-prioritarios-list');
    if (!container) return;
    
    // Filtrar pymes e instituciones con alta prioridad (sectores con prioridad >= 9) y madurez digital <= 3
    const prioritarios = organizacionesData.filter(org => {
        if (org.sector === 'software-factories') return false;
        
        const sectorObj = sectoresData.find(s => s.id === org.sector);
        const prioridad = sectorObj ? sectorObj.prioridad : 8;
        
        return prioridad >= 9 && org.madurezDigital <= 3;
    });
    
    // Aplicar búsqueda si la hay
    const filtrados = prioritarios.filter(org => {
        return org.nombre.toLowerCase().includes(currentSearchQuery) ||
               org.ciudad.toLowerCase().includes(currentSearchQuery);
    });
    
    if (filtrados.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-muted">No hay objetivos prioritarios que coincidan con la búsqueda.</div>`;
        return;
    }
    
    let html = '';
    filtrados.forEach(org => {
        const sectorObj = sectoresData.find(s => s.id === org.sector);
        const prioridadLabel = sectorObj ? `Prioridad ${sectorObj.prioridad}` : 'Prioridad Alta';
        
        html += `
            <div class="prospects-list-item">
                <div>
                    <span class="org-name" onclick="openDetailModal('organizacion', '${org.id}')">${org.nombre}</span>
                    <span class="d-block text-secondary" style="font-size: 0.75rem;">${sectorObj ? sectorObj.nombre : ''}</span>
                </div>
                <div class="org-city">${org.ciudad} (${org.provincia})</div>
                <div class="org-priority">
                    <span class="priority-badge priority-${sectorObj ? sectorObj.prioridad : '8'}">${prioridadLabel}</span>
                </div>
                <div class="action-cell">
                    <button onclick="openDetailModal('organizacion', '${org.id}')">Ver Ficha</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// 6. Renderizado: SECTORES
function renderSectores() {
    const container = document.getElementById('sectores-grid');
    if (!container) return;
    
    const filtrados = sectoresData.filter(sec => {
        return sec.nombre.toLowerCase().includes(currentSearchQuery) ||
               sec.descripcion.toLowerCase().includes(currentSearchQuery);
    });
    
    if (filtrados.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-muted col-span-full">No se encontraron sectores coincidentes.</div>`;
        return;
    }
    
    let html = '';
    filtrados.forEach(sec => {
        // Encontrar dolores mapeados a este sector
        const dolores = problemasData.filter(p => p.sectores.includes(sec.id) || p.sectores.includes('todos'));
        // Encontrar soluciones mapeadas a este sector
        const soluciones = solucionesData.filter(s => s.sectores.includes(sec.id) || s.sectores.includes('todos'));
        
        html += `
            <div class="card" onclick="openDetailModal('sector', '${sec.id}')">
                <div class="card-header">
                    <div class="card-title">
                        <h4>${sec.nombre}</h4>
                        ${sec.especializacion ? '<span class="promo-tag">ESPECIALIDAD</span>' : ''}
                    </div>
                    <span class="priority-badge priority-${sec.prioridad}">Prioridad ${sec.prioridad}</span>
                </div>
                <div class="card-body">
                    <p class="card-description">${sec.descripcion}</p>
                    
                    <div class="bullet-section">
                        <span class="bullet-section-title">Dolores Frecuentes</span>
                        <ul class="bullet-list">
                            ${dolores.slice(0, 3).map(d => `<li>${d.nombre}</li>`).join('') || '<li>Sin dolores registrados</li>'}
                        </ul>
                    </div>
                    
                    <div class="bullet-section">
                        <span class="bullet-section-title">Soluciones Sugeridas</span>
                        <ul class="bullet-list solutions">
                            ${soluciones.slice(0, 3).map(s => `<li>${s.nombre}</li>`).join('') || '<li>Consultar modernización</li>'}
                        </ul>
                    </div>
                </div>
                <div class="card-footer">
                    <span class="text-secondary" style="font-size: 0.8rem;">Ver detalles y prospectos</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// 7. Renderizado: ORGANIZACIONES
function buildSectorFilterPills() {
    const container = document.getElementById('sector-filter-pills');
    if (!container) return;
    
    // Limpiar dinámicos excepto el "Todos"
    const staticPill = container.querySelector('[data-sector="todos"]');
    container.innerHTML = '';
    container.appendChild(staticPill);
    
    sectoresData.forEach(sec => {
        const btn = document.createElement('button');
        btn.className = `filter-pill ${activeSectorFilter === sec.id ? 'active' : ''}`;
        btn.dataset.sector = sec.id;
        btn.textContent = sec.nombre;
        
        btn.addEventListener('click', () => {
            container.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeSectorFilter = sec.id;
            renderOrganizaciones();
        });
        
        container.appendChild(btn);
    });
}

function renderOrganizaciones() {
    const container = document.getElementById('organizaciones-grid');
    if (!container) return;
    
    // Filtrar organizaciones por sector y provincia
    let filtrados = organizacionesData;
    
    if (activeSectorFilter !== 'todos') {
        filtrados = filtrados.filter(org => org.sector === activeSectorFilter);
    }
    
    if (activeProvinciaFilter !== 'todas') {
        filtrados = filtrados.filter(org => org.provincia === activeProvinciaFilter);
    }
    
    // Filtrar por buscador global
    if (currentSearchQuery) {
        filtrados = filtrados.filter(org => {
            const matchName = org.nombre.toLowerCase().includes(currentSearchQuery);
            const matchCity = org.ciudad.toLowerCase().includes(currentSearchQuery);
            const matchNotas = org.notas ? org.notas.toLowerCase().includes(currentSearchQuery) : false;
            const matchContacto = org.contacto.persona ? org.contacto.persona.toLowerCase().includes(currentSearchQuery) : false;
            return matchName || matchCity || matchNotas || matchContacto;
        });
    }
    
    if (filtrados.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-muted col-span-full">No se encontraron organizaciones para los filtros seleccionados.</div>`;
        return;
    }
    
    let html = '';
    filtrados.forEach(org => {
        const sectorObj = sectoresData.find(s => s.id === org.sector);
        const starsHtml = getMaturityStars(org.madurezDigital);
        
        // Botones de acción o notas
        const notesHtml = org.notas ? `<div class="org-notes">${org.notas}</div>` : '';
        
        // Diferenciación visual si es software factory (ecosistema)
        const isSF = org.sector === 'software-factories';
        const cardClass = isSF ? 'org-card eco-system-card' : 'org-card';
        
        html += `
            <div class="${cardClass}">
                <div>
                    <div class="org-meta">
                        <span class="org-city-badge">${org.ciudad} (${org.provincia})</span>
                        <div class="org-maturity" title="Madurez Digital: ${org.madurezDigital}/5">
                            ${starsHtml}
                        </div>
                    </div>
                    
                    <div class="org-header-main">
                        <h4>${org.nombre}</h4>
                        <span class="org-sector-name">${sectorObj ? sectorObj.nombre : ''}</span>
                    </div>
                    
                    ${notesHtml}
                    
                    <div class="contact-info-block">
                        <p><span class="label">Contacto:</span> <span class="value">${org.contacto.persona}</span></p>
                        <p><span class="label">Puesto:</span> <span class="value">${org.contacto.puesto}</span></p>
                        <p><span class="label">Teléfono:</span> <a href="tel:${org.contacto.telefono}" class="value">${org.contacto.telefono}</a></p>
                        <p><span class="label">Email:</span> <a href="mailto:${org.contacto.email}" class="value">${org.contacto.email}</a></p>
                    </div>
                </div>
                
                <div class="org-actions">
                    <button class="btn btn-secondary btn-block" onclick="openDetailModal('organizacion', '${org.id}')">Ver Análisis Completo</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Genera representación visual por estrellas
function getMaturityStars(stars) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= stars) {
            html += '★';
        } else {
            html += '☆';
        }
    }
    return html;
}

// 8. Renderizado: PROBLEMAS
function renderProblemas() {
    const container = document.getElementById('problemas-grid');
    if (!container) return;
    
    const filtrados = problemasData.filter(prob => {
        return prob.nombre.toLowerCase().includes(currentSearchQuery) ||
               prob.descripcion.toLowerCase().includes(currentSearchQuery);
    });
    
    if (filtrados.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-muted col-span-full">No se encontraron problemas coincidentes.</div>`;
        return;
    }
    
    let html = '';
    filtrados.forEach(prob => {
        // Mapeo de nombres de sectores
        const sectNombres = prob.sectores.map(id => {
            if (id === 'todos') return 'Todos los sectores';
            const sector = sectoresData.find(s => s.id === id);
            return sector ? sector.nombre : id;
        });
        
        html += `
            <div class="card" onclick="openDetailModal('problema', '${prob.id}')">
                <div class="card-header">
                    <div class="card-title">
                        <h4>${prob.nombre}</h4>
                    </div>
                    <span class="priority-badge priority-10">${prob.impacto} Impacto</span>
                </div>
                <div class="card-body">
                    <p class="card-description">${prob.descripcion}</p>
                    
                    <div class="bullet-section">
                        <span class="bullet-section-title">Afecta a:</span>
                        <div class="tag-list">
                            ${sectNombres.map(name => `<span class="tag">${name}</span>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <span class="text-secondary" style="font-size: 0.8rem;">Ver detalle de problema</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// 9. Renderizado: SOLUCIONES
function renderSoluciones() {
    const container = document.getElementById('soluciones-grid');
    if (!container) return;
    
    const filtrados = solucionesData.filter(sol => {
        return sol.nombre.toLowerCase().includes(currentSearchQuery) ||
               sol.descripcion.toLowerCase().includes(currentSearchQuery);
    });
    
    if (filtrados.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-muted col-span-full">No se encontraron soluciones coincidentes.</div>`;
        return;
    }
    
    let html = '';
    filtrados.forEach(sol => {
        const sectNombres = sol.sectores.map(id => {
            if (id === 'todos') return 'Todos los sectores';
            const sector = sectoresData.find(s => s.id === id);
            return sector ? sector.nombre : id;
        });
        
        html += `
            <div class="card" onclick="openDetailModal('solucion', '${sol.id}')">
                <div class="card-header">
                    <div class="card-title">
                        <h4>${sol.nombre}</h4>
                    </div>
                </div>
                <div class="card-body">
                    <p class="card-description">${sol.descripcion}</p>
                    
                    <div class="bullet-section">
                        <span class="bullet-section-title">Aplicable A:</span>
                        <div class="tag-list">
                            ${sectNombres.map(name => `<span class="tag">${name}</span>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <span class="text-secondary" style="font-size: 0.8rem;">Ver arquitectura técnica</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// 10. Renderizado: ESPECIAL GESTIÓN DOCUMENTAL + IA
function renderGestionDocumentalEspecial() {
    const container = document.getElementById('special-prospects-list');
    if (!container) return;
    
    // Filtrar organizaciones que sufren por 'documentacion-dispersa' o que tienen soluciones asociadas de gestión documental / RAG
    const targetOrgs = organizacionesData.filter(org => {
        if (org.sector === 'software-factories') return false;
        
        const tieneDolorDoc = org.dolores.includes('documentacion-dispersa');
        const tieneOpDoc = org.oportunidades.includes('workflow-documental') || org.oportunidades.includes('rag-documental');
        const esSectorGestionDoc = org.sector === 'gestion-documental-ia';
        
        return tieneDolorDoc || tieneOpDoc || esSectorGestionDoc;
    });
    
    // Filtrar por buscador
    const filtrados = targetOrgs.filter(org => {
        return org.nombre.toLowerCase().includes(currentSearchQuery) ||
               org.ciudad.toLowerCase().includes(currentSearchQuery);
    });
    
    if (filtrados.length === 0) {
        container.innerHTML = `<div class="p-2 text-center text-muted">Ningún prospecto coincidente con dolores documentales o de IA.</div>`;
        return;
    }
    
    let html = '';
    filtrados.forEach(org => {
        html += `
            <div class="mini-org-item" onclick="openDetailModal('organizacion', '${org.id}')">
                <div>
                    <span class="name">${org.nombre}</span>
                    <span class="d-block text-secondary" style="font-size: 0.72rem;">Dolores: ${org.dolores.join(', ') || 'Varios'}</span>
                </div>
                <span class="city">${org.ciudad}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// 11. Renderizado: IDEAS IA
function renderIdeasIA() {
    const container = document.getElementById('ideas-grid');
    if (!container) return;
    
    const filtrados = ideasData.filter(idea => {
        return idea.titulo.toLowerCase().includes(currentSearchQuery) ||
               idea.descripcion.toLowerCase().includes(currentSearchQuery) ||
               idea.tecnologias.some(tech => tech.toLowerCase().includes(currentSearchQuery));
    });
    
    if (filtrados.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-muted col-span-full">No se encontraron ideas de IA coincidentes.</div>`;
        return;
    }
    
    let html = '';
    filtrados.forEach(idea => {
        let stateClass = 'roi-medium';
        if (idea.estado === 'Prototipo') stateClass = 'roi-high';
        if (idea.estado === 'Idea') stateClass = 'complexity-low';
        
        html += `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <h4>${idea.titulo}</h4>
                    </div>
                    <span class="roi-badge ${stateClass}">${idea.estado}</span>
                </div>
                <div class="card-body">
                    <p class="card-description">${idea.descripcion}</p>
                    
                    <div class="bullet-section">
                        <span class="bullet-section-title">Componentes Stack</span>
                        <div class="tag-list">
                            ${idea.tecnologias.map(tech => `<span class="tag" style="border-color: rgba(129, 140, 248, 0.4); color: var(--accent-indigo);">${tech}</span>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <span class="text-secondary" style="font-size: 0.8rem;">Oportunidad de desarrollo local</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// 12. Renderizado: MATRIZ DE OPORTUNIDADES
function renderOportunidadesMatrix() {
    const container = document.getElementById('oportunidades-table-body');
    if (!container) return;
    
    const filtrados = solucionesData.filter(sol => {
        return sol.nombre.toLowerCase().includes(currentSearchQuery) ||
               sol.descripcion.toLowerCase().includes(currentSearchQuery);
    });
    
    if (filtrados.length === 0) {
        container.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No se encontraron soluciones para poblar la matriz.</td></tr>`;
        return;
    }
    
    // Mapear ROI y Complejidad ficticia pero justificada para priorizar
    const metricaSoluciones = {
        'crm-light': { roi: 'Alto', complexity: 'Baja', viability: '10/10', action: 'Propuesta rápida (WhatsApp)' },
        'rag-documental': { roi: 'Alto', complexity: 'Media', viability: '9/10', action: 'Demostración de prototipo RAG' },
        'workflow-documental': { roi: 'Alto', complexity: 'Media', viability: '8/10', action: 'Modernización de expedientes' },
        'dashboard-ejecutivo': { roi: 'Medio', complexity: 'Media', viability: '7/10', action: 'Conectores SQL a dashboards' },
        'automatizacion-afip': { roi: 'Alto', complexity: 'Baja', viability: '10/10', action: 'Presentar bot recolector de facturas' },
        'sistema-turnos-notificacion': { roi: 'Medio', complexity: 'Baja', viability: '9/10', action: 'Demo agenda de citas' }
    };
    
    let html = '';
    filtrados.forEach(sol => {
        const metrics = metricaSoluciones[sol.id] || { roi: 'Medio', complexity: 'Media', viability: '7/10', action: 'Reunión de diagnóstico' };
        
        const roiClass = metrics.roi === 'Alto' ? 'roi-high' : 'roi-medium';
        const compClass = metrics.complexity === 'Alta' ? 'complexity-high' : (metrics.complexity === 'Media' ? 'complexity-medium' : 'complexity-low');
        
        const sectTags = sol.sectores.map(id => {
            if (id === 'todos') return 'Todos';
            const sector = sectoresData.find(s => s.id === id);
            return sector ? sector.nombre : id;
        });
        
        html += `
            <tr>
                <td>
                    <span class="sol-name" style="cursor:pointer;" onclick="openDetailModal('solucion', '${sol.id}')">${sol.nombre}</span>
                    <span class="d-block text-secondary" style="font-size: 0.72rem; max-width: 250px;">${sol.descripcion}</span>
                </td>
                <td>
                    <div class="sect-tags">
                        ${sectTags.map(t => `<span class="tag">${t}</span>`).join('')}
                    </div>
                </td>
                <td><span class="roi-badge ${roiClass}">${metrics.roi}</span></td>
                <td><span class="complexity-badge ${compClass}">${metrics.complexity}</span></td>
                <td><span class="viability-score">${metrics.viability}</span></td>
                <td>
                    <button class="btn btn-secondary btn-block" style="padding: 6px 12px; font-size: 0.75rem;" onclick="openDetailModal('solucion', '${sol.id}')">
                        ${metrics.action}
                    </button>
                </td>
            </tr>
        `;
    });
    
    container.innerHTML = html;
}

// 13. Lógica del Detalle Modal (Fichas Técnicas / CRM)
function openDetailModal(type, id) {
    const modal = document.getElementById('detailModal');
    const body = document.getElementById('modalDetailsBody');
    if (!modal || !body) return;
    
    let html = '';
    
    if (type === 'organizacion') {
        const org = organizacionesData.find(o => o.id === id);
        if (!org) return;
        
        const sectorObj = sectoresData.find(s => s.id === org.sector);
        const starsHtml = getMaturityStars(org.madurezDigital);
        
        // Mapeo detallado de dolores y soluciones de esta organización
        const doloresMapeados = org.dolores.map(dId => problemasData.find(p => p.id === dId)).filter(Boolean);
        const solucionesMapeadas = org.oportunidades.map(sId => solucionesData.find(s => s.id === sId)).filter(Boolean);
        
        html += `
            <div class="modal-header-section">
                <h3>${org.nombre}</h3>
                <span class="subtitle">${sectorObj ? sectorObj.nombre : ''} — ${org.ciudad}, ${org.provincia}</span>
            </div>
            
            <div class="modal-body-section">
                <div class="org-meta" style="margin-bottom: 0;">
                    <div class="org-maturity" style="font-size: 1.2rem;">
                        ${starsHtml} <span class="text-secondary" style="font-size: 0.85rem; margin-left: 8px;">Madurez Digital (${org.madurezDigital}/5)</span>
                    </div>
                </div>
                
                <div class="modal-section-block">
                    <h5>Información de Contacto Comercial</h5>
                    <p style="margin-top: 8px;"><strong>Representante:</strong> ${org.contacto.persona} (${org.contacto.puesto})</p>
                    <p><strong>Teléfono:</strong> <a href="tel:${org.contacto.telefono}">${org.contacto.telefono}</a></p>
                    <p><strong>Email:</strong> <a href="mailto:${org.contacto.email}">${org.contacto.email}</a></p>
                </div>
                
                ${org.notas ? `
                    <div class="modal-section-block" style="border-left: 4px solid var(--accent-amber); background: rgba(251, 191, 36, 0.02);">
                        <h5>Notas de Diagnóstico del Consultor</h5>
                        <p style="margin-top: 8px; font-style: italic; font-size: 0.88rem; line-height: 1.5;">"${org.notas}"</p>
                    </div>
                ` : ''}
                
                <div class="grid-layout" style="grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="modal-section-block">
                        <h5>Dolores Identificados</h5>
                        <ul class="bullet-list" style="margin-top: 8px;">
                            ${doloresMapeados.map(d => `<li><strong>${d.nombre}:</strong> ${d.descripcion}</li>`).join('') || '<li>Ninguno reportado</li>'}
                        </ul>
                    </div>
                    
                    <div class="modal-section-block">
                        <h5>Propuesta de Modernización</h5>
                        <ul class="bullet-list solutions" style="margin-top: 8px;">
                            ${solucionesMapeadas.map(s => `<li><strong>${s.nombre}:</strong> ${s.descripcion}</li>`).join('') || '<li>Diagnóstico en curso</li>'}
                        </ul>
                    </div>
                </div>
                
                <div style="margin-top: 12px; display:flex; gap: 10px;">
                    <a href="https://wa.me/${org.contacto.telefono.replace(/[^0-9]/g, '')}" target="_blank" class="btn btn-primary text-center" style="flex:1;">
                        Iniciar Conversación WhatsApp
                    </a>
                    <button class="btn btn-secondary" onclick="closeDetailModal()">Cerrar Ficha</button>
                </div>
            </div>
        `;
        
    } else if (type === 'sector') {
        const sec = sectoresData.find(s => s.id === id);
        if (!sec) return;
        
        const dolores = problemasData.filter(p => p.sectores.includes(sec.id) || p.sectores.includes('todos'));
        const soluciones = solucionesData.filter(s => s.sectores.includes(sec.id) || s.sectores.includes('todos'));
        const organizaciones = organizacionesData.filter(o => o.sector === sec.id);
        
        html += `
            <div class="modal-header-section">
                <h3>Sector: ${sec.nombre}</h3>
                <span class="subtitle">Prioridad Comercial: ${sec.prioridad}/10</span>
            </div>
            <div class="modal-body-section">
                <div class="modal-section-block">
                    <h5>Descripción</h5>
                    <p style="margin-top: 8px; line-height: 1.5;">${sec.descripcion}</p>
                </div>
                
                <div class="modal-section-block">
                    <h5>Problemas Asociados</h5>
                    <ul class="bullet-list" style="margin-top: 8px;">
                        ${dolores.map(d => `<li><strong>${d.nombre}</strong> — ${d.descripcion}</li>`).join('') || '<li>Sin problemas mapeados</li>'}
                    </ul>
                </div>
                
                <div class="modal-section-block">
                    <h5>Soluciones Aplicables</h5>
                    <ul class="bullet-list solutions" style="margin-top: 8px;">
                        ${soluciones.map(s => `<li><strong>${s.nombre}</strong> — ${s.descripcion}</li>`).join('') || '<li>Sin soluciones mapeadas</li>'}
                    </ul>
                </div>
                
                <div class="modal-section-block">
                    <h5>Organizaciones en el Atlas (${organizaciones.length})</h5>
                    <div class="mini-orgs-list" style="margin-top: 8px; max-height: 150px; overflow-y:auto;">
                        ${organizaciones.map(o => `
                            <div class="mini-org-item" onclick="openDetailModal('organizacion', '${o.id}')">
                                <span class="name">${o.nombre}</span>
                                <span class="city">${o.ciudad} (${o.provincia})</span>
                            </div>
                        `).join('') || '<div class="text-muted text-center" style="font-size:0.8rem;">No hay empresas registradas para este sector.</div>'}
                    </div>
                </div>
                
                <div style="margin-top: 8px; text-align:right;">
                    <button class="btn btn-secondary" onclick="closeDetailModal()">Cerrar</button>
                </div>
            </div>
        `;
        
    } else if (type === 'problema') {
        const prob = problemasData.find(p => p.id === id);
        if (!prob) return;
        
        const sectNombres = prob.sectores.map(secId => {
            if (secId === 'todos') return 'Todos';
            const s = sectoresData.find(sec => sec.id === secId);
            return s ? s.nombre : secId;
        });
        
        html += `
            <div class="modal-header-section">
                <h3>Dolor: ${prob.nombre}</h3>
                <span class="subtitle">Impacto Operativo: ${prob.impacto}</span>
            </div>
            <div class="modal-body-section">
                <div class="modal-section-block">
                    <h5>Detalle del Problema</h5>
                    <p style="margin-top: 8px; line-height:1.5;">${prob.descripcion}</p>
                </div>
                
                <div class="modal-section-block">
                    <h5>Sectores Afectados</h5>
                    <div class="tag-list" style="margin-top: 8px;">
                        ${sectNombres.map(name => `<span class="tag">${name}</span>`).join('')}
                    </div>
                </div>
                
                <div style="margin-top: 8px; text-align:right;">
                    <button class="btn btn-secondary" onclick="closeDetailModal()">Cerrar</button>
                </div>
            </div>
        `;
        
    } else if (type === 'solucion') {
        const sol = solucionesData.find(s => s.id === id);
        if (!sol) return;
        
        html += `
            <div class="modal-header-section">
                <h3>Solución: ${sol.nombre}</h3>
                <span class="subtitle">Propuesta Arquitectónica de Modernización</span>
            </div>
            <div class="modal-body-section">
                <div class="modal-section-block">
                    <h5>Detalle de la Propuesta</h5>
                    <p style="margin-top: 8px; line-height: 1.5;">${sol.descripcion}</p>
                </div>
                
                <div class="modal-section-block">
                    <h5>Valor del Proyecto</h5>
                    <p style="margin-top: 8px; font-size:0.88rem; line-height:1.5;">Se implementa mediante un análisis consultivo de procesos, garantizando la integración con el ecosistema de Software Factories local si se requiere desarrollo a medida de alta escala, o utilizando arquitecturas empaquetadas basadas en microservicios APIs para una respuesta rápida.</p>
                </div>
                
                <div style="margin-top: 8px; text-align:right;">
                    <button class="btn btn-secondary" onclick="closeDetailModal()">Cerrar</button>
                </div>
            </div>
        `;
    }
    
    body.innerHTML = html;
    modal.classList.add('open');
}

function closeDetailModal() {
    const modal = document.getElementById('detailModal');
    if (modal) {
        modal.classList.remove('open');
    }
}
