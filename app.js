/* ==========================================================================
   Radar Dev — LÓGICA DE APLICACIÓN JS (PÁGINA ÚNICA - AGENDA)
   ========================================================================== */

// 1. Estado de Datos
let sectoresData = [];
let organizacionesData = [];

let activeSectorFilter = 'todos';
let activeProvinciaFilter = 'todas';
let currentSearchQuery = '';

// 2. Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Configurar año en footer
    const yearEl = document.getElementById('footer-year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
    
    // Cargar datos
    loadData();
    
    // Configurar listeners globales de la interfaz
    setupEventListeners();
});

// Carga de datos del JSON Maestro
async function loadData() {
    try {
        const response = await fetch('data/maestro.json');
        const data = await response.json();
        
        sectoresData = data.sectores || [];
        organizacionesData = data.organizaciones || [];
        
        // Renderizar elementos
        renderHeroKPIs();
        renderSectores();
        buildSectorFilterPills();
        renderOrganizaciones();
        
    } catch (error) {
        console.error('Error al cargar datos del Radar Dev:', error);
        alert('Hubo un error al inicializar los datos de Radar Dev. Asegúrese de estar sirviendo el proyecto bajo un servidor HTTP.');
    }
}

// Configurar los listeners
function setupEventListeners() {
    // Menú hamburguesa para móviles
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
    
    // Cambiar transparencia del navbar en scroll y resaltar sección activa
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
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

// Scroll Spy
function spyScrollHighlight() {
    const sections = document.querySelectorAll('.scroll-section, header.hero');
    const navItems = document.querySelectorAll('.navbar-menu .menu-item');
    
    let currentId = 'inicio';
    const scrollPosition = window.scrollY + 120;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            currentId = sectionId;
        }
    });
    
    navItems.forEach(item => {
        item.classList.remove('active');
        const href = item.getAttribute('href').replace('#', '');
        
        if (href === currentId) {
            item.classList.add('active');
        }
    });
}

// 3. Renderizadores de Contenido

// KPIs del Hero
function renderHeroKPIs() {
    const uniqueProvinces = new Set(organizacionesData.map(org => org.provincia).filter(Boolean));
    
    document.getElementById('kpi-sectores').textContent = sectoresData.length;
    document.getElementById('kpi-organizaciones').textContent = organizacionesData.length;
    document.getElementById('kpi-provincias').textContent = uniqueProvinces.size || 3;
}

// Sectores
function renderSectores() {
    const container = document.getElementById('sectores-grid');
    if (!container) return;
    
    let html = '';
    sectoresData.forEach(sec => {
        // Contar organizaciones en este sector
        const orgsEnSector = organizacionesData.filter(o => o.sector === sec.id);
        
        // Obtener dolores frecuentes dinámicamente de este sector (tomando problemas potenciales únicos de las pymes registradas)
        const problemasMapeados = [];
        orgsEnSector.forEach(org => {
            if (org.problemasPotenciales) {
                org.problemasPotenciales.forEach(prob => {
                    if (!problemasMapeados.includes(prob)) {
                        problemasMapeados.push(prob);
                    }
                });
            }
        });
        
        // Fallback si no hay organizaciones cargadas o con problemas
        const problemasMostrar = problemasMapeados.length > 0 
            ? problemasMapeados.slice(0, 3) 
            : ["Procesos manuales", "Trazabilidad de clientes", "Falta de automatización"];
            
        html += `
            <div class="card" onclick="filterBySectorFromCard('${sec.id}')">
                <div class="card-header">
                    <div class="card-title-wrap">
                        <span class="card-emoji">${sec.emoji || '📂'}</span>
                        <h4>${sec.nombre}</h4>
                    </div>
                    <span class="org-count-badge">${orgsEnSector.length} org.</span>
                </div>
                
                <div class="card-body">
                    <div class="bullet-section">
                        <span class="bullet-section-title">Problemas Frecuentes</span>
                        <ul class="bullet-list problems">
                            ${problemasMostrar.map(p => `<li>${p}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                
                <div class="card-footer">
                    <span>Ver organizaciones</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
            </div>
        `;
    });
    
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
            selectSectorFilter(sec.id);
        });
        
        container.appendChild(btn);
    });
}

// Auxiliar para seleccionar filtro de sector
function selectSectorFilter(sectorId) {
    const container = document.getElementById('sector-filter-pills');
    if (!container) return;
    
    container.querySelectorAll('.filter-pill').forEach(btn => {
        if (btn.dataset.sector === sectorId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    activeSectorFilter = sectorId;
    renderOrganizaciones();
}

// Filtrar por sector al hacer clic en tarjeta de sector (y desplazar pantalla)
function filterBySectorFromCard(sectorId) {
    selectSectorFilter(sectorId);
    
    // Desplazar al directorio
    const dirSection = document.getElementById('directorio');
    if (dirSection) {
        dirSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Renderizar las tarjetas del Directorio
function renderOrganizaciones() {
    const container = document.getElementById('organizaciones-grid');
    if (!container) return;
    
    let filtrados = organizacionesData;
    
    // Filtro por Sector
    if (activeSectorFilter !== 'todos') {
        filtrados = filtrados.filter(org => org.sector === activeSectorFilter);
    }
    
    // Filtro por Provincia
    if (activeProvinciaFilter !== 'todas') {
        filtrados = filtrados.filter(org => org.provincia === activeProvinciaFilter);
    }
    
    // Buscador global
    if (currentSearchQuery) {
        filtrados = filtrados.filter(org => {
            const matchName = org.nombre.toLowerCase().includes(currentSearchQuery);
            const matchCity = org.ciudad.toLowerCase().includes(currentSearchQuery);
            const matchContacto = org.contacto ? org.contacto.toLowerCase().includes(currentSearchQuery) : false;
            const matchNotas = org.notas ? org.notas.toLowerCase().includes(currentSearchQuery) : false;
            const matchProblemas = org.problemasPotenciales ? org.problemasPotenciales.some(p => p.toLowerCase().includes(currentSearchQuery)) : false;
            return matchName || matchCity || matchContacto || matchNotas || matchProblemas;
        });
    }
    
    if (filtrados.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-muted col-span-full">No se encontraron organizaciones con los filtros aplicados.</div>`;
        return;
    }
    
    let html = '';
    filtrados.forEach(org => {
        const sectorObj = sectoresData.find(s => s.id === org.sector);
        
        // Formato para web
        const webVal = org.web 
            ? `<a href="http://${org.web}" target="_blank" class="field-val">${org.web}</a>`
            : '<span class="field-val text-muted">No registra</span>';
            
        // Formato para contacto
        const contactoVal = org.contacto 
            ? `<span class="field-val">${org.contacto}</span>`
            : '<span class="field-val text-muted">No registra</span>';
            
        // Observaciones
        const observacionesBlock = org.notas 
            ? `<div class="org-observaciones">
                   <span class="org-observaciones-title">Observaciones</span>
                   <p>"${org.notas}"</p>
               </div>`
            : '';
            
        // Problemas observados
        const problemasHtml = org.problemasPotenciales && org.problemasPotenciales.length > 0
            ? `<div class="bullet-section">
                   <span class="bullet-section-title">Problemas Observados</span>
                   <ul class="bullet-list problems">
                       ${org.problemasPotenciales.map(p => `<li>${p}</li>`).join('')}
                   </ul>
               </div>`
            : '';
            
        html += `
            <div class="org-card">
                <div>
                    <div class="org-meta">
                        <span class="org-city-badge">${org.ciudad} (${org.provincia})</span>
                        <span class="org-sector-tag">${sectorObj ? sectorObj.nombre : ''}</span>
                    </div>
                    
                    <div class="org-header-main">
                        <h4>${org.nombre}</h4>
                    </div>
                    
                    <div class="org-fields">
                        <div class="org-field-item">
                            <span class="field-lbl">Contacto:</span>
                            ${contactoVal}
                        </div>
                        <div class="org-field-item">
                            <span class="field-lbl">Teléfono:</span>
                            <a href="tel:${org.telefono}" class="field-val">${org.telefono}</a>
                        </div>
                        <div class="org-field-item">
                            <span class="field-lbl">Web:</span>
                            ${webVal}
                        </div>
                    </div>
                    
                    ${observacionesBlock}
                    ${problemasHtml}
                </div>
                
                <div class="org-actions" style="margin-top: 20px;">
                    <button class="btn btn-secondary" style="flex:1;" onclick="openDetailModal('organizacion', '${org.id}')">Ficha Completa</button>
                    <a href="https://wa.me/${org.telefono.replace(/[^0-9]/g, '')}" target="_blank" class="btn btn-primary" style="display:flex; align-items:center; justify-content:center; gap: 4px;">
                        WhatsApp
                    </a>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// 4. Modales (Ficha CRM ampliada)
function openDetailModal(type, id) {
    const modal = document.getElementById('detailModal');
    const body = document.getElementById('modalDetailsBody');
    if (!modal || !body) return;
    
    let html = '';
    
    if (type === 'organizacion') {
        const org = organizacionesData.find(o => o.id === id);
        if (!org) return;
        
        const sectorObj = sectoresData.find(s => s.id === org.sector);
        
        const webHtml = org.web 
            ? `<a href="http://${org.web}" target="_blank">${org.web}</a>`
            : '<span class="text-muted">No registra</span>';
            
        const contactoHtml = org.contacto 
            ? org.contacto
            : '<span class="text-muted">No registra</span>';
            
        const problemasHtml = org.problemasPotenciales && org.problemasPotenciales.length > 0
            ? `<div class="modal-section-block">
                   <h5>Problemas Detectados / Cuellos de Botella</h5>
                   <ul class="bullet-list problems" style="margin-top: 8px;">
                       ${org.problemasPotenciales.map(p => `<li>${p}</li>`).join('')}
                   </ul>
               </div>`
            : '';
            
        html += `
            <div class="modal-header-section">
                <h3>${org.nombre}</h3>
                <span class="subtitle">${sectorObj ? sectorObj.nombre : ''} — ${org.ciudad}, ${org.provincia}</span>
            </div>
            
            <div class="modal-body-section">
                <div class="modal-section-block">
                    <h5>Información de Contacto</h5>
                    <p style="margin-top: 8px;"><strong>Referente:</strong> ${contactoHtml}</p>
                    <p><strong>Teléfono:</strong> <a href="tel:${org.telefono}">${org.telefono}</a></p>
                    <p><strong>Sitio Web:</strong> ${webHtml}</p>
                </div>
                
                ${org.notas ? `
                    <div class="modal-section-block" style="border-left: 4px solid var(--accent-indigo);">
                        <h5>Observaciones de Diagnóstico</h5>
                        <p style="margin-top: 8px; font-style: italic; line-height: 1.5; font-size: 0.9rem;">"${org.notas}"</p>
                    </div>
                ` : ''}
                
                ${problemasHtml}
                
                <div style="margin-top: 12px; display:flex; gap: 10px;">
                    <a href="https://wa.me/${org.telefono.replace(/[^0-9]/g, '')}" target="_blank" class="btn btn-primary text-center" style="flex:1;">
                        Iniciar Conversación WhatsApp
                    </a>
                    <button class="btn btn-secondary" onclick="closeDetailModal()">Cerrar Ficha</button>
                </div>
            </div>
        `;
    } else if (type === 'sector') {
        const sec = sectoresData.find(s => s.id === id);
        if (!sec) return;
        
        const orgsEnSector = organizacionesData.filter(o => o.sector === sec.id);
        
        html += `
            <div class="modal-header-section">
                <h3>Sector: ${sec.nombre}</h3>
                <span class="subtitle">Estructura del Ecosistema</span>
            </div>
            <div class="modal-body-section">
                <div class="modal-section-block">
                    <h5>Organizaciones Mapeadas (${orgsEnSector.length})</h5>
                    <div class="mini-orgs-list" style="margin-top: 8px; display:flex; flex-direction:column; gap: 8px; max-height: 250px; overflow-y:auto;">
                        ${orgsEnSector.map(o => `
                            <div onclick="openDetailModal('organizacion', '${o.id}')" style="background-color: var(--bg-main); border:1px solid var(--border-color); padding: 10px 14px; border-radius:var(--radius-md); display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
                                <span style="font-weight:600; font-size:0.88rem;">${o.nombre}</span>
                                <span style="font-size:0.75rem; color:var(--text-secondary);">${o.ciudad}</span>
                            </div>
                        `).join('') || '<div class="text-muted text-center" style="font-size:0.8rem; padding: 10px;">No hay empresas registradas para este sector.</div>'}
                    </div>
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
