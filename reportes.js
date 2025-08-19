// ============================================
// SISTEMA DE REPORTES CETIS 45 CON INDEXEDDB
// ============================================

// ==========================================
// CLASE ALUMNOSDB (COPIADA PARA REPORTES)
// ==========================================
class AlumnosDB {
    constructor() {
        this.dbName = 'CETIS45_DB';
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('alumnos')) {
                    const store = db.createObjectStore('alumnos', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    store.createIndex('matricula', 'matricula', { unique: true });
                    store.createIndex('nombre', 'nombre', { unique: false });
                    store.createIndex('grupo', 'grupo', { unique: false });
                    store.createIndex('fechaRegistro', 'fechaRegistro', { unique: false });
                    store.createIndex('activo', 'activo', { unique: false });
                }
            };
        });
    }

    async obtenerTodos() {
        const transaction = this.db.transaction(['alumnos'], 'readonly');
        const store = transaction.objectStore('alumnos');
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async buscarPorMatricula(matricula) {
        const transaction = this.db.transaction(['alumnos'], 'readonly');
        const store = transaction.objectStore('alumnos');
        const index = store.index('matricula');
        
        return new Promise((resolve, reject) => {
            const request = index.get(matricula);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async obtenerPorGrupo(grupo) {
        const transaction = this.db.transaction(['alumnos'], 'readonly');
        const store = transaction.objectStore('alumnos');
        const index = store.index('grupo');
        
        return new Promise((resolve, reject) => {
            const request = index.getAll(grupo);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async contarAlumnos() {
        const transaction = this.db.transaction(['alumnos'], 'readonly');
        const store = transaction.objectStore('alumnos');
        
        return new Promise((resolve, reject) => {
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async obtenerGruposUnicos() {
        const alumnos = await this.obtenerTodos();
        const grupos = [...new Set(alumnos.map(a => a.grupo).filter(g => g && g.trim()))];
        return grupos.sort();
    }
}

// ==========================================
// VARIABLES GLOBALES
// ==========================================
const alumnosDB = new AlumnosDB();
let asistenciasData = [];
let alumnosData = [];
let reporteActual = null;

// ==========================================
// FUNCIONES DE INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await alumnosDB.init();
        await cargarDatos();
        await cargarGruposEnFiltros();
        console.log('✅ Sistema de reportes inicializado con IndexedDB');
    } catch (error) {
        console.error('❌ Error al inicializar reportes:', error);
        mostrarError('Error al inicializar sistema de reportes');
    }
});

async function cargarDatos() {
    try {
        // Cargar datos de asistencias desde localStorage (existente)
        const asistencias = localStorage.getItem('asistencias');
        asistenciasData = asistencias ? JSON.parse(asistencias) : [];
        
        // Cargar datos de alumnos desde IndexedDB (nuevo)
        alumnosData = await alumnosDB.obtenerTodos();
        
        console.log(`📊 Datos cargados: ${asistenciasData.length} asistencias, ${alumnosData.length} alumnos`);
        
        // Actualizar estadísticas generales
        actualizarEstadisticasGenerales();
        
    } catch (error) {
        console.error('Error al cargar datos:', error);
        mostrarError('Error al cargar datos del sistema');
    }
}

async function cargarGruposEnFiltros() {
    try {
        const grupos = await alumnosDB.obtenerGruposUnicos();
        
        // Actualizar todos los selectores de grupo
        const selectores = document.querySelectorAll('#grupoFiltro, #grupoReporte, #grupoAnalisis');
        selectores.forEach(select => {
            const valorActual = select.value;
            select.innerHTML = '<option value="">Todos los grupos</option>' +
                grupos.map(grupo => `<option value="${grupo}">${grupo}</option>`).join('');
            select.value = valorActual;
        });
        
    } catch (error) {
        console.error('Error al cargar grupos:', error);
    }
}

// ==========================================
// FUNCIONES DE ESTADÍSTICAS GENERALES
// ==========================================
function actualizarEstadisticasGenerales() {
    const estadisticas = calcularEstadisticasGenerales();
    
    // Actualizar contadores en la interfaz
    const elementos = {
        'totalAlumnos': estadisticas.totalAlumnos,
        'totalAsistencias': estadisticas.totalAsistencias,
        'totalGrupos': estadisticas.totalGrupos,
        'promedioAsistencia': estadisticas.promedioAsistencia + '%'
    };
    
    Object.entries(elementos).forEach(([id, valor]) => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = valor;
        }
    });
}

function calcularEstadisticasGenerales() {
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    
    const asistenciasHoy = asistenciasData.filter(a => {
        const fecha = new Date(a.timestamp);
        return fecha.toDateString() === hoy.toDateString();
    });
    
    const asistenciasSemana = asistenciasData.filter(a => {
        const fecha = new Date(a.timestamp);
        return fecha >= inicioSemana;
    });
    
    const alumnosUnicos = new Set(asistenciasData.map(a => a.matricula));
    const gruposUnicos = new Set(alumnosData.map(a => a.grupo).filter(g => g));
    
    return {
        totalAlumnos: alumnosData.length,
        totalAsistencias: asistenciasData.length,
        totalGrupos: gruposUnicos.size,
        asistenciasHoy: asistenciasHoy.length,
        asistenciasSemana: asistenciasSemana.length,
        alumnosConAsistencia: alumnosUnicos.size,
        promedioAsistencia: alumnosData.length > 0 ? 
            Math.round((alumnosUnicos.size / alumnosData.length) * 100) : 0
    };
}

// ==========================================
// FUNCIONES DE REPORTES DE ASISTENCIA
// ==========================================
async function generarReporteAsistencia() {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    const grupoFiltro = document.getElementById('grupoFiltro').value;
    
    if (!fechaInicio || !fechaFin) {
        mostrarError('Por favor selecciona las fechas de inicio y fin');
        return;
    }
    
    try {
        const reporte = await crearReporteAsistencia(fechaInicio, fechaFin, grupoFiltro);
        mostrarReporteAsistencia(reporte);
        reporteActual = reporte;
        
    } catch (error) {
        console.error('Error al generar reporte:', error);
        mostrarError('Error al generar reporte de asistencia');
    }
}

async function crearReporteAsistencia(fechaInicio, fechaFin, grupo = '') {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999); // Incluir todo el día final
    
    // Filtrar asistencias por fecha
    let asistenciasFiltradas = asistenciasData.filter(asistencia => {
        const fecha = new Date(asistencia.timestamp);
        return fecha >= inicio && fecha <= fin;
    });
    
    // Filtrar por grupo si se especifica
    if (grupo) {
        const alumnosGrupo = await alumnosDB.obtenerPorGrupo(grupo);
        const matriculasGrupo = new Set(alumnosGrupo.map(a => a.matricula));
        asistenciasFiltradas = asistenciasFiltradas.filter(a => 
            matriculasGrupo.has(a.matricula)
        );
    }
    
    // Enriquecer asistencias con datos de alumnos de IndexedDB
    const asistenciasEnriquecidas = await Promise.all(
        asistenciasFiltradas.map(async (asistencia) => {
            const alumno = await alumnosDB.buscarPorMatricula(asistencia.matricula);
            return {
                ...asistencia,
                nombreCompleto: alumno ? alumno.nombre : asistencia.nombre,
                grupo: alumno ? alumno.grupo : 'Sin grupo',
                alumnoEnBD: !!alumno
            };
        })
    );
    
    // Agrupar por estudiante
    const porEstudiante = {};
    asistenciasEnriquecidas.forEach(asistencia => {
        const matricula = asistencia.matricula;
        if (!porEstudiante[matricula]) {
            porEstudiante[matricula] = {
                matricula,
                nombre: asistencia.nombreCompleto,
                grupo: asistencia.grupo,
                asistencias: [],
                puntuales: 0,
                retardos: 0,
                tolerancias: 0,
                totalDias: 0
            };
        }
        
        porEstudiante[matricula].asistencias.push(asistencia);
        porEstudiante[matricula].totalDias++;
        
        switch (asistencia.estado) {
            case 'PUNTUAL':
                porEstudiante[matricula].puntuales++;
                break;
            case 'RETARDO':
                porEstudiante[matricula].retardos++;
                break;
            case 'TOLERANCIA':
                porEstudiante[matricula].tolerancias++;
                break;
        }
    });
    
    const estudiantesArray = Object.values(porEstudiante);
    
    return {
        fechaInicio,
        fechaFin,
        grupo: grupo || 'Todos',
        totalRegistros: asistenciasFiltradas.length,
        totalEstudiantes: estudiantesArray.length,
        estudiantes: estudiantesArray.sort((a, b) => a.nombre.localeCompare(b.nombre)),
        resumen: calcularResumenReporte(estudiantesArray)
    };
}

function calcularResumenReporte(estudiantes) {
    const totales = estudiantes.reduce((acc, est) => ({
        puntuales: acc.puntuales + est.puntuales,
        retardos: acc.retardos + est.retardos,
        tolerancias: acc.tolerancias + est.tolerancias,
        dias: acc.dias + est.totalDias
    }), { puntuales: 0, retardos: 0, tolerancias: 0, dias: 0 });
    
    const porcentajes = {
        puntuales: totales.dias > 0 ? ((totales.puntuales / totales.dias) * 100).toFixed(1) : 0,
        retardos: totales.dias > 0 ? ((totales.retardos / totales.dias) * 100).toFixed(1) : 0,
        tolerancias: totales.dias > 0 ? ((totales.tolerancias / totales.dias) * 100).toFixed(1) : 0
    };
    
    return { totales, porcentajes };
}

function mostrarReporteAsistencia(reporte) {
    const container = document.getElementById('resultadosReporte');
    
    let html = `
        <div class="reporte-header">
            <h3>📊 Reporte de Asistencia</h3>
            <div class="reporte-info">
                <span><strong>Período:</strong> ${formatearFecha(reporte.fechaInicio)} - ${formatearFecha(reporte.fechaFin)}</span>
                <span><strong>Grupo:</strong> ${reporte.grupo}</span>
                <span><strong>Estudiantes:</strong> ${reporte.totalEstudiantes}</span>
                <span><strong>Registros:</strong> ${reporte.totalRegistros}</span>
            </div>
        </div>
        
        <div class="resumen-estadisticas">
            <div class="stat-card puntual">
                <div class="stat-numero">${reporte.resumen.porcentajes.puntuales}%</div>
                <div class="stat-label">Puntuales (${reporte.resumen.totales.puntuales})</div>
            </div>
            <div class="stat-card tolerancia">
                <div class="stat-numero">${reporte.resumen.porcentajes.tolerancias}%</div>
                <div class="stat-label">Tolerancia (${reporte.resumen.totales.tolerancias})</div>
            </div>
            <div class="stat-card retardo">
                <div class="stat-numero">${reporte.resumen.porcentajes.retardos}%</div>
                <div class="stat-label">Retardos (${reporte.resumen.totales.retardos})</div>
            </div>
        </div>
        
        <div class="tabla-reporte">
            <table>
                <thead>
                    <tr>
                        <th>Matrícula</th>
                        <th>Nombre</th>
                        <th>Grupo</th>
                        <th>Total Días</th>
                        <th>Puntuales</th>
                        <th>Tolerancia</th>
                        <th>Retardos</th>
                        <th>% Puntualidad</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    reporte.estudiantes.forEach(estudiante => {
        const puntualidad = estudiante.totalDias > 0 ? 
            ((estudiante.puntuales / estudiante.totalDias) * 100).toFixed(1) : 0;
        
        html += `
            <tr>
                <td>${estudiante.matricula}</td>
                <td>${estudiante.nombre}</td>
                <td>${estudiante.grupo}</td>
                <td>${estudiante.totalDias}</td>
                <td class="puntual">${estudiante.puntuales}</td>
                <td class="tolerancia">${estudiante.tolerancias}</td>
                <td class="retardo">${estudiante.retardos}</td>
                <td><strong>${puntualidad}%</strong></td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        
        <div class="acciones-reporte">
            <button onclick="exportarReporteCSV()" class="btn btn-success">📄 Exportar CSV</button>
            <button onclick="exportarReportePDF()" class="btn btn-primary">📑 Exportar PDF</button>
            <button onclick="imprimirReporte()" class="btn btn-secondary">🖨️ Imprimir</button>
        </div>
    `;
    
    container.innerHTML = html;
    container.style.display = 'block';
}

// ==========================================
// FUNCIONES DE REPORTES DE ALUMNOS
// ==========================================
async function generarReporteAlumnos() {
    try {
        const grupoFiltro = document.getElementById('grupoReporte').value;
        const estadoFiltro = document.getElementById('estadoReporte').value;
        
        const reporte = await crearReporteAlumnos(grupoFiltro, estadoFiltro);
        mostrarReporteAlumnos(reporte);
        reporteActual = reporte;
        
    } catch (error) {
        console.error('Error al generar reporte de alumnos:', error);
        mostrarError('Error al generar reporte de alumnos');
    }
}

async function crearReporteAlumnos(grupo = '', estado = '') {
    let alumnos = await alumnosDB.obtenerTodos();
    
    // Filtrar por grupo
    if (grupo) {
        alumnos = alumnos.filter(a => a.grupo === grupo);
    }
    
    // Filtrar por estado
    if (estado) {
        const esActivo = estado === 'true';
        alumnos = alumnos.filter(a => a.activo === esActivo);
    }
    
    // Enriquecer con datos de asistencia
    const alumnosEnriquecidos = alumnos.map(alumno => {
        const asistenciasAlumno = asistenciasData.filter(a => a.matricula === alumno.matricula);
        const ultimaAsistencia = asistenciasAlumno.length > 0 ? 
            new Date(Math.max(...asistenciasAlumno.map(a => new Date(a.timestamp)))) : null;
        
        return {
            ...alumno,
            totalAsistencias: asistenciasAlumno.length,
            ultimaAsistencia: ultimaAsistencia,
            diasSinAsistir: ultimaAsistencia ? 
                Math.floor((new Date() - ultimaAsistencia) / (1000 * 60 * 60 * 24)) : null
        };
    });
    
    // Estadísticas del reporte
    const gruposUnicos = [...new Set(alumnos.map(a => a.grupo).filter(g => g))];
    const activos = alumnos.filter(a => a.activo).length;
    const inactivos = alumnos.filter(a => !a.activo).length;
    const conAsistencias = alumnosEnriquecidos.filter(a => a.totalAsistencias > 0).length;
    
    return {
        filtros: { grupo: grupo || 'Todos', estado: estado || 'Todos' },
        totalAlumnos: alumnos.length,
        estadisticas: {
            activos,
            inactivos,
            conAsistencias,
            sinAsistencias: alumnos.length - conAsistencias,
            gruposUnicos: gruposUnicos.length
        },
        alumnos: alumnosEnriquecidos.sort((a, b) => a.nombre.localeCompare(b.nombre)),
        grupos: gruposUnicos.sort()
    };
}

function mostrarReporteAlumnos(reporte) {
    const container = document.getElementById('resultadosReporteAlumnos') || 
                    document.getElementById('resultadosReporte');
    
    let html = `
        <div class="reporte-header">
            <h3>👥 Reporte de Alumnos</h3>
            <div class="reporte-info">
                <span><strong>Grupo:</strong> ${reporte.filtros.grupo}</span>
                <span><strong>Estado:</strong> ${reporte.filtros.estado}</span>
                <span><strong>Total:</strong> ${reporte.totalAlumnos} alumnos</span>
            </div>
        </div>
        
        <div class="resumen-estadisticas">
            <div class="stat-card activo">
                <div class="stat-numero">${reporte.estadisticas.activos}</div>
                <div class="stat-label">Activos</div>
            </div>
            <div class="stat-card inactivo">
                <div class="stat-numero">${reporte.estadisticas.inactivos}</div>
                <div class="stat-label">Inactivos</div>
            </div>
            <div class="stat-card asistencia">
                <div class="stat-numero">${reporte.estadisticas.conAsistencias}</div>
                <div class="stat-label">Con Asistencias</div>
            </div>
            <div class="stat-card grupo">
                <div class="stat-numero">${reporte.estadisticas.gruposUnicos}</div>
                <div class="stat-label">Grupos</div>
            </div>
        </div>
        
        <div class="tabla-reporte">
            <table>
                <thead>
                    <tr>
                        <th>Matrícula</th>
                        <th>Nombre</th>
                        <th>Grupo</th>
                        <th>Estado</th>
                        <th>Fecha Registro</th>
                        <th>Total Asistencias</th>
                        <th>Última Asistencia</th>
                        <th>Días sin Asistir</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    reporte.alumnos.forEach(alumno => {
        const fechaRegistro = alumno.fechaRegistro ? 
            formatearFecha(alumno.fechaRegistro.split('T')[0]) : '-';
        const ultimaAsistencia = alumno.ultimaAsistencia ? 
            formatearFecha(alumno.ultimaAsistencia.toISOString().split('T')[0]) : 'Nunca';
        const diasSinAsistir = alumno.diasSinAsistir !== null ? 
            (alumno.diasSinAsistir === 0 ? 'Hoy' : `${alumno.diasSinAsistir} días`) : '-';
        
        html += `
            <tr>
                <td>${alumno.matricula}</td>
                <td>${alumno.nombre}</td>
                <td>${alumno.grupo || 'Sin grupo'}</td>
                <td>
                    <span class="estado ${alumno.activo ? 'activo' : 'inactivo'}">
                        ${alumno.activo ? '✅ Activo' : '❌ Inactivo'}
                    </span>
                </td>
                <td>${fechaRegistro}</td>
                <td>${alumno.totalAsistencias}</td>
                <td>${ultimaAsistencia}</td>
                <td>${diasSinAsistir}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        
        <div class="acciones-reporte">
            <button onclick="exportarReporteCSV()" class="btn btn-success">📄 Exportar CSV</button>
            <button onclick="imprimirReporte()" class="btn btn-secondary">🖨️ Imprimir</button>
        </div>
    `;
    
    container.innerHTML = html;
    container.style.display = 'block';
}

// ==========================================
// FUNCIONES DE ANÁLISIS AVANZADO
// ==========================================
async function generarAnalisisAvanzado() {
    try {
        const tipoAnalisis = document.getElementById('tipoAnalisis').value;
        const grupoAnalisis = document.getElementById('grupoAnalisis').value;
        
        let resultado;
        switch (tipoAnalisis) {
            case 'tendencias':
                resultado = await analizarTendenciasAsistencia(grupoAnalisis);
                break;
            case 'comparativo':
                resultado = await analizarComparativoGrupos();
                break;
            case 'alertas':
                resultado = await generarAlertasEstudiantes(grupoAnalisis);
                break;
            case 'prediccion':
                resultado = await predecirTendencias(grupoAnalisis);
                break;
            default:
                mostrarError('Tipo de análisis no válido');
                return;
        }
        
        mostrarAnalisisAvanzado(resultado, tipoAnalisis);
        reporteActual = resultado;
        
    } catch (error) {
        console.error('Error en análisis avanzado:', error);
        mostrarError('Error al generar análisis avanzado');
    }
}

async function analizarTendenciasAsistencia(grupo = '') {
    // Obtener datos de los últimos 30 días
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - 30);
    
    let asistencias = asistenciasData.filter(a => new Date(a.timestamp) >= fechaInicio);
    
    // Filtrar por grupo si se especifica
    if (grupo) {
        const alumnosGrupo = await alumnosDB.obtenerPorGrupo(grupo);
        const matriculasGrupo = new Set(alumnosGrupo.map(a => a.matricula));
        asistencias = asistencias.filter(a => matriculasGrupo.has(a.matricula));
    }
    
    // Agrupar por día
    const porDia = {};
    asistencias.forEach(a => {
        const dia = new Date(a.timestamp).toISOString().split('T')[0];
        if (!porDia[dia]) {
            porDia[dia] = { total: 0, puntuales: 0, retardos: 0, tolerancias: 0 };
        }
        porDia[dia].total++;
        if (a.estado === 'PUNTUAL') porDia[dia].puntuales++;
        if (a.estado === 'RETARDO') porDia[dia].retardos++;
        if (a.estado === 'TOLERANCIA') porDia[dia].tolerancias++;
    });
    
    const dias = Object.keys(porDia).sort();
    const tendencia = dias.map(dia => ({
        fecha: dia,
        ...porDia[dia],
        puntualidad: porDia[dia].total > 0 ? 
            ((porDia[dia].puntuales / porDia[dia].total) * 100).toFixed(1) : 0
    }));
    
    return {
        tipo: 'tendencias',
        grupo: grupo || 'Todos los grupos',
        periodo: '30 días',
        datos: tendencia,
        promedioPuntualidad: tendencia.length > 0 ? 
            (tendencia.reduce((acc, d) => acc + parseFloat(d.puntualidad), 0) / tendencia.length).toFixed(1) : 0
    };
}

async function analizarComparativoGrupos() {
    const grupos = await alumnosDB.obtenerGruposUnicos();
    const comparativo = [];
    
    for (const grupo of grupos) {
        const alumnosGrupo = await alumnosDB.obtenerPorGrupo(grupo);
        const matriculas = alumnosGrupo.map(a => a.matricula);
        const asistenciasGrupo = asistenciasData.filter(a => matriculas.includes(a.matricula));
        
        const puntuales = asistenciasGrupo.filter(a => a.estado === 'PUNTUAL').length;
        const retardos = asistenciasGrupo.filter(a => a.estado === 'RETARDO').length;
        const tolerancias = asistenciasGrupo.filter(a => a.estado === 'TOLERANCIA').length;
        const total = asistenciasGrupo.length;
        
        comparativo.push({
            grupo,
            totalAlumnos: alumnosGrupo.length,
            totalAsistencias: total,
            puntuales,
            retardos,
            tolerancias,
            puntualidad: total > 0 ? ((puntuales / total) * 100).toFixed(1) : 0,
            promedioAsistenciasPorAlumno: alumnosGrupo.length > 0 ? 
                (total / alumnosGrupo.length).toFixed(1) : 0
        });
    }
    
    return {
        tipo: 'comparativo',
        grupos: comparativo.sort((a, b) => b.puntualidad - a.puntualidad)
    };
}

async function generarAlertasEstudiantes(grupo = '') {
    let alumnos = await alumnosDB.obtenerTodos();
    
    if (grupo) {
        alumnos = alumnos.filter(a => a.grupo === grupo);
    }
    
    const alertas = [];
    
    alumnos.forEach(alumno => {
        const asistenciasAlumno = asistenciasData.filter(a => a.matricula === alumno.matricula);
        const retardosRecientes = asistenciasAlumno
            .filter(a => a.estado === 'RETARDO')
            .filter(a => {
                const fecha = new Date(a.timestamp);
                const hace7Dias = new Date();
                hace7Dias.setDate(hace7Dias.getDate() - 7);
                return fecha >= hace7Dias;
            });
        
        const ultimaAsistencia = asistenciasAlumno.length > 0 ? 
            new Date(Math.max(...asistenciasAlumno.map(a => new Date(a.timestamp)))) : null;
        
        const diasSinAsistir = ultimaAsistencia ? 
            Math.floor((new Date() - ultimaAsistencia) / (1000 * 60 * 60 * 24)) : null;
        
        // Generar alertas
        if (retardosRecientes.length >= 3) {
            alertas.push({
                tipo: 'retardos',
                nivel: 'alto',
                alumno,
                mensaje: `${retardosRecientes.length} retardos en los últimos 7 días`,
                valor: retardosRecientes.length
            });
        }
        
        if (diasSinAsistir && diasSinAsistir >= 3) {
            alertas.push({
                tipo: 'ausencia',
                nivel: diasSinAsistir >= 7 ? 'alto' : 'medio',
                alumno,
                mensaje: `${diasSinAsistir} días sin registrar asistencia`,
                valor: diasSinAsistir
            });
        }
        
        if (asistenciasAlumno.length === 0 && alumno.activo) {
            alertas.push({
                tipo: 'sin_registro',
                nivel: 'medio',
                alumno,
                mensaje: 'Nunca ha registrado asistencia',
                valor: 0
            });
        }
    });
    
    return {
        tipo: 'alertas',
        grupo: grupo || 'Todos los grupos',
        total: alertas.length,
        alertas: alertas.sort((a, b) => {
            const niveles = { alto: 3, medio: 2, bajo: 1 };
            return niveles[b.nivel] - niveles[a.nivel];
        })
    };
}

async function predecirTendencias(grupo = '') {
    // Análisis simple de tendencias basado en datos históricos
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - 14); // Últimas 2 semanas
    
    let asistencias = asistenciasData.filter(a => new Date(a.timestamp) >= fechaInicio);
    
    if (grupo) {
        const alumnosGrupo = await alumnosDB.obtenerPorGrupo(grupo);
        const matriculasGrupo = new Set(alumnosGrupo.map(a => a.matricula));
        asistencias = asistencias.filter(a => matriculasGrupo.has(a.matricula));
    }
    
    // Calcular tendencia de puntualidad por día de semana
    const porDiaSemana = {};
    asistencias.forEach(a => {
        const fecha = new Date(a.timestamp);
        const diaSemana = fecha.getDay(); // 0 = Domingo, 1 = Lunes, etc.
        if (!porDiaSemana[diaSemana]) {
            porDiaSemana[diaSemana] = { total: 0, puntuales: 0 };
        }
        porDiaSemana[diaSemana].total++;
        if (a.estado === 'PUNTUAL') porDiaSemana[diaSemana].puntuales++;
    });
    
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const predicciones = [];
    
    for (let i = 1; i <= 5; i++) { // Solo días laborales
        const datos = porDiaSemana[i];
        if (datos && datos.total > 0) {
            const puntualidad = (datos.puntuales / datos.total) * 100;
            predicciones.push({
                dia: diasSemana[i],
                puntualidadEsperada: puntualidad.toFixed(1),
                confianza: datos.total >= 5 ? 'alta' : 'media',
                muestras: datos.total
            });
        }
    }
    
    return {
        tipo: 'prediccion',
        grupo: grupo || 'Todos los grupos',
        periodo: 'Últimas 2 semanas',
        predicciones
    };
}

function mostrarAnalisisAvanzado(resultado, tipo) {
    const container = document.getElementById('resultadosAnalisis') || 
                    document.getElementById('resultadosReporte');
    
    let html = `<div class="reporte-header"><h3>📈 Análisis Avanzado - ${tipo}</h3></div>`;
    
    switch (tipo) {
        case 'tendencias':
            html += mostrarTendencias(resultado);
            break;
        case 'comparativo':
            html += mostrarComparativo(resultado);
            break;
        case 'alertas':
            html += mostrarAlertas(resultado);
            break;
        case 'prediccion':
            html += mostrarPredicciones(resultado);
            break;
    }
    
    container.innerHTML = html;
    container.style.display = 'block';
}

function mostrarTendencias(resultado) {
    let html = `
        <div class="analisis-info">
            <p><strong>Grupo:</strong> ${resultado.grupo}</p>
            <p><strong>Período:</strong> ${resultado.periodo}</p>
            <p><strong>Promedio Puntualidad:</strong> ${resultado.promedioPuntualidad}%</p>
        </div>
        <div class="tabla-reporte">
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Total Asistencias</th>
                        <th>Puntuales</th>
                        <th>Tolerancia</th>
                        <th>Retardos</th>
                        <th>% Puntualidad</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    resultado.datos.forEach(dia => {
        html += `
            <tr>
                <td>${formatearFecha(dia.fecha)}</td>
                <td>${dia.total}</td>
                <td class="puntual">${dia.puntuales}</td>
                <td class="tolerancia">${dia.tolerancias}</td>
                <td class="retardo">${dia.retardos}</td>
                <td><strong>${dia.puntualidad}%</strong></td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    return html;
}

function mostrarComparativo(resultado) {
    let html = `
        <div class="resumen-estadisticas">
    `;
    
    resultado.grupos.forEach((grupo, index) => {
        html += `
            <div class="stat-card">
                <div class="stat-numero">${grupo.puntualidad}%</div>
                <div class="stat-label">${grupo.grupo}</div>
                <div class="stat-detalle">${grupo.totalAlumnos} alumnos</div>
            </div>
        `;
    });
    
    html += `
        </div>
        <div class="tabla-reporte">
            <table>
                <thead>
                    <tr>
                        <th>Grupo</th>
                        <th>Total Alumnos</th>
                        <th>Total Asistencias</th>
                        <th>Puntuales</th>
                        <th>Retardos</th>
                        <th>% Puntualidad</th>
                        <th>Promedio Asist/Alumno</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    resultado.grupos.forEach(grupo => {
        html += `
            <tr>
                <td><strong>${grupo.grupo}</strong></td>
                <td>${grupo.totalAlumnos}</td>
                <td>${grupo.totalAsistencias}</td>
                <td class="puntual">${grupo.puntuales}</td>
                <td class="retardo">${grupo.retardos}</td>
                <td><strong>${grupo.puntualidad}%</strong></td>
                <td>${grupo.promedioAsistenciasPorAlumno}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    return html;
}

function mostrarAlertas(resultado) {
    let html = `
        <div class="alertas-resumen">
            <p><strong>Total Alertas:</strong> ${resultado.total}</p>
            <p><strong>Grupo:</strong> ${resultado.grupo}</p>
        </div>
    `;
    
    if (resultado.alertas.length === 0) {
        html += '<div class="sin-alertas">✅ No hay alertas en este momento</div>';
        return html;
    }
    
    html += '<div class="lista-alertas">';
    
    resultado.alertas.forEach(alerta => {
        const iconos = {
            retardos: '⏰',
            ausencia: '❌',
            sin_registro: '❓'
        };
        
        const colores = {
            alto: 'alert-danger',
            medio: 'alert-warning',
            bajo: 'alert-info'
        };
        
        html += `
            <div class="alerta-item ${colores[alerta.nivel]}">
                <div class="alerta-icono">${iconos[alerta.tipo]}</div>
                <div class="alerta-contenido">
                    <div class="alerta-alumno">
                        <strong>${alerta.alumno.nombre}</strong> (${alerta.alumno.matricula})
                        ${alerta.alumno.grupo ? ` - ${alerta.alumno.grupo}` : ''}
                    </div>
                    <div class="alerta-mensaje">${alerta.mensaje}</div>
                </div>
                <div class="alerta-nivel nivel-${alerta.nivel}">${alerta.nivel.toUpperCase()}</div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

function mostrarPredicciones(resultado) {
    let html = `
        <div class="predicciones-info">
            <p><strong>Grupo:</strong> ${resultado.grupo}</p>
            <p><strong>Basado en:</strong> ${resultado.periodo}</p>
        </div>
        <div class="tabla-reporte">
            <table>
                <thead>
                    <tr>
                        <th>Día de la Semana</th>
                        <th>Puntualidad Esperada</th>
                        <th>Nivel de Confianza</th>
                        <th>Muestras Analizadas</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    resultado.predicciones.forEach(pred => {
        const confianzaClass = pred.confianza === 'alta' ? 'alta' : 'media';
        html += `
            <tr>
                <td><strong>${pred.dia}</strong></td>
                <td class="prediccion-valor">${pred.puntualidadEsperada}%</td>
                <td><span class="confianza ${confianzaClass}">${pred.confianza}</span></td>
                <td>${pred.muestras}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    return html;
}

// ==========================================
// FUNCIONES DE EXPORTACIÓN
// ==========================================
function exportarReporteCSV() {
    if (!reporteActual) {
        mostrarError('No hay reporte para exportar');
        return;
    }
    
    let csv = '';
    let filename = 'reporte_cetis45';
    
    if (reporteActual.estudiantes) {
        // Reporte de asistencia
        csv = 'Matrícula,Nombre,Grupo,Total Días,Puntuales,Tolerancia,Retardos,% Puntualidad\n';
        reporteActual.estudiantes.forEach(est => {
            const puntualidad = est.totalDias > 0 ? 
                ((est.puntuales / est.totalDias) * 100).toFixed(1) : 0;
            csv += `${est.matricula},"${est.nombre}",${est.grupo},${est.totalDias},${est.puntuales},${est.tolerancias},${est.retardos},${puntualidad}%\n`;
        });
        filename = `asistencia_${reporteActual.fechaInicio}_${reporteActual.fechaFin}`;
    } else if (reporteActual.alumnos) {
        // Reporte de alumnos
        csv = 'Matrícula,Nombre,Grupo,Estado,Fecha Registro,Total Asistencias,Última Asistencia\n';
        reporteActual.alumnos.forEach(alumno => {
            const fechaRegistro = alumno.fechaRegistro ? 
                formatearFecha(alumno.fechaRegistro.split('T')[0]) : '';
            const ultimaAsistencia = alumno.ultimaAsistencia ? 
                formatearFecha(alumno.ultimaAsistencia.toISOString().split('T')[0]) : 'Nunca';
            csv += `${alumno.matricula},"${alumno.nombre}",${alumno.grupo || ''},${alumno.activo ? 'Activo' : 'Inactivo'},${fechaRegistro},${alumno.totalAsistencias},${ultimaAsistencia}\n`;
        });
        filename = `alumnos_${reporteActual.filtros.grupo}`;
    }
    
    if (csv) {
        descargarCSV(csv, `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        mostrarMensaje('📄 Reporte exportado correctamente', 'success');
    }
}

function exportarReportePDF() {
    mostrarMensaje('📑 Función PDF próximamente...', 'info');
}

function imprimirReporte() {
    window.print();
}

function descargarCSV(contenido, nombreArchivo) {
    const blob = new Blob(['\ufeff' + contenido], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = nombreArchivo;
    link.click();
    URL.revokeObjectURL(link.href);
}

// ==========================================
// FUNCIONES DE UTILIDAD
// ==========================================
function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function mostrarError(mensaje) {
    // Crear o actualizar elemento de error
    let errorElement = document.getElementById('errorReportes');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'errorReportes';
        errorElement.className = 'alert alert-error';
        errorElement.style.cssText = `
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            padding: 12px 16px;
            border-radius: 6px;
            margin: 15px 0;
            font-weight: bold;
        `;
        document.querySelector('.container').insertBefore(errorElement, document.querySelector('.container').firstChild);
    }
    
    errorElement.textContent = '❌ ' + mensaje;
    errorElement.style.display = 'block';
    
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

function mostrarMensaje(mensaje, tipo) {
    let elemento = document.getElementById('mensajeReportes');
    if (!elemento) {
        elemento = document.createElement('div');
        elemento.id = 'mensajeReportes';
        document.querySelector('.container').insertBefore(elemento, document.querySelector('.container').firstChild);
    }
    
    const colores = {
        success: { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
        info: { bg: '#cce7ff', color: '#003f7f', border: '#99d6ff' },
        warning: { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' }
    };
    
    const color = colores[tipo] || colores.info;
    
    elemento.className = 'alert';
    elemento.style.cssText = `
        background: ${color.bg};
        color: ${color.color};
        border: 1px solid ${color.border};
        padding: 12px 16px;
        border-radius: 6px;
        margin: 15px 0;
        font-weight: bold;
    `;
    elemento.textContent = mensaje;
    
    setTimeout(() => {
        elemento.style.display = 'none';
    }, 3000);
}

// ==========================================
// FUNCIONES GLOBALES PARA HTML
// ==========================================
window.generarReporteAsistencia = generarReporteAsistencia;
window.generarReporteAlumnos = generarReporteAlumnos;
window.generarAnalisisAvanzado = generarAnalisisAvanzado;
window.exportarReporteCSV = exportarReporteCSV;
window.exportarReportePDF = exportarReportePDF;
window.imprimirReporte = imprimirReporte;
window.cargarGruposEnFiltros = cargarGruposEnFiltros;
window.actualizarEstadisticasGenerales = actualizarEstadisticasGenerales;