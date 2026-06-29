/* ==========================================================================
   ATLAS DE MODERNIZACIÓN DIGITAL — LÓGICA DE APLICACIÓN JS (PÁGINA ÚNICA)
   ========================================================================== */

// 1. Estado de Datos
let sectoresData = [];
let problemasData = [];
let solucionesData = [];
let organizacionesData = [];

let activeSectorFilter = 'todos';
let activeProvinciaFilter = 'todas';
let currentSearchQuery = '';
let activeProblemsSolutionsTab = 'problems'; // 'problems' | 'solutions'

// 2. Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Configurar año en footer
    const yearEl = document.getElementById('footer-year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
    
    // Cargar datos estáticos
    loadData();
    
    // Configurar listeners globales de la interfaz
    setupEventListeners();
});

// Carga de datos de los JSON
async function loadData() {
    try {
        const [sectoresRes, problemasRes, solucionesRes, organizacionesRes] = await Promise.all([
            fetch('data/sectores.json'),
            fetch('data/problemas.json'),
            fetch('data/soluciones.json'),
            fetch('data/organizaciones.json')
        ]);
        
        sectoresData = await sectoresRes.json();
        problemasData = await problemasRes.json();
        solucionesData = await solucionesRes.json();
        organizacionesData = await organizacionesRes.json();
        
        // Renderizar todos los bloques de la página
        renderHeroKPIs();
        renderSectores();
        renderProblemasSoluciones();
        buildSectorFilterPills();
        renderOrganizaciones();
        
    } catch (error) {
        console.error('Error al cargar datos del Atlas Digital:', error);
        alert('Hubo un error al inicializar los datos del Atlas. Asegúrese de estar sirviendo el proyecto bajo un servidor HTTP.');
    }
}

// Configurar los listeners
function setupEventListeners() {
    // Hamburger menu para móviles
    const hamburger = document.getElementById('menuHamburger');
    const navMenu = document.getElementById('navbarMenu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('open');
        });
        
        // Cerrar menú al hacer clic en un ítem
        navMenu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                navMenu.classList.remove('open');
            });
        });
    }
    
    // Scroll aware navbar (sólido al scrollear)
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Scroll Spy para resaltar la sección activa
        spyScrollHighlight();
    });
    
    // Buscador Global en el Directorio
    const searchInput = document.getElementById('globalSearch');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value.toLowerCase().trim();
            
            if (clearSearchBtn) {
                clearSearchBtn.style.display = currentSearchQuery ? 'block' : 'none';
            }
            
            renderOrganizaciones();
        });
    }
    
    if (clearSearchBtn && searchInput) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            currentSearchQuery = '';
            clearSearchBtn.style.display = 'none';
            renderOrganizaciones();
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
    
    // Tabs de Problemas y Soluciones
    const tabProblemsBtn = document.getElementById('tabProblemsBtn');
    const tabSolutionsBtn = document.getElementById('tabSolutionsBtn');
    
    if (tabProblemsBtn && tabSolutionsBtn) {
        tabProblemsBtn.addEventListener('click', () => {
            tabProblemsBtn.classList.add('active');
            tabSolutionsBtn.classList.remove('active');
            activeProblemsSolutionsTab = 'problems';
            renderProblemasSoluciones();
        });
        
        tabSolutionsBtn.addEventListener('click', () => {
            tabSolutionsBtn.classList.add('active');
            tabProblemsBtn.classList.remove('active');
            activeProblemsSolutionsTab = 'solutions';
            renderProblemasSoluciones();
        });
    }
    
    // Cerrar Modal
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
}

// 3. Scroll Spy (Resalta el menú superior de acuerdo a la sección en pantalla)
function spyScrollHighlight() {
    const sections = document.querySelectorAll('.scroll-section, header.hero');
    const navItems = document.querySelectorAll('.navbar-menu .menu-item');
    
    let currentId = 'inicio';
    const scrollPosition = window.scrollY + 100; // offset
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            currentId = sectionId;
        }
    });
    
    // Normalizar ID por si cae en problemas o soluciones individuales
    if (currentId === 'problemas-soluciones') {
        currentId = 'problemas-soluciones';
    }
    
    navItems.forEach(item => {
        item.classList.remove('active');
        const href = item.getAttribute('href').replace('#', '');
        
        if (href === currentId) {
            item.classList.add('active');
        }
    });
}

// 4. Renderizadores de Contenido

// KPIs del Hero
function renderHeroKPIs() {
    document.getElementById('kpi-sectores').textContent = sectoresData.length;
    document.getElementById('kpi-organizaciones').textContent = organizacionesData.length;
    document.getElementById('kpi-problemas').textContent = problemasData.length;
    document.getElementById('kpi-soluciones').textContent = solucionesData.length;
}

// Sectores
function renderSectores() {
    const container = document.getElementById('sectores-grid');
    if (!container) return;
    
    let html = '';
    sectoresData.forEach(sec => {
        // Encontrar dolores de este sector
        const dolores = problemasData.filter(p => p.sectores.includes(sec.id) || p.sectores.includes('todos'));
        // Encontrar soluciones de este sector
        const soluciones = solucionesData.filter(s => s.sectores.includes(sec.id) || s.sectores.includes('todos'));
        
        html += `
            <div class="card" onclick="openDetailModal('sector', '${sec.id}')">
                <div class="card-header">
                    <div class="card-title">
                        <h4>${sec.nombre}</h4>
                    </div>
                    <span class="priority-badge priority-${sec.prioridad}">Prioridad ${sec.prioridad}</span>
                </div>
                <div class="card-body">
                    <p class="card-description">${sec.descripcion}</p>
                    
                    <div class="bullet-section">
                        <span class="bullet-section-title">Dolores Críticos</span>
                        <ul class="bullet-list">
                            ${dolores.slice(0, 2).map(d => `<li>${d.nombre}</li>`).join('') || '<li>Sin dolores reportados</li>'}
                        </ul>
                    </div>
                    
                    <div class="bullet-section">
                        <span class="bullet-section-title">Soluciones Clave</span>
                        <ul class="bullet-list solutions">
                            ${soluciones.slice(0, 2).map(s => `<li>${s.nombre}</li>`).join('') || '<li>Reunión de diagnóstico</li>'}
                        </ul>
                    </div>
                </div>
                <div class="card-footer">
                    <span>Ver ficha del sector</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Pestaña de Problemas y Soluciones
function renderProblemasSoluciones() {
    const container = document.getElementById('problemas-soluciones-grid');
    if (!container) return;
    
    let html = '';
    
    if (activeProblemsSolutionsTab === 'problems') {
        // Renderizar Problemas
        problemasData.forEach(prob => {
            const sectNombres = prob.sectores.map(id => {
                if (id === 'todos') return 'Todos';
                const s = sectoresData.find(sec => sec.id === id);
                return s ? s.nombre : id;
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
                            <span class="bullet-section-title">Afecta a los sectores:</span>
                            <div class="tag-list">
                                ${sectNombres.map(name => `<span class="tag">${name}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <span>Ver diagnóstico</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                </div>
            `;
        });
    } else {
        // Renderizar Soluciones
        solucionesData.forEach(sol => {
            const sectNombres = sol.sectores.map(id => {
                if (id === 'todos') return 'Todos';
                const s = sectoresData.find(sec => sec.id === id);
                return s ? s.nombre : id;
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
                            <span class="bullet-section-title">Aplicable en:</span>
                            <div class="tag-list">
                                ${sectNombres.map(name => `<span class="tag">${name}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <span>Ver arquitectura técnica</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                </div>
            `;
        });
    }
    
    container.innerHTML = html;
}

// Cargar pills dinámicas del Sector en el Directorio
function buildSectorFilterPills() {
    const container = document.getElementById('sector-filter-pills');
    if (!container) return;
    
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

// Renderizar el Directorio de Contactos
function renderOrganizaciones() {
    const container = document.getElementById('organizaciones-grid');
    if (!container) return;
    
    let filtrados = organizacionesData;
    
    // Filtro de Sector
    if (activeSectorFilter !== 'todos') {
        filtrados = filtrados.filter(org => org.sector === activeSectorFilter);
    }
    
    // Filtro de Provincia
    if (activeProvinciaFilter !== 'todas') {
        filtrados = filtrados.filter(org => org.provincia === activeProvinciaFilter);
    }
    
    // Buscador
    if (currentSearchQuery) {
        filtrados = filtrados.filter(org => {
            const matchName = org.nombre.toLowerCase().includes(currentSearchQuery);
            const matchCity = org.ciudad.toLowerCase().includes(currentSearchQuery);
            const matchContacto = org.contacto.persona.toLowerCase().includes(currentSearchQuery);
            const matchNotas = org.notas ? org.notas.toLowerCase().includes(currentSearchQuery) : false;
            return matchName || matchCity || matchContacto || matchNotas;
        });
    }
    
    if (filtrados.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-muted col-span-full">No se encontraron organizaciones con los filtros aplicados.</div>`;
        return;
    }
    
    let html = '';
    filtrados.forEach(org => {
        const sectorObj = sectoresData.find(s => s.id === org.sector);
        const starsHtml = getMaturityStars(org.madurezDigital);
        
        // Estilo diferenciador para Software Factories
        const isSF = org.sector === 'software-factories';
        const cardClass = isSF ? 'org-card ecosystem-card' : 'org-card';
        
        html += `
            <div class="${cardClass}">
                <div>
                    <div class="org-meta">
                        <span class="org-city-badge">${org.ciudad} (${org.provincia})</span>
                        <div class="org-maturity" title="Madurez digital: ${org.madurezDigital}/5">
                            ${starsHtml}
                        </div>
                    </div>
                    
                    <div class="org-header-main">
                        <h4>${org.nombre}</h4>
                        <span class="org-sector-name">${sectorObj ? sectorObj.nombre : ''}</span>
                    </div>
                    
                    ${org.notas ? `<div class="org-notes">${org.notas}</div>` : ''}
                    
                    <div class="contact-info-block">
                        <p><span class="label">Contacto:</span> <span class="value">${org.contacto.persona} (${org.contacto.puesto})</span></p>
                        <p><span class="label">Teléfono:</span> <a href="tel:${org.contacto.telefono}" class="value">${org.contacto.telefono}</a></p>
                        <p><span class="label">Email:</span> <a href="mailto:${org.contacto.email}" class="value">${org.contacto.email}</a></p>
                    </div>
                </div>
                
                <div class="org-actions">
                    <button class="btn btn-secondary btn-block" onclick="openDetailModal('organizacion', '${org.id}')">Ficha de Prospección</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Estrellas de madurez digital
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

// 5. Apertura/Cierre de Modales (Ficha CRM)
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
        
        const doloresMapeados = org.dolores.map(dId => problemasData.find(p => p.id === dId)).filter(Boolean);
        const solucionesMapeadas = org.oportunidades.map(sId => solucionesData.find(s => s.id === sId)).filter(Boolean);
        
        html += `
            <div class="modal-header-section">
                <h3>${org.nombre}</h3>
                <span class="subtitle">${sectorObj ? sectorObj.nombre : ''} — ${org.ciudad}, ${org.provincia}</span>
            </div>
            
            <div class="modal-body-section">
                <div class="org-meta" style="margin-bottom: 0;">
                    <div class="org-maturity" style="font-size: 1.1rem; color: var(--accent-amber);">
                        ${starsHtml} <span class="text-secondary" style="font-size: 0.85rem; margin-left: 8px;">Madurez digital (${org.madurezDigital}/5)</span>
                    </div>
                </div>
                
                <div class="modal-section-block">
                    <h5>Contacto Directo</h5>
                    <p style="margin-top: 8px;"><strong>Representante:</strong> ${org.contacto.persona} (${org.contacto.puesto})</p>
                    <p><strong>Teléfono:</strong> <a href="tel:${org.contacto.telefono}">${org.contacto.telefono}</a></p>
                    <p><strong>Email:</strong> <a href="mailto:${org.contacto.email}">${org.contacto.email}</a></p>
                </div>
                
                ${org.notes || org.notas ? `
                    <div class="modal-section-block" style="border-left: 4px solid var(--accent-amber); background: rgba(251, 191, 36, 0.02);">
                        <h5>Notas comerciales de prospección</h5>
                        <p style="margin-top: 8px; font-style: italic; font-size: 0.88rem; line-height: 1.5;">"${org.notes || org.notas}"</p>
                    </div>
                ` : ''}
                
                ${!org.sector.includes('software-factories') ? `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="modal-section-block">
                            <h5>Dolores Frecuentes</h5>
                            <ul class="bullet-list" style="margin-top: 8px; font-size:0.85rem;">
                                ${doloresMapeados.map(d => `<li><strong>${d.nombre}</strong></li>`).join('') || '<li>Sin dolores identificados</li>'}
                            </ul>
                        </div>
                        
                        <div class="modal-section-block">
                            <h5>Oportunidades de Solución</h5>
                            <ul class="bullet-list solutions" style="margin-top: 8px; font-size:0.85rem;">
                                ${solucionesMapeadas.map(s => `<li><strong>${s.nombre}</strong></li>`).join('') || '<li>Diagnóstico pendiente</li>'}
                            </ul>
                        </div>
                    </div>
                ` : ''}
                
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
                <span class="subtitle">Prioridad de modernización: ${sec.prioridad}/10</span>
            </div>
            <div class="modal-body-section">
                <div class="modal-section-block">
                    <h5>Descripción de mercado</h5>
                    <p style="margin-top: 8px; line-height: 1.5;">${sec.descripcion}</p>
                </div>
                
                <div class="modal-section-block">
                    <h5>Dolores recurrentes del sector</h5>
                    <ul class="bullet-list" style="margin-top: 8px; font-size:0.88rem;">
                        ${dolores.map(d => `<li><strong>${d.nombre}:</strong> ${d.descripcion}</li>`).join('') || '<li>Sin dolores mapeados</li>'}
                    </ul>
                </div>
                
                <div class="modal-section-block">
                    <h5>Catálogo de soluciones sugeridas</h5>
                    <ul class="bullet-list solutions" style="margin-top: 8px; font-size:0.88rem;">
                        ${soluciones.map(s => `<li><strong>${s.nombre}:</strong> ${s.descripcion}</li>`).join('') || '<li>Sin soluciones mapeadas</li>'}
                    </ul>
                </div>
                
                <div class="modal-section-block">
                    <h5>Organizaciones mapeadas (${organizaciones.length})</h5>
                    <div class="mini-orgs-list" style="margin-top: 8px; max-height: 140px; overflow-y:auto; display:flex; flex-direction:column; gap: 8px;">
                        ${organizaciones.map(o => `
                            <div class="mini-org-item" onclick="openDetailModal('organizacion', '${o.id}')" style="background-color: var(--bg-main); border:1px solid var(--border-color); padding: 8px 12px; border-radius:var(--radius-md); display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
                                <span style="font-weight:600; font-size:0.85rem;">${o.nombre}</span>
                                <span style="font-size:0.75rem; color:var(--text-secondary);">${o.ciudad} (${o.provincia})</span>
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
                    <h5>Detalle de la problemática</h5>
                    <p style="margin-top: 8px; line-height: 1.5;">${prob.descripcion}</p>
                </div>
                
                <div class="modal-section-block">
                    <h5>Sectores afectados</h5>
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
                <span class="subtitle">Propuesta técnica de valor</span>
            </div>
            <div class="modal-body-section">
                <div class="modal-section-block">
                    <h5>Descripción técnica</h5>
                    <p style="margin-top: 8px; line-height: 1.5;">${sol.descripcion}</p>
                </div>
                
                <div class="modal-section-block">
                    <h5>Implementación comercial</h5>
                    <p style="margin-top: 8px; font-size: 0.88rem; line-height:1.5;">Esta solución se plantea como una modernización directa de procesos de negocio. Permite reducir tiempos de trabajo, evitar errores humanos, y centralizar datos para auditoría rápida y reporting de gestión.</p>
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
