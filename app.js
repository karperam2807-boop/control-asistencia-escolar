// Variables globales
let stream = null;
let scanning = false;
let records = [];

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

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Aplicación iniciada');
    updateCurrentDate();
    loadTodaysRecords();
    updateStats();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    scanButton.addEventListener('click', startQRScan);
    stopScanBtn.addEventListener('click', stopQRScan);
    reportsBtn.addEventListener('click', showReports);
    exportBtn.addEventListener('click', exportData);
}

// Actualizar fecha actual
function updateCurrentDate() {
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
        
        // Solicitar acceso a la cámara
        stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'environment', // Cámara trasera preferida
                width: { ideal: 400 },
                height: { ideal: 400 }
            }
        });
        
        video.srcObject = stream;
        cameraContainer.classList.remove('hidden');
        scanButton.style.display = 'none';
        scanning = true;
        
        // Iniciar detección QR
        video.addEventListener('loadedmetadata', () => {
            startQRDetection();
        });
        
    } catch (error) {
        console.error('❌ Error accediendo a la cámara:', error);
        alert('No se pudo acceder a la cámara. Verifica los permisos.');
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
        
        // Intentar parsear como JSON
        let studentData;
        try {
            studentData = JSON.parse(qrData);
        } catch (e) {
            // Si no es JSON, crear objeto simple
            studentData = {
                matricula: qrData,
                nombre: 'Estudiante ' + qrData,
                grado: 'N/A',
                grupo: 'N/A'
            };
        }
        
        // Validar datos mínimos
        if (!studentData.matricula || !studentData.nombre) {
            throw new Error('Datos incompletos en el código QR');
        }
        
        // Registrar asistencia
        registerAttendance(studentData);
        
    } catch (error) {
        console.error('❌ Error procesando QR:', error);
        alert('Código QR inválido. Formato esperado:\n{"matricula":"123","nombre":"Juan Pérez","grado":"3","grupo":"A"}');
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
    
    // Buscar registro existente para hoy
    let existingRecord = records.find(record => 
        record.matricula === studentData.matricula && 
        record.fecha === today
    );
    
    let message = '';
    
    if (existingRecord) {
        // Ya existe registro
        if (existingRecord.horaSalida) {
            // Ya tiene entrada y salida, crear nueva entrada
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
            message = `✅ Nueva entrada registrada para ${studentData.nombre}`;
        } else {
            // Solo tiene entrada, registrar salida
            existingRecord.horaSalida = currentTime;
            message = `🚪 Salida registrada para ${studentData.nombre}`;
        }
    } else {
        // Primer registro del día
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
        message = `🎉 Entrada registrada para ${studentData.nombre}`;
    }
    
    // Guardar en localStorage
    saveRecords();
    
    // Actualizar interfaz
    updateStats();
    displayTodaysRecords();
    
    // Mostrar mensaje
    showNotification(message);
    
    console.log('💾 Registro guardado:', { studentData, currentTime });
}

// Mostrar notificación
function showNotification(message) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
        font-weight: 500;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Cargar registros del día
function loadTodaysRecords() {
    const savedRecords = localStorage.getItem('attendanceRecords');
    if (savedRecords) {
        records = JSON.parse(savedRecords);
        console.log('📚 Registros cargados:', records.length);
    }
    displayTodaysRecords();
}

// Guardar registros
function saveRecords() {
    localStorage.setItem('attendanceRecords', JSON.stringify(records));
    console.log('💾 Registros guardados');
}

// Mostrar registros del día
function displayTodaysRecords() {
    const today = new Date().toISOString().split('T')[0];
    const todaysRecords = records.filter(record => record.fecha === today);
    
    if (todaysRecords.length === 0) {
        recordsListEl.innerHTML = `
            <div class="no-records">
                No hay registros aún. ¡Escanea el primer código QR!
            </div>
        `;
        return;
    }
    
    recordsListEl.innerHTML = todaysRecords.map(record => `
        <div class="record-item">
            <div class="record-header">
                <div class="student-name">${record.nombre}</div>
            </div>
            <div class="student-info">
                Matrícula: ${record.matricula} | ${record.grado}° ${record.grupo}
            </div>
            <div class="record-times">
                ${record.horaEntrada ? `<span class="time-badge entry-time">Entrada: ${record.horaEntrada}</span>` : ''}
                ${record.horaSalida ? `<span class="time-badge exit-time">Salida: ${record.horaSalida}</span>` : ''}
            </div>
        </div>
    `).join('');
}

// Actualizar estadísticas
function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const todaysRecords = records.filter(record => record.fecha === today);
    
    // Contar estudiantes únicos
    const uniqueStudents = new Set(todaysRecords.map(record => record.matricula)).size;
    
    // Contar entradas y salidas
    const entriesCount = todaysRecords.filter(record => record.horaEntrada).length;
    const exitsCount = todaysRecords.filter(record => record.horaSalida).length;
    
    // Actualizar DOM
    totalStudentsEl.textContent = uniqueStudents;
    totalEntriesEl.textContent = entriesCount;
    totalExitsEl.textContent = exitsCount;
}

// Mostrar reportes (función básica)
function showReports() {
    alert('📊 Función de reportes en desarrollo.\n\nDatos disponibles:\n- Total registros: ' + records.length + '\n- Fechas con registros: ' + getUniqueDates().length);
}

// Exportar datos
function exportData() {
    if (records.length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    // Crear CSV
    const csvContent = generateCSV();
    
    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `asistencia_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('📁 Archivo CSV descargado');
    }
}

// Generar CSV
function generateCSV() {
    const headers = ['Fecha', 'Matrícula', 'Nombre', 'Grado', 'Grupo', 'Hora Entrada', 'Hora Salida'];
    const csvRows = [headers.join(',')];
    
    records.forEach(record => {
        const row = [
            record.fecha,
            record.matricula,
            `"${record.nombre}"`,
            record.grado,
            record.grupo,
            record.horaEntrada || '',
            record.horaSalida || ''
        ];
        csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
}

// Obtener fechas únicas
function getUniqueDates() {
    return [...new Set(records.map(record => record.fecha))];
}

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
`;
document.head.appendChild(style);

console.log('✅ App.js cargado completamente');