// ============================================
// SISTEMA DE CREDENCIALES CETIS 45 CON INDEXEDDB
// ============================================

// ==========================================
// CONFIGURACIÓN INDEXEDDB
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
                
                // Crear tabla alumnos si no existe
                if (!db.objectStoreNames.contains('alumnos')) {
                    const store = db.createObjectStore('alumnos', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    // Índices para búsquedas eficientes
                    store.createIndex('matricula', 'matricula', { unique: true });
                    store.createIndex('nombre', 'nombre', { unique: false });
                    store.createIndex('grupo', 'grupo', { unique: false });
                    store.createIndex('fechaRegistro', 'fechaRegistro', { unique: false });
                    store.createIndex('activo', 'activo', { unique: false });
                }
            };
        });
    }

    async guardarAlumno(alumno) {
        const transaction = this.db.transaction(['alumnos'], 'readwrite');
        const store = transaction.objectStore('alumnos');
        
        // Agregar timestamp y estado activo
        alumno.fechaRegistro = new Date().toISOString();
        alumno.activo = true;
        
        return store.add(alumno);
    }

    async guardarAlumnos(alumnos) {
        const transaction = this.db.transaction(['alumnos'], 'readwrite');
        const store = transaction.objectStore('alumnos');
        const resultados = [];
        
        for (const alumno of alumnos) {
            try {
                // Verificar si ya existe por matrícula
                const existe = await this.buscarPorMatricula(alumno.matricula);
                if (!existe) {
                    alumno.fechaRegistro = new Date().toISOString();
                    alumno.activo = true;
                    await store.add(alumno);
                    resultados.push({alumno, status: 'guardado'});
                } else {
                    resultados.push({alumno, status: 'duplicado'});
                }
            } catch (error) {
                resultados.push({alumno, status: 'error', error: error.message});
            }
        }
        
        return resultados;
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

    async obtenerTodos() {
        const transaction = this.db.transaction(['alumnos'], 'readonly');
        const store = transaction.objectStore('alumnos');
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
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
}

// Instancia global de la base de datos
const alumnosDB = new AlumnosDB();

// ==========================================
// VARIABLES GLOBALES
// ==========================================
let estudiantesData = [];
let qrCodeInstances = [];

// ==========================================
// FUNCIONES DE CARGA DE DATOS
// ==========================================
async function cargarDatos() {
    const input = document.getElementById('csvInput');
    const file = input.files[0];
    
    if (!file) {
        mostrarMensaje('Por favor selecciona un archivo CSV', 'error');
        return;
    }
    
    try {
        const text = await file.text();
        const lineas = text.split('\n').filter(linea => linea.trim());
        
        if (lineas.length < 2) {
            mostrarMensaje('El archivo debe contener al menos una fila de encabezados y una de datos', 'error');
            return;
        }
        
        // Analizar encabezados
        const encabezados = lineas[0].split(',').map(h => h.trim().toLowerCase());
        const indices = detectarIndices(encabezados);
        
        if (!indices.matricula || !indices.nombre) {
            mostrarMensaje('El archivo debe contener columnas "matricula" y "nombre"', 'error');
            return;
        }
        
        // Procesar datos
        estudiantesData = [];
        const alumnosParaGuardar = [];
        
        for (let i = 1; i < lineas.length; i++) {
            const datos = lineas[i].split(',').map(d => d.trim());
            
            if (datos.length >= 2 && datos[indices.matricula] && datos[indices.nombre]) {
                const estudiante = {
                    matricula: datos[indices.matricula].replace(/"/g, ''),
                    nombre: datos[indices.nombre].replace(/"/g, ''),
                    grupo: indices.grupo ? (datos[indices.grupo] || '').replace(/"/g, '') : ''
                };
                
                estudiantesData.push(estudiante);
                alumnosParaGuardar.push(estudiante);
            }
        }
        
        if (estudiantesData.length === 0) {
            mostrarMensaje('No se encontraron datos válidos en el archivo', 'error');
            return;
        }
        
        // Guardar en IndexedDB
        await alumnosDB.init();
        const resultados = await alumnosDB.guardarAlumnos(alumnosParaGuardar);
        
        // Mostrar resultados
        const guardados = resultados.filter(r => r.status === 'guardado').length;
        const duplicados = resultados.filter(r => r.status === 'duplicado').length;
        const errores = resultados.filter(r => r.status === 'error').length;
        
        let mensaje = `✅ Datos cargados: ${estudiantesData.length} estudiantes\n`;
        mensaje += `💾 Guardados en BD: ${guardados}\n`;
        if (duplicados > 0) mensaje += `⚠️ Duplicados omitidos: ${duplicados}\n`;
        if (errores > 0) mensaje += `❌ Errores: ${errores}`;
        
        mostrarMensaje(mensaje, 'success');
        document.getElementById('generarBtn').disabled = false;
        
        // Actualizar contador en pantalla
        actualizarContadorBD();
        
    } catch (error) {
        mostrarMensaje(`Error al procesar archivo: ${error.message}`, 'error');
    }
}

// ==========================================
// FUNCIONES DE BASE DE DATOS
// ==========================================
async function actualizarContadorBD() {
    try {
        await alumnosDB.init();
        const total = await alumnosDB.contarAlumnos();
        
        // Agregar contador a la interfaz si no existe
        let contador = document.getElementById('contadorBD');
        if (!contador) {
            contador = document.createElement('div');
            contador.id = 'contadorBD';
            contador.style.cssText = `
                margin: 10px 0;
                padding: 10px;
                background: linear-gradient(135deg, #003f7f, #0066cc);
                color: white;
                border-radius: 8px;
                text-align: center;
                font-weight: bold;
            `;
            
            const container = document.querySelector('.upload-section');
            container.appendChild(contador);
        }
        
        contador.innerHTML = `📊 Total en Base de Datos: ${total} alumnos`;
        
    } catch (error) {
        console.error('Error al actualizar contador BD:', error);
    }
}

async function verBaseDatos() {
    try {
        await alumnosDB.init();
        const alumnos = await alumnosDB.obtenerTodos();
        
        console.table(alumnos);
        mostrarMensaje(`📊 Base de datos contiene ${alumnos.length} alumnos. Ver consola para detalles.`, 'info');
        
    } catch (error) {
        mostrarMensaje(`Error al consultar BD: ${error.message}`, 'error');
    }
}

async function limpiarBaseDatos() {
    if (!confirm('⚠️ ¿Estás seguro de eliminar TODOS los alumnos de la base de datos?')) {
        return;
    }
    
    try {
        await alumnosDB.init();
        const transaction = alumnosDB.db.transaction(['alumnos'], 'readwrite');
        const store = transaction.objectStore('alumnos');
        await store.clear();
        
        mostrarMensaje('🗑️ Base de datos limpiada correctamente', 'success');
        actualizarContadorBD();
        
    } catch (error) {
        mostrarMensaje(`Error al limpiar BD: ${error.message}`, 'error');
    }
}

// ==========================================
// FUNCIONES DE UTILIDAD (ORIGINALES)
// ==========================================
function detectarIndices(encabezados) {
    const indices = {};
    
    for (let i = 0; i < encabezados.length; i++) {
        const header = encabezados[i];
        
        if (header.includes('matricula') || header.includes('matrícula')) {
            indices.matricula = i;
        } else if (header.includes('nombre') || header.includes('apellido')) {
            indices.nombre = i;
        } else if (header.includes('grupo') || header.includes('grado')) {
            indices.grupo = i;
        }
    }
    
    return indices;
}

function mostrarMensaje(mensaje, tipo) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo}`;
    alertDiv.style.cssText = `
        margin: 10px 0;
        padding: 15px;
        border-radius: 8px;
        font-weight: bold;
        white-space: pre-line;
        ${tipo === 'success' ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : ''}
        ${tipo === 'error' ? 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;' : ''}
        ${tipo === 'info' ? 'background: #cce7ff; color: #003f7f; border: 1px solid #99d6ff;' : ''}
    `;
    alertDiv.textContent = mensaje;
    
    const container = document.querySelector('.upload-section');
    const existingAlert = container.querySelector('.alert');
    if (existingAlert) {
        container.removeChild(existingAlert);
    }
    
    container.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

// ==========================================
// FUNCIÓN GENERAR CREDENCIALES (ORIGINAL)
// ==========================================
function generarCredenciales() {
    if (estudiantesData.length === 0) {
        mostrarMensaje('No hay datos cargados', 'error');
        return;
    }
    
    const container = document.getElementById('credencialesContainer');
    container.innerHTML = '';
    qrCodeInstances = [];
    
    let estudiantesPorPagina = 9;
    let totalPaginas = Math.ceil(estudiantesData.length / estudiantesPorPagina);
    
    for (let pagina = 0; pagina < totalPaginas; pagina++) {
        const paginaDiv = document.createElement('div');
        paginaDiv.className = 'credencial-page';
        
        const inicio = pagina * estudiantesPorPagina;
        const fin = Math.min(inicio + estudiantesPorPagina, estudiantesData.length);
        
        for (let i = inicio; i < fin; i++) {
            const estudiante = estudiantesData[i];
            const credencialDiv = crearCredencial(estudiante, i);
            paginaDiv.appendChild(credencialDiv);
        }
        
        // Rellenar espacios vacíos si es necesario
        const credencialesEnPagina = fin - inicio;
        for (let j = credencialesEnPagina; j < estudiantesPorPagina; j++) {
            const espacioVacio = document.createElement('div');
            espacioVacio.className = 'credencial-item';
            espacioVacio.style.visibility = 'hidden';
            paginaDiv.appendChild(espacioVacio);
        }
        
        container.appendChild(paginaDiv);
        
        if (pagina < totalPaginas - 1) {
            const saltoPagina = document.createElement('div');
            saltoPagina.style.pageBreakAfter = 'always';
            container.appendChild(saltoPagina);
        }
    }
    
    // Generar códigos QR después de que se rendericen los elementos
    setTimeout(() => {
        generarCodigosQR();
    }, 100);
    
    mostrarMensaje(`✅ ${estudiantesData.length} credenciales generadas en ${totalPaginas} página(s)`, 'success');
}

function crearCredencial(estudiante, index) {
    const credencialDiv = document.createElement('div');
    credencialDiv.className = 'credencial-item';
    
    credencialDiv.innerHTML = `
        <div class="credencial-header">
            <div class="logos">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZmZjNzJjIi8+Cjx0ZXh0IHg9IjIwIiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzAwMzI1NCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U0VQPC90ZXh0Pgo8L3N2Zz4K" alt="SEP" class="logo-sep">
                <div class="logo-text">
                    <div class="institucion">CETIS No. 45</div>
                    <div class="nombre-institucion">"José María Izazaga"</div>
                </div>
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMwMDNmN2YiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMlM2LjQ4IDIyIDEyIDIyIDIyIDE3LjUyIDIyIDEyUzE3LjUyIDIgMTIgMlpNMTMgMTdIMTFWMTVIMTNWMTdaTTEzIDEzSDExVjdIMTNWMTNaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+" alt="CETIS" class="logo-cetis">
            </div>
        </div>
        
        <div class="credencial-content">
            <div class="info-estudiante">
                <div class="matricula">MATRÍCULA: ${estudiante.matricula}</div>
                <div class="nombre">${estudiante.nombre}</div>
                ${estudiante.grupo ? `<div class="grupo">GRUPO: ${estudiante.grupo}</div>` : ''}
            </div>
            
            <div class="qr-container">
                <div id="qr-${index}" class="qr-code"></div>
            </div>
        </div>
        
        <div class="credencial-footer">
            <div class="ubicacion">Zihuatanejo, Guerrero</div>
            <div class="ciclo">Ciclo Escolar 2024-2025</div>
        </div>
    `;
    
    return credencialDiv;
}

function generarCodigosQR() {
    qrCodeInstances = [];
    
    estudiantesData.forEach((estudiante, index) => {
        const qrContainer = document.getElementById(`qr-${index}`);
        if (qrContainer) {
            try {
                const qrCode = new QRCode(qrContainer, {
                    text: JSON.stringify({
                        matricula: estudiante.matricula,
                        nombre: estudiante.nombre,
                        grupo: estudiante.grupo || '',
                        institucion: 'CETIS45'
                    }),
                    width: 48,
                    height: 48,
                    colorDark: '#003f7f',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.M
                });
                
                qrCodeInstances.push(qrCode);
            } catch (error) {
                console.error('Error al generar QR:', error);
            }
        }
    });
}

// ==========================================
// FUNCIONES DE DEBUG PARA BD
// ==========================================
window.verBaseDatos = verBaseDatos;
window.limpiarBaseDatos = limpiarBaseDatos;
window.actualizarContadorBD = actualizarContadorBD;

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar la base de datos
    alumnosDB.init().then(() => {
        console.log('✅ Base de datos IndexedDB inicializada');
        actualizarContadorBD();
    }).catch(error => {
        console.error('❌ Error al inicializar BD:', error);
    });
    
    // Event listeners originales
    document.getElementById('csvInput').addEventListener('change', cargarDatos);
    document.getElementById('generarBtn').addEventListener('click', generarCredenciales);
    
    // Botón para imprimir
    const imprimirBtn = document.createElement('button');
    imprimirBtn.textContent = '🖨️ Imprimir Credenciales';
    imprimirBtn.className = 'btn btn-secondary';
    imprimirBtn.style.marginLeft = '10px';
    imprimirBtn.onclick = () => window.print();
    
    const generarBtn = document.getElementById('generarBtn');
    generarBtn.parentNode.insertBefore(imprimirBtn, generarBtn.nextSibling);
    
    // Botones de debug para BD
    const debugContainer = document.createElement('div');
    debugContainer.style.cssText = 'margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;';
    debugContainer.innerHTML = `
        <h4 style="color: #003f7f; margin: 0 0 10px 0;">🔧 Herramientas Base de Datos</h4>
        <button onclick="verBaseDatos()" class="btn btn-info" style="margin: 5px;">👁️ Ver BD</button>
        <button onclick="limpiarBaseDatos()" class="btn btn-warning" style="margin: 5px;">🗑️ Limpiar BD</button>
        <button onclick="actualizarContadorBD()" class="btn btn-secondary" style="margin: 5px;">🔄 Actualizar</button>
    `;
    
    const container = document.querySelector('.container');
    container.appendChild(debugContainer);
});