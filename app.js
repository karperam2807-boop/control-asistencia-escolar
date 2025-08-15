// ================================
// SISTEMA DE CONTROL DE ASISTENCIA
// CETIS No. 45 - FIX DEFINITIVO
// ================================

// Variables globales
let stream = null;
let scanning = false;
let records = [];
let statsUpdateTimeout = null; // Para evitar múltiples actualizaciones

// Elementos del DOM
const scanButton = document.getElementById('scanButton');
const cameraContainer = document.getElementById('camera-container');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const stopScanBtn = document.getElementById('stopScanBtn');
const currentDateEl = document.getElementById('currentDate');
const totalStudentsEl = document.getElementById('totalStudents');
const totalEntriesEl = document.getElementById('totalEntries');
const totalExitsEl = document.getElementById('totalExits');
const recordsListEl = document.getElementById('recordsList');
const reportsBtn = document.getElementById('reportsBtn');
const exportBtn = document.getElementById('exportBtn');
const generatorBtn = document.getElementById('generatorBtn');
const helpBtn = document.getElementById('helpBtn');

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema CETIS 45 iniciado');
    
    // Limpiar cualquier timer previo
    if (statsUpdateTimeout) {
        clearTimeout(statsUpdateTimeout);
    }
    
    updateCurrentDate();
    loadTodaysRecords();
    updateStatsImmediate(); // Llamada inmediata sin delay
    setupEventListeners();
    showWelcomeMessage();
});

// Configurar event listeners
function setupEventListeners() {
    if (scanButton) scanButton.addEventListener('click', startQRScan);
    if (stopScanBtn) stopScanBtn.addEventListener('click', stopQRScan);
    if (reportsBtn) reportsBtn.addEventListener('click', () => window.location.href = 'reportes.html');
    if (exportBtn) exportBtn.addEventListener('click', exportData);
    if (generatorBtn) generatorBtn.addEventListener('click', () => window.location.href = 'credenciales.html');
    if (helpBtn) helpBtn.addEventListener('click', showHelpModal);
    
    console.log('✅ Event listeners configurados');
}

// Mostrar mensaje de bienvenida
function showWelcomeMessage() {
    setTimeout(() => {
        showNotification('🏫 Bienvenido al Sistema CETIS 45\n¡Listo para registrar asistencia!', 'info', 3000);
    }, 1000);
}

// Actualizar fecha actual
function updateCurrentDate() {
    if (!currentDateEl) return;
    
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    currentDateEl.textContent = now.toLocaleDateString('es-ES', options);
}

// Iniciar escaneo QR
async function startQRScan() {
    try {
        console.log('📷 Iniciando cámara...');
        
        if (typeof jsQR === 'undefined') {
            showNotification('⚠️ Error: Librería QR no cargada. Verifica tu conexión.', 'error');
            return;
        }
        
        // Mostrar indicador de carga
        scanButton.classList.add('loading');
        scanButton.textContent = '📷 Iniciando cámara...';
        
        stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'environment',
                width: { ideal: 400 },
                height: { ideal: 400 }
            }
        });
        
        video.srcObject = stream;
        cameraContainer.classList.remove('hidden');
        scanButton.style.display = 'none';
        scanning = true;
        
        // Resetear botón
        scanButton.classList.remove('loading');
        scanButton.textContent = '📱 Escanear Código QR';
        
        video.addEventListener('loadedmetadata', () => {
            startQRDetection();
            showNotification('📷 Cámara activada. Acerca el código QR', 'info', 2000);
        });
        
    } catch (error) {
        console.error('⚠️ Error accediendo a la cámara:', error);
        
        // Resetear botón
        scanButton.classList.remove('loading');
        scanButton.textContent = '📱 Escanear Código QR';
        scanButton.style.display = 'inline-block';
        
        let message = '⚠️ Error de cámara: ';
        if (error.name === 'NotAllowedError') {
            message += 'Permiso denegado. Permite el acceso a la cámara y recarga la página.';
        } else if (error.name === 'NotFoundError') {
            message += 'No se encontró cámara. Verifica que tu dispositivo tenga cámara.';
        } else {
            message += error.message;
        }
        
        showNotification(message, 'error');
    }
}

// Detener escaneo QR
function stopQRScan() {
    console.log('🛑 Deteniendo cámara...');
    
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    cameraContainer.classList.add('hidden');
    scanButton.style.display = 'inline-block';
    scanning = false;
    
    showNotification('📷 Cámara desactivada', 'info', 1500);
}

// Detección continua de códigos QR
function startQRDetection() {
    const context = canvas.getContext('2d');
    
    function tick() {
        if (video.readyState === video.HAVE_ENOUGH_DATA && scanning) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (qrCode) {
                console.log('📱 QR detectado:', qrCode.data);
                processQRCode(qrCode.data);
                stopQRScan();
                return;
            }
        }
        
        if (scanning) {
            requestAnimationFrame(tick);
        }
    }
    
    tick();
}

// Procesar código QR escaneado
function processQRCode(qrData) {
    try {
        console.log('🔍 Procesando QR:', qrData);
        
        let studentData;
        
        try {
            studentData = JSON.parse(qrData);
            console.log('✅ QR parseado como JSON:', studentData);
        } catch (jsonError) {
            console.log('⚠️ QR no es JSON válido, creando objeto simple');
            studentData = {
                matricula: qrData.substring(0, 20),
                nombre: 'Estudiante ' + qrData.substring(0, 10),
                grado: 'N/A',
                grupo: 'N/A'
            };
        }
        
        if (!studentData.matricula || !studentData.nombre) {
            throw new Error('Datos incompletos en el código QR');
        }
        
        studentData = {
            matricula: String(studentData.matricula || 'SIN_MATRICULA'),
            nombre: String(studentData.nombre || 'SIN_NOMBRE'),
            grado: String(studentData.grado || '1'),
            grupo: String(studentData.grupo || 'A')
        };
        
        console.log('📋 Datos del estudiante procesados:', studentData);
        registerAttendance(studentData);
        
    } catch (error) {
        console.error('⚠️ Error procesando QR:', error);
        showNotification('⚠️ Código QR inválido.\n\nFormato esperado: JSON con matrícula, nombre, grado y grupo.', 'error');
    }
}

// Registrar asistencia
function registerAttendance(studentData) {
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('es-ES', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    let existingRecord = records.find(record => 
        record.matricula === studentData.matricula && 
        record.fecha === today
    );
    
    let message = '';
    let messageType = 'success';
    
    if (existingRecord) {
        if (existingRecord.horaSalida) {
            const newRecord = {
                id: Date.now(),
                matricula: studentData.matricula,
                nombre: studentData.nombre,
                grado: studentData.grado,
                grupo: studentData.grupo,
                fecha: today,
                horaEntrada: currentTime,
                horaSalida: null
            };
            records.push(newRecord);
            message = `🔄 Nueva entrada registrada para ${studentData.nombre}\nHora: ${currentTime}`;
        } else {
            existingRecord.horaSalida = currentTime;
            message = `🚪 Salida registrada para ${studentData.nombre}\nHora: ${currentTime}`;
        }
    } else {
        const newRecord = {
            id: Date.now(),
            matricula: studentData.matricula,
            nombre: studentData.nombre,
            grado: studentData.grado,
            grupo: studentData.grupo,
            fecha: today,
            horaEntrada: currentTime,
            horaSalida: null
        };
        records.push(newRecord);
        message = `🎉 Entrada registrada para ${studentData.nombre}\nHora: ${currentTime}`;
    }
    
    // Guardar y actualizar inmediatamente
    saveRecords();
    updateStatsImmediate();
    displayTodaysRecords();
    showNotification(message, messageType);
    
    console.log('💾 Registro guardado:', { studentData, currentTime });
}

// Cargar registros del día
function loadTodaysRecords() {
    const savedRecords = localStorage.getItem('attendanceRecords');
    if (savedRecords) {
        try {
            records = JSON.parse(savedRecords);
            console.log('📚 Registros cargados:', records.length);
        } catch (error) {
            console.error('⚠️ Error cargando registros:', error);
            records = [];
        }
    }
    displayTodaysRecords();
}

// Guardar registros
function saveRecords() {
    try {
        localStorage.setItem('attendanceRecords', JSON.stringify(records));
        console.log('💾 Registros guardados exitosamente');
    } catch (error) {
        console.error('⚠️ Error guardando registros:', error);
        showNotification('⚠️ Error al guardar datos. Verifica el espacio de almacenamiento.', 'warning');
    }
}

// Mostrar registros del día
function displayTodaysRecords() {
    if (!recordsListEl) return;
    
    const today = new Date().toISOString().split('T')[0];
    const todaysRecords = records.filter(record => record.fecha === today);
    
    if (todaysRecords.length === 0) {
        recordsListEl.innerHTML = `
            <div class="no-records">
                <strong>📱 ¡Listo para escanear!</strong><br>
                No hay registros aún. Escanea el primer código QR para comenzar.<br>
                <small style="color: #8b1538; margin-top: 10px; display: block;">#OrgullosamenteCETIS45</small>
            </div>
        `;
        return;
    }
    
    // Ordenar por hora de entrada más reciente
    todaysRecords.sort((a, b) => {
        if (a.horaEntrada && b.horaEntrada) {
            return b.horaEntrada.localeCompare(a.horaEntrada);
        }
        return 0;
    });
    
    recordsListEl.innerHTML = todaysRecords.map(record => `
        <div class="record-item">
            <div class="student-name">${record.nombre || 'Sin nombre'}</div>
            <div class="student-info">
                📝 Matrícula: ${record.matricula || 'Sin matrícula'} | 
                🎓 ${record.grado || 'N/A'}° ${record.grupo || 'N/A'}
            </div>
            <div class="record-times">
                ${record.horaEntrada ? `<span class="time-badge entry-time">🟢 Entrada: ${record.horaEntrada}</span>` : ''}
                ${record.horaSalida ? `<span class="time-badge exit-time">🔴 Salida: ${record.horaSalida}</span>` : ''}
                ${!record.horaSalida && record.horaEntrada ? `<span class="time-badge" style="background: #fff3cd; color: #856404; border: 2px solid #ffc107;">⏱️ En plantel</span>` : ''}
            </div>
        </div>
    `).join('');
}

// FUNCIÓN DE ESTADÍSTICAS CORREGIDA - SIN ANIMACIONES
function updateStatsImmediate() {
    // Cancelar cualquier update pendiente
    if (statsUpdateTimeout) {
        clearTimeout(statsUpdateTimeout);
        statsUpdateTimeout = null;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const todaysRecords = records.filter(record => record.fecha === today);
    
    // Calcular estadísticas
    const uniqueStudents = new Set(todaysRecords.map(record => record.matricula)).size;
    const entriesCount = todaysRecords.filter(record => record.horaEntrada).length;
    const exitsCount = todaysRecords.filter(record => record.horaSalida).length;
    
    console.log('📊 Calculando estadísticas:', {
        registros_hoy: todaysRecords.length,
        estudiantes_unicos: uniqueStudents,
        entradas: entriesCount,
        salidas: exitsCount
    });
    
    // Actualizar DOM inmediatamente sin animaciones
    if (totalStudentsEl) {
        totalStudentsEl.textContent = uniqueStudents.toString();
    }
    if (totalEntriesEl) {
        totalEntriesEl.textContent = entriesCount.toString();
    }
    if (totalExitsEl) {
        totalExitsEl.textContent = exitsCount.toString();
    }
    
    console.log('✅ Estadísticas actualizadas correctamente');
}

// Exportar datos
function exportData() {
    if (records.length === 0) {
        showNotification('⚠️ No hay datos para exportar', 'warning');
        return;
    }
    
    try {
        const csvContent = generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `asistencia_cetis45_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification('📊 Archivo CSV descargado exitosamente', 'success');
        }
    } catch (error) {
        console.error('Error exportando datos:', error);
        showNotification('⚠️ Error al exportar datos', 'error');
    }
}

// Generar CSV
function generateCSV() {
    const headers = ['Fecha', 'Matrícula', 'Nombre', 'Grado', 'Grupo', 'Hora Entrada', 'Hora Salida', 'Estado'];
    const csvRows = [headers.join(',')];
    
    records.forEach(record => {
        const estado = record.horaEntrada && record.horaSalida ? 'Completo' : 
                     record.horaEntrada ? 'Solo entrada' : 'Sin registro';
        
        const row = [
            record.fecha || '',
            record.matricula || '',
            `"${record.nombre || ''}"`,
            record.grado || '',
            record.grupo || '',
            record.horaEntrada || '',
            record.horaSalida || '',
            estado
        ];
        csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
}

// Función de ayuda mejorada
function showHelpModal() {
    const helpContent = `
🏫 SISTEMA DE CONTROL DE ASISTENCIA
   CETIS No. 45

📱 CÓMO USAR:
1. Presiona "Escanear Código QR"
2. Permite acceso a la cámara
3. Acerca el código del estudiante
4. Primera lectura = ENTRADA ✅
5. Segunda lectura = SALIDA ❌

🎫 GENERAR CÓDIGOS QR:
• Individual: Un estudiante a la vez
• Masivo: Lista completa en CSV
• Credenciales profesionales para imprimir

📊 REPORTES DISPONIBLES:
• Estadísticas diarias en tiempo real
• Filtros por fecha específica
• Exportación a Excel/PDF

💡 CONSEJOS IMPORTANTES:
• Mantén buena iluminación para escanear
• Los datos se guardan automáticamente
• Funciona sin internet después de cargar
• Usa códigos QR generados por el sistema

🔧 SOPORTE TÉCNICO:
• Dirección del CETIS No. 45
• Departamento de Sistemas
• #OrgullosamenteCETIS45

📱 FORMATO DE CÓDIGO QR:
{"matricula":"123","nombre":"Juan Pérez","grado":"1","grupo":"A"}
    `;
    
    showNotification(helpContent, 'info', 10000);
}

// Mostrar notificación mejorada
function showNotification(message, type = 'success', duration = 4000) {
    // Remover notificaciones anteriores
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    let bgColor, borderColor, icon;
    switch(type) {
        case 'error':
            bgColor = 'linear-gradient(135deg, #dc3545, #c82333)';
            borderColor = '#721c24';
            icon = '❌';
            break;
        case 'warning':
            bgColor = 'linear-gradient(135deg, #ffc107, #e0a800)';
            borderColor = '#856404';
            icon = '⚠️';
            break;
        case 'info':
            bgColor = 'linear-gradient(135deg, #17a2b8, #138496)';
            borderColor = '#0c5460';
            icon = 'ℹ️';
            break;
        default:
            bgColor = 'linear-gradient(135deg, #28a745, #20c997)';
            borderColor = '#155724';
            icon = '✅';
    }
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 15px 20px;
        border-radius: 12px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        z-index: 1000;
        font-weight: 500;
        border: 3px solid ${borderColor};
        animation: slideIn 0.3s ease;
        max-width: 350px;
        white-space: pre-line;
        font-family: 'Segoe UI', sans-serif;
        line-height: 1.4;
    `;
    
    notification.innerHTML = `<strong>${icon}</strong> ${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
}

// Función para limpiar datos corruptos
function clearCorruptedData() {
    localStorage.removeItem('attendanceRecords');
    records = [];
    updateStatsImmediate();
    displayTodaysRecords();
    showNotification('🧹 Datos limpiados. Sistema reiniciado.', 'info');
    console.log('🧹 Datos del localStorage limpiados');
}

// Función de debugging
function debugStats() {
    console.log('🔍 DEBUG - Estado actual:');
    console.log('Records totales:', records.length);
    
    const today = new Date().toISOString().split('T')[0];
    const todaysRecords = records.filter(record => record.fecha === today);
    console.log('Records de hoy:', todaysRecords.length);
    
    const uniqueStudents = new Set(todaysRecords.map(record => record.matricula)).size;
    const entriesCount = todaysRecords.filter(record => record.horaEntrada).length;
    const exitsCount = todaysRecords.filter(record => record.horaSalida).length;
    
    console.log('Estadísticas calculadas:');
    console.log('- Estudiantes únicos:', uniqueStudents);
    console.log('- Entradas:', entriesCount);
    console.log('- Salidas:', exitsCount);
    
    console.log('Valores en DOM:');
    console.log('- Estudiantes DOM:', totalStudentsEl?.textContent);
    console.log('- Entradas DOM:', totalEntriesEl?.textContent);
    console.log('- Salidas DOM:', totalExitsEl?.textContent);
}

// Exponer funciones de utilidad para debugging
window.clearCorruptedData = clearCorruptedData;
window.debugStats = debugStats;
window.updateStatsImmediate = updateStatsImmediate;

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .loading {
        position: relative;
        pointer-events: none;
        opacity: 0.7;
    }
    
    .loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid #d4af37;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Log de inicio completo
console.log('✅ Sistema CETIS 45 cargado completamente - FIX DEFINITIVO');
console.log('📊 Funcionalidades disponibles:');
console.log('  - Escaneo de códigos QR');
console.log('  - Registro de entrada/salida');
console.log('  - Estadísticas en tiempo real (SIN ANIMACIONES)');
console.log('  - Exportación de datos');
console.log('  - Generación de reportes');
console.log('🔧 Funciones de debugging:');
console.log('  - clearCorruptedData() - Limpiar datos');
console.log('  - debugStats() - Ver estado actual');
console.log('  - updateStatsImmediate() - Forzar actualización');
console.log('🏫 #OrgullosamenteCETIS45');