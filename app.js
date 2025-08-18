// ================================
// SISTEMA DE CONTROL DE ASISTENCIA
// CETIS No. 45 - CON CONTROL DE RETARDOS
// ================================

// Variables globales
let stream = null;
let scanning = false;
let records = [];
let statsUpdateTimeout = null;

// Configuración de horarios y tolerancias - CETIS No. 45
const HORARIOS_CONFIG = {
    HORA_ENTRADA_OFICIAL: "07:00:00",
    HORA_SALIDA_OFICIAL: "14:00:00",
    TOLERANCIA_MINUTOS: 10,
    MAX_RETARDOS_SEMANA: 3,
    TURNOS: {
        matutino: { entrada: "07:00:00", salida: "14:00:00", tolerancia: 10 },
        vespertino: { entrada: "14:00:00", salida: "20:00:00", tolerancia: 10 }
    }
};

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
    console.log('🚀 Sistema CETIS 45 iniciado - CON CONTROL DE RETARDOS');
    
    if (statsUpdateTimeout) {
        clearTimeout(statsUpdateTimeout);
    }
    
    updateCurrentDate();
    loadTodaysRecords();
    updateStatsImmediate();
    setupEventListeners();
    showWelcomeMessage();
    insertRetardosStyles();
});

// Insertar estilos CSS para retardos
function insertRetardosStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 5px 5px 5px 0;
            border: 2px solid;
            transition: all 0.3s ease;
        }

        .status-badge:hover {
            transform: scale(1.05);
        }

        .status-badge.warning {
            background: linear-gradient(135deg, #ff8c00, #ff7700);
            color: white;
            border-color: #cc5500;
            box-shadow: 0 3px 10px rgba(255, 140, 0, 0.3);
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }

        .status-badge.critical {
            background: linear-gradient(135deg, #dc3545, #c82333);
            color: white;
            border-color: #721c24;
            box-shadow: 0 3px 10px rgba(220, 53, 69, 0.4);
            animation: pulse-critical 2s infinite;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }

        .record-item.record-warning {
            border-left: 5px solid #ff8c00;
            background: linear-gradient(135deg, rgba(255, 140, 0, 0.1), rgba(255, 119, 0, 0.05));
            box-shadow: 0 3px 15px rgba(255, 140, 0, 0.2);
        }

        .record-item.record-critical {
            border-left: 5px solid #dc3545;
            background: linear-gradient(135deg, rgba(220, 53, 69, 0.15), rgba(200, 35, 51, 0.1));
            box-shadow: 0 5px 20px rgba(220, 53, 69, 0.2);
            position: relative;
        }

        .record-item.record-critical::before {
            content: '🚨';
            position: absolute;
            top: 10px;
            right: 15px;
            font-size: 1.5em;
            animation: pulse-icon 1.5s infinite;
        }

        @keyframes pulse-critical {
            0%, 100% { 
                box-shadow: 0 3px 10px rgba(220, 53, 69, 0.4);
                transform: scale(1);
            }
            50% { 
                box-shadow: 0 5px 15px rgba(220, 53, 69, 0.6);
                transform: scale(1.02);
            }
        }

        @keyframes pulse-icon {
            0%, 100% { 
                opacity: 1;
                transform: scale(1);
            }
            50% { 
                opacity: 0.7;
                transform: scale(1.1);
            }
        }

        .notification {
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .notification:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .notification::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
            transition: left 0.6s;
        }

        .notification:hover::before {
            left: 100%;
        }

        .retardo-alert {
            background: linear-gradient(135deg, #ff6b35, #f7931e);
            border: 3px solid #cc5500;
            border-radius: 15px;
            padding: 15px;
            margin: 10px 0;
            color: white;
            font-weight: 600;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
            animation: shake 0.5s ease-in-out;
            box-shadow: 0 5px 20px rgba(255, 107, 53, 0.3);
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }

        .contador-retardos {
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, #ff8c00, #ff7700);
            color: white;
            padding: 10px 15px;
            border-radius: 25px;
            font-weight: 700;
            font-size: 0.9em;
            border: 2px solid #cc5500;
            box-shadow: 0 4px 15px rgba(255, 140, 0, 0.4);
            z-index: 999;
            display: none;
            animation: bounce 2s infinite;
        }

        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-5px); }
            60% { transform: translateY(-3px); }
        }
    `;
    document.head.appendChild(style);
}

// Configurar event listeners
function setupEventListeners() {
    if (scanButton) scanButton.addEventListener('click', startQRScan);
    if (stopScanBtn) stopScanBtn.addEventListener('click', stopQRScan);
    if (reportsBtn) reportsBtn.addEventListener('click', () => window.location.href = 'reportes.html');
    if (exportBtn) exportBtn.addEventListener('click', exportData);
    if (generatorBtn) generatorBtn.addEventListener('click', () => window.location.href = 'generador.html');
    if (helpBtn) helpBtn.addEventListener('click', showHelpModal);
    
    // Botón nuevo para reportes de retardos
    const retardosBtn = document.createElement('button');
    retardosBtn.textContent = '🚨 Reporte Retardos';
    retardosBtn.className = 'nav-btn retardo-btn';
    retardosBtn.onclick = mostrarReporteRetardos;
    
    const navButtons = document.querySelector('.nav-buttons');
    if (navButtons) {
        navButtons.appendChild(retardosBtn);
    }

    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
    adminBtn.addEventListener('click', () => {
        console.log('🔧 Accediendo al panel de administración...');
        window.location.href = 'admin.html';
    });
}
    
    console.log('✅ Event listeners configurados');
}

// Mostrar mensaje de bienvenida
function showWelcomeMessage() {
    setTimeout(() => {
        showNotification('🏫 Sistema CETIS 45 con Control de Retardos\n⏰ Tolerancia: 10 minutos\n🚨 Límite semanal: 3 retardos\n📅 Horario: 7:00 AM - 2:00 PM\n¡Listo para registrar asistencia!', 'info', 4000);
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
        
        scanButton.classList.remove('loading');
        scanButton.textContent = '📱 Escanear Código QR';
        
        video.addEventListener('loadedmetadata', () => {
            startQRDetection();
            showNotification('📷 Cámara activada. Acerca el código QR', 'info', 2000);
        });
        
    } catch (error) {
        console.error('⚠️ Error accediendo a la cámara:', error);
        
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
                processQRCodeWithRetardos(qrCode.data);
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

// ===== FUNCIONES DE CONTROL DE RETARDOS =====

// Función para calcular si hay retardo
function calcularRetardo(horaEntrada, turno = 'matutino') {
    const config = HORARIOS_CONFIG.TURNOS[turno];
    const horaOficial = config.entrada;
    const tolerancia = config.tolerancia;
    
    const hoy = new Date().toISOString().split('T')[0];
    const entradaDate = new Date(`${hoy}T${horaEntrada}`);
    const oficialDate = new Date(`${hoy}T${horaOficial}`);
    const limiteToleranciDate = new Date(oficialDate.getTime() + tolerancia * 60000);
    
    const minutosRetardo = Math.max(0, Math.floor((entradaDate - oficialDate) / 60000));
    const excedeTolerancias = entradaDate > limiteToleranciDate;
    
    return {
        esRetardo: minutosRetardo > 0,
        excedeTolerancias,
        minutosRetardo,
        horaLimite: limiteToleranciDate.toLocaleTimeString('es-ES', { hour12: false })
    };
}

// Función para obtener retardos de la semana
function obtenerRetardosSemana(matricula) {
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    inicioSemana.setHours(0, 0, 0, 0);
    
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);
    
    const todosRegistros = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    
    const registrosSemana = todosRegistros.filter(record => {
        const fechaRecord = new Date(record.fecha + 'T00:00:00');
        return record.matricula === matricula && 
               fechaRecord >= inicioSemana && 
               fechaRecord <= finSemana &&
               record.horaEntrada;
    });
    
    let retardos = 0;
    const detallesRetardos = [];
    
    registrosSemana.forEach(record => {
        const infoRetardo = calcularRetardo(record.horaEntrada);
        if (infoRetardo.excedeTolerancias) {
            retardos++;
            detallesRetardos.push({
                fecha: record.fecha,
                hora: record.horaEntrada,
                minutosRetardo: infoRetardo.minutosRetardo
            });
        }
    });
    
    return {
        totalRetardos: retardos,
        detalles: detallesRetardos,
        excedeLimite: retardos >= HORARIOS_CONFIG.MAX_RETARDOS_SEMANA,
        restantes: Math.max(0, HORARIOS_CONFIG.MAX_RETARDOS_SEMANA - retardos)
    };
}

// Procesar código QR con control de retardos
function processQRCodeWithRetardos(qrData) {
    try {
        console.log('🔍 Procesando QR con control de retardos:', qrData);
        
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
        registerAttendanceWithRetardos(studentData);
        
    } catch (error) {
        console.error('⚠️ Error procesando QR:', error);
        showNotification('⚠️ Código QR inválido.\n\nFormato esperado: JSON con matrícula, nombre, grado y grupo.', 'error');
    }
}

// Registrar asistencia con control de retardos
function registerAttendanceWithRetardos(studentData) {
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
    let isEntrada = false;
    
    if (existingRecord) {
        if (existingRecord.horaSalida) {
            // Nueva entrada
            isEntrada = true;
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
        } else {
            // Registrar salida
            existingRecord.horaSalida = currentTime;
            message = `🚪 Salida registrada para ${studentData.nombre}\nHora: ${currentTime}`;
        }
    } else {
        // Primera entrada del día
        isEntrada = true;
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
    }
    
    // Si es entrada, verificar retardos
    if (isEntrada) {
        const infoRetardo = calcularRetardo(currentTime);
        const retardosSemana = obtenerRetardosSemana(studentData.matricula);
        
        if (infoRetardo.excedeTolerancias) {
            // RETARDO DETECTADO
            messageType = 'warning';
            
            // Guardar el retardo en el registro
            const recordToUpdate = records[records.length - 1];
            recordToUpdate.esRetardo = true;
            recordToUpdate.minutosRetardo = infoRetardo.minutosRetardo;
            
            // Verificar si excede el límite semanal
            if (retardosSemana.excedeLimite) {
                // LÍMITE SEMANAL EXCEDIDO
                messageType = 'error';
                message = `🚨 LÍMITE DE RETARDOS EXCEDIDO 🚨\n` +
                         `👤 ${studentData.nombre}\n` +
                         `⏰ Llegada: ${currentTime} (${infoRetardo.minutosRetardo} min tarde)\n` +
                         `📊 Retardos esta semana: ${retardosSemana.totalRetardos + 1}/${HORARIOS_CONFIG.MAX_RETARDOS_SEMANA}\n` +
                         `⚠️ REPORTAR A COORDINACIÓN ACADÉMICA\n` +
                         `📋 Aplicar sanción correspondiente`;
                         
                // Guardar alerta especial
                recordToUpdate.alertaEspecial = 'LIMITE_RETARDOS_EXCEDIDO';
                recordToUpdate.retardosSemana = retardosSemana.totalRetardos + 1;
                
            } else {
                // RETARDO NORMAL
                message = `⚠️ RETARDO DETECTADO ⚠️\n` +
                         `👤 ${studentData.nombre}\n` +
                         `⏰ Llegada: ${currentTime}\n` +
                         `📏 Retardo: ${infoRetardo.minutosRetardo} minutos\n` +
                         `📊 Retardos esta semana: ${retardosSemana.totalRetardos + 1}/${HORARIOS_CONFIG.MAX_RETARDOS_SEMANA}\n` +
                         `⚡ Restantes: ${retardosSemana.restantes - 1}`;
                         
                if (retardosSemana.restantes <= 1) {
                    message += `\n🔥 ¡ÚLTIMA OPORTUNIDAD!`;
                    messageType = 'error';
                }
            }
        } else if (infoRetardo.esRetardo) {
            // DENTRO DE TOLERANCIA
            messageType = 'info';
            message = `⏱️ Entrada dentro de tolerancia\n` +
                     `👤 ${studentData.nombre}\n` +
                     `⏰ Llegada: ${currentTime}\n` +
                     `📏 ${infoRetardo.minutosRetardo} min después de las 7:00\n` +
                     `✅ Dentro del límite de ${HORARIOS_CONFIG.TOLERANCIA_MINUTOS} minutos`;
        } else {
            // ENTRADA PUNTUAL
            message = `🎉 Entrada puntual registrada\n` +
                     `👤 ${studentData.nombre}\n` +
                     `⏰ Hora: ${currentTime}\n` +
                     `✅ ¡Excelente puntualidad!`;
        }
    }
    
    // Guardar y actualizar
    saveRecords();
    updateStatsImmediate();
    displayTodaysRecordsWithRetardos();
    showNotification(message, messageType, isEntrada && infoRetardo.excedeTolerancias ? 8000 : 4000);
    
    console.log('💾 Registro guardado:', { studentData, currentTime, retardo: infoRetardo });
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
    displayTodaysRecordsWithRetardos();
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

// Mostrar registros con indicadores de retardo
function displayTodaysRecordsWithRetardos() {
    if (!recordsListEl) return;
    
    const today = new Date().toISOString().split('T')[0];
    const todaysRecords = records.filter(record => record.fecha === today);
    
    if (todaysRecords.length === 0) {
        recordsListEl.innerHTML = `
            <div class="no-records">
                <strong>📱 ¡Listo para escanear!</strong><br>
                No hay registros aún. Escanea el primer código QR para comenzar.<br>
                <small style="color: #8b1538; margin-top: 10px; display: block;">
                    🚨 Control de retardos automático activado<br>
                    #OrgullosamenteCETIS45
                </small>
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
    
    recordsListEl.innerHTML = todaysRecords.map(record => {
        let statusBadges = '';
        let recordClass = 'record-item';
        
        // Indicadores de retardo
        if (record.esRetardo) {
            if (record.alertaEspecial === 'LIMITE_RETARDOS_EXCEDIDO') {
                statusBadges += `<span class="status-badge critical">🚨 LÍMITE EXCEDIDO (${record.retardosSemana}/${HORARIOS_CONFIG.MAX_RETARDOS_SEMANA})</span>`;
                recordClass += ' record-critical';
            } else {
                statusBadges += `<span class="status-badge warning">⚠️ RETARDO: ${record.minutosRetardo} min</span>`;
                recordClass += ' record-warning';
            }
        }
        
        return `
            <div class="${recordClass}">
                <div class="student-name">${record.nombre || 'Sin nombre'}</div>
                <div class="student-info">
                    📛 Matrícula: ${record.matricula || 'Sin matrícula'} | 
                    🎓 ${record.grado || 'N/A'}° ${record.grupo || 'N/A'}
                </div>
                ${statusBadges}
                <div class="record-times">
                    ${record.horaEntrada ? `<span class="time-badge entry-time">🟢 Entrada: ${record.horaEntrada}</span>` : ''}
                    ${record.horaSalida ? `<span class="time-badge exit-time">🔴 Salida: ${record.horaSalida}</span>` : ''}
                    ${!record.horaSalida && record.horaEntrada ? `<span class="time-badge" style="background: #fff3cd; color: #856404; border: 2px solid #ffc107;">⏱️ En plantel</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Actualizar estadísticas sin animaciones
function updateStatsImmediate() {
    if (statsUpdateTimeout) {
        clearTimeout(statsUpdateTimeout);
        statsUpdateTimeout = null;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const todaysRecords = records.filter(record => record.fecha === today);
    
    const uniqueStudents = new Set(todaysRecords.map(record => record.matricula)).size;
    const entriesCount = todaysRecords.filter(record => record.horaEntrada).length;
    const exitsCount = todaysRecords.filter(record => record.horaSalida).length;
    
    console.log('📊 Calculando estadísticas:', {
        registros_hoy: todaysRecords.length,
        estudiantes_unicos: uniqueStudents,
        entradas: entriesCount,
        salidas: exitsCount
    });
    
    if (totalStudentsEl) totalStudentsEl.textContent = uniqueStudents.toString();
    if (totalEntriesEl) totalEntriesEl.textContent = entriesCount.toString();
    if (totalExitsEl) totalExitsEl.textContent = exitsCount.toString();
    
    // Actualizar estadísticas de retardos si existe el elemento
    const totalRetardosEl = document.getElementById('totalRetardos');
    if (totalRetardosEl) {
        const retardosHoy = todaysRecords.filter(record => record.esRetardo === true).length;
        totalRetardosEl.textContent = retardosHoy.toString();
        
        // Cambiar color según cantidad de retardos
        const statCard = totalRetardosEl.closest('.stat-card');
        if (statCard) {
            if (retardosHoy === 0) {
                statCard.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
            } else if (retardosHoy <= 3) {
                statCard.style.background = 'linear-gradient(135deg, #ffc107, #e0a800)';
            } else {
                statCard.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
            }
        }
    }
    
    console.log('✅ Estadísticas actualizadas correctamente');
}

// Generar reporte de retardos
function generarReporteRetardos() {
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    inicioSemana.setHours(0, 0, 0, 0);
    
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);
    
    const todosRegistros = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    
    const retardosSemana = todosRegistros.filter(record => {
        const fechaRecord = new Date(record.fecha + 'T00:00:00');
        return fechaRecord >= inicioSemana && 
               fechaRecord <= finSemana &&
               record.esRetardo === true;
    });
    
    const retardosPorEstudiante = {};
    retardosSemana.forEach(record => {
        if (!retardosPorEstudiante[record.matricula]) {
            retardosPorEstudiante[record.matricula] = {
                nombre: record.nombre,
                grado: record.grado,
                grupo: record.grupo,
                retardos: []
            };
        }
        retardosPorEstudiante[record.matricula].retardos.push({
            fecha: record.fecha,
            hora: record.horaEntrada,
            minutos: record.minutosRetardo
        });
    });
    
    let reporte = `📊 REPORTE DE RETARDOS - SEMANA ACTUAL\n`;
    reporte += `🏫 CETIS No. 45 "José María Izazaga"\n`;
    reporte += `📅 ${inicioSemana.toLocaleDateString('es-ES')} - ${finSemana.toLocaleDateString('es-ES')}\n\n`;
    
    const estudiantesConRetardos = Object.keys(retardosPorEstudiante);
    
    if (estudiantesConRetardos.length === 0) {
        reporte += `✅ ¡EXCELENTE! No hay retardos registrados esta semana.\n`;
    } else {
        reporte += `⚠️ ESTUDIANTES CON RETARDOS: ${estudiantesConRetardos.length}\n\n`;
        
        estudiantesConRetardos.forEach(matricula => {
            const estudiante = retardosPorEstudiante[matricula];
            const totalRetardos = estudiante.retardos.length;
            
            reporte += `👤 ${estudiante.nombre}\n`;
            reporte += `📛 ${matricula} | ${estudiante.grado}° ${estudiante.grupo}\n`;
            reporte += `📊 Retardos: ${totalRetardos}/${HORARIOS_CONFIG.MAX_RETARDOS_SEMANA}`;
            
            if (totalRetardos >= HORARIOS_CONFIG.MAX_RETARDOS_SEMANA) {
                reporte += ` 🚨 LÍMITE EXCEDIDO`;
            }
            
            reporte += `\n`;
            
            estudiante.retardos.forEach(retardo => {
                reporte += `   📅 ${retardo.fecha} - ${retardo.hora} (${retardo.minutos} min)\n`;
            });
            
            reporte += `\n`;
        });
    }
    
    return reporte;
}

// Mostrar reporte de retardos
function mostrarReporteRetardos() {
    const reporte = generarReporteRetardos();
    showNotification(reporte, 'info', 10000);
}

// Exportar datos con información de retardos
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

// Generar CSV con información de retardos
function generateCSV() {
    const headers = ['Fecha', 'Matrícula', 'Nombre', 'Grado', 'Grupo', 'Hora Entrada', 'Hora Salida', 'Estado', 'Retardo (min)', 'Excede Tolerancia'];
    const csvRows = [headers.join(',')];
    
    records.forEach(record => {
        const estado = record.horaEntrada && record.horaSalida ? 'Completo' : 
                     record.horaEntrada ? 'Solo entrada' : 'Sin registro';
        
        const retardoMin = record.minutosRetardo || 0;
        const excedeTolerancias = record.esRetardo ? 'SÍ' : 'NO';
        
        const row = [
            record.fecha || '',
            record.matricula || '',
            `"${record.nombre || ''}"`,
            record.grado || '',
            record.grupo || '',
            record.horaEntrada || '',
            record.horaSalida || '',
            estado,
            retardoMin,
            excedeTolerancias
        ];
        csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
}

// Función de ayuda actualizada
function showHelpModal() {
    const helpContent = `
🏫 SISTEMA DE CONTROL DE ASISTENCIA
   CETIS No. 45 "José María Izazaga"
   CON CONTROL DE RETARDOS 🚨

📱 CÓMO USAR:
1. Presiona "Escanear Código QR"
2. Permite acceso a la cámara
3. Acerca el código del estudiante
4. Primera lectura = ENTRADA ✅
5. Segunda lectura = SALIDA ❌

🚨 CONTROL DE RETARDOS:
⏰ Hora oficial: 7:00 AM
⏱️ Tolerancia: 10 minutos (7:00-7:10)
🔥 Límite semanal: 3 retardos
📊 Alertas automáticas

🎯 TIPOS DE ALERTAS:
✅ PUNTUAL: Antes de 7:00 AM
⏱️ TOLERANCIA: 7:00 - 7:10 AM  
⚠️ RETARDO: Después de 7:10 AM
🚨 CRÍTICO: 3+ retardos por semana

🎫 GENERAR CÓDIGOS QR:
• Individual: Un estudiante a la vez
• Masivo: Lista completa en CSV
• Credenciales profesionales para imprimir

📊 REPORTES DISPONIBLES:
• Estadísticas diarias en tiempo real
• Reporte de retardos semanal
• Filtros por fecha específica
• Exportación a Excel/PDF con retardos

💡 CONSEJOS IMPORTANTES:
• Mantén buena iluminación para escanear
• Los datos se guardan automáticamente
• Funciona sin internet después de cargar
• El control de retardos es automático
• Usa códigos QR generados por el sistema

🔧 SOPORTE TÉCNICO:
• Dirección del CETIS No. 45
• Departamento de Sistemas
• #OrgullosamenteCETIS45

📱 FORMATO DE CÓDIGO QR:
{"matricula":"123","nombre":"Juan Pérez","grado":"1","grupo":"A"}
    `;
    
    showNotification(helpContent, 'info', 12000);
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
    
    let bgColor, borderColor, icon, textShadow;
    switch(type) {
        case 'error':
        case 'critical':
            bgColor = 'linear-gradient(135deg, #dc3545, #c82333)';
            borderColor = '#721c24';
            icon = '🚨';
            textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
            break;
        case 'warning':
            bgColor = 'linear-gradient(135deg, #ff8c00, #ff7700)';
            borderColor = '#cc5500';
            icon = '⚠️';
            textShadow = '1px 1px 3px rgba(0,0,0,0.3)';
            break;
        case 'info':
            bgColor = 'linear-gradient(135deg, #17a2b8, #138496)';
            borderColor = '#0c5460';
            icon = 'ℹ️';
            textShadow = '1px 1px 2px rgba(0,0,0,0.3)';
            break;
        default:
            bgColor = 'linear-gradient(135deg, #28a745, #20c997)';
            borderColor = '#155724';
            icon = '✅';
            textShadow = '1px 1px 2px rgba(0,0,0,0.3)';
    }
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 18px 22px;
        border-radius: 15px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.4);
        z-index: 1000;
        font-weight: 600;
        border: 3px solid ${borderColor};
        animation: slideIn 0.3s ease;
        max-width: 400px;
        white-space: pre-line;
        font-family: 'Segoe UI', sans-serif;
        line-height: 1.5;
        text-shadow: ${textShadow};
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;
    `;
    
    notification.innerHTML = `<strong style="font-size: 16px;">${icon}</strong> ${message}`;
    document.body.appendChild(notification);
    
    // Hover effect
    notification.addEventListener('mouseenter', () => {
        notification.style.transform = 'translateY(-2px)';
        notification.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
    });
    
    notification.addEventListener('mouseleave', () => {
        notification.style.transform = 'translateY(0)';
        notification.style.boxShadow = '0 8px 25px rgba(0,0,0,0.4)';
    });
    
    // Auto-close con efecto
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
    
    // Click para cerrar
    notification.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
}

// Función para limpiar datos corruptos
function clearCorruptedData() {
    localStorage.removeItem('attendanceRecords');
    records = [];
    updateStatsImmediate();
    displayTodaysRecordsWithRetardos();
    showNotification('🧹 Datos limpiados. Sistema reiniciado.', 'info');
    console.log('🧹 Datos del localStorage limpiados');
}

// Función de debugging mejorada
function debugStats() {
    console.log('🔍 DEBUG - Estado actual:');
    console.log('Records totales:', records.length);
    
    const today = new Date().toISOString().split('T')[0];
    const todaysRecords = records.filter(record => record.fecha === today);
    console.log('Records de hoy:', todaysRecords.length);
    
    const uniqueStudents = new Set(todaysRecords.map(record => record.matricula)).size;
    const entriesCount = todaysRecords.filter(record => record.horaEntrada).length;
    const exitsCount = todaysRecords.filter(record => record.horaSalida).length;
    const retardosHoy = todaysRecords.filter(record => record.esRetardo).length;
    
    console.log('Estadísticas calculadas:');
    console.log('- Estudiantes únicos:', uniqueStudents);
    console.log('- Entradas:', entriesCount);
    console.log('- Salidas:', exitsCount);
    console.log('- Retardos hoy:', retardosHoy);
    
    console.log('Valores en DOM:');
    console.log('- Estudiantes DOM:', totalStudentsEl?.textContent);
    console.log('- Entradas DOM:', totalEntriesEl?.textContent);
    console.log('- Salidas DOM:', totalExitsEl?.textContent);
}

// Función para testear retardos (desarrollo)
function testRetardo() {
    const testStudent = {
        matricula: "TEST123",
        nombre: "ESTUDIANTE DE PRUEBA",
        grado: "1",
        grupo: "A"
    };
    
    // Simular llegada tarde (7:15 AM)
    const now = new Date();
    const lateTime = "07:15:30";
    
    console.log('🧪 Simulando retardo para prueba...');
    
    const newRecord = {
        id: Date.now(),
        matricula: testStudent.matricula,
        nombre: testStudent.nombre,
        grado: testStudent.grado,
        grupo: testStudent.grupo,
        fecha: now.toISOString().split('T')[0],
        horaEntrada: lateTime,
        horaSalida: null,
        esRetardo: true,
        minutosRetardo: 15
    };
    
    records.push(newRecord);
    saveRecords();
    displayTodaysRecordsWithRetardos();
    updateStatsImmediate();
    
    showNotification('🧪 Retardo de prueba creado\n⏰ Hora: 7:15:30 (15 min tarde)\n👤 Estudiante: ESTUDIANTE DE PRUEBA', 'warning');
}

// Función para configurar alertas automáticas
function configurarAlertasAutomaticas() {
    // Verificar estudiantes con problemas cada hora
    setInterval(() => {
        const hoy = new Date().toISOString().split('T')[0];
        const todosRegistros = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
        const registrosHoy = todosRegistros.filter(r => r.fecha === hoy && r.esRetardo);
        
        // Contar retardos críticos del día
        const retardosCriticos = registrosHoy.filter(r => {
            const retardosSemana = obtenerRetardosSemana(r.matricula);
            return retardosSemana.excedeLimite;
        });
        
        if (retardosCriticos.length > 0) {
            console.log(`🚨 ALERTA AUTOMÁTICA: ${retardosCriticos.length} estudiantes han excedido el límite de retardos`);
            
            // Mostrar contador en pantalla si no existe
            let contador = document.getElementById('contadorRetardosCriticos');
            if (!contador && retardosCriticos.length > 0) {
                contador = document.createElement('div');
                contador.id = 'contadorRetardosCriticos';
                contador.className = 'contador-retardos';
                contador.innerHTML = `🚨 ${retardosCriticos.length} estudiantes con límite excedido`;
                contador.style.display = 'block';
                document.body.appendChild(contador);
                
                // Auto-ocultar después de 10 segundos
                setTimeout(() => {
                    if (contador && contador.parentNode) {
                        contador.parentNode.removeChild(contador);
                    }
                }, 10000);
            }
        }
    }, 3600000); // Cada hora
}

// Inicializar alertas automáticas
configurarAlertasAutomaticas();

// Exponer funciones de utilidad para debugging
window.clearCorruptedData = clearCorruptedData;
window.debugStats = debugStats;
window.updateStatsImmediate = updateStatsImmediate;
window.mostrarReporteRetardos = mostrarReporteRetardos;
window.generarReporteRetardos = generarReporteRetardos;
window.testRetardo = testRetardo;
window.calcularRetardo = calcularRetardo;
window.obtenerRetardosSemana = obtenerRetardosSemana;

// Agregar estilos de animación
const animationStyle = document.createElement('style');
animationStyle.textContent = `
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
    
    .retardo-btn {
        background: linear-gradient(135deg, #ff8c00, #ff7700) !important;
        border-color: #cc5500 !important;
        color: white !important;
        position: relative;
        overflow: hidden;
    }
    
    .retardo-btn:hover {
        background: linear-gradient(135deg, #ff7700, #e6650a) !important;
        box-shadow: 0 6px 20px rgba(255, 140, 0, 0.4) !important;
    }
    
    .retardo-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        transition: left 0.5s;
    }
    
    .retardo-btn:hover::before {
        left: 100%;
    }
`;
document.head.appendChild(animationStyle);

// Log de inicio completo
console.log('✅ Sistema CETIS 45 cargado completamente - CON CONTROL DE RETARDOS');
console.log('📊 Funcionalidades disponibles:');
console.log('  - Escaneo de códigos QR');
console.log('  - Registro de entrada/salida');
console.log('  - Control automático de retardos');
console.log('  - Estadísticas en tiempo real');
console.log('  - Exportación de datos con retardos');
console.log('  - Generación de reportes de retardos');
console.log('🚨 Control de Retardos configurado:');
console.log('  - Tolerancia: 10 minutos');
console.log('  - Límite semanal: 3 retardos');
console.log('  - Alertas automáticas activadas');
console.log('🔧 Funciones de debugging:');
console.log('  - clearCorruptedData() - Limpiar datos');
console.log('  - debugStats() - Ver estado actual');
console.log('  - testRetardo() - Simular retardo');
console.log('  - mostrarReporteRetardos() - Ver reporte semanal');
console.log('🏫 #OrgullosamenteCETIS45');