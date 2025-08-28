// ================================
// SISTEMA DE REPORTES CETIS 45
// VERSIÓN CORREGIDA - FIX ESTADÍSTICAS
// ================================

// Variables globales
let allRecords = [];
let filteredRecords = [];

// Elementos del DOM
const dateInput = document.getElementById('dateInput');
const filterBtn = document.getElementById('filterBtn');
const todayBtn = document.getElementById('todayBtn');
const weekBtn = document.getElementById('weekBtn');
const summaryStudents = document.getElementById('summaryStudents');
const summaryPresent = document.getElementById('summaryPresent');
const summaryComplete = document.getElementById('summaryComplete');
const summaryPercentage = document.getElementById('summaryPercentage');
const reportTableBody = document.getElementById('reportTableBody');

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Sistema de Reportes CETIS 45 iniciado');
    
    setupEventListeners();
    loadAllRecords();
    filterToday(); // Cargar datos de hoy por defecto
    
    console.log('✅ Reportes inicializados correctamente');
});

// Configurar event listeners
function setupEventListeners() {
    if (filterBtn) filterBtn.addEventListener('click', filterByDate);
    if (todayBtn) todayBtn.addEventListener('click', filterToday);
    if (weekBtn) weekBtn.addEventListener('click', filterThisWeek);
    
    console.log('✅ Event listeners de reportes configurados');
}

// Cargar todos los registros desde localStorage
function loadAllRecords() {
    try {
        const savedRecords = localStorage.getItem('attendanceRecords');
        if (savedRecords) {
            allRecords = JSON.parse(savedRecords);
            console.log('📚 Registros cargados:', allRecords.length);
            
            if (allRecords.length === 0) {
                console.log('📝 No hay registros, añadiendo datos de ejemplo');
                addSampleData();
            }
        } else {
            allRecords = [];
            console.log('📝 No hay registros guardados, añadiendo datos de ejemplo');
            addSampleData();
        }
    } catch (error) {
        console.error('⚠️ Error cargando registros:', error);
        allRecords = [];
        addSampleData();
    }
}

// Filtrar registros por fecha específica
function filterByDate() {
    if (!dateInput || !dateInput.value) {
        showNotification('⚠️ Por favor selecciona una fecha', 'warning');
        return;
    }
    
    const selectedDate = dateInput.value;
    console.log('🔍 Filtrando por fecha:', selectedDate);
    
    // Recargar datos desde localStorage
    loadAllRecords();
    
    filteredRecords = allRecords.filter(record => {
        return record.fecha === selectedDate;
    });
    
    console.log('📊 Registros filtrados:', filteredRecords.length);
    
    updateReportDisplay();
    
    const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    if (filteredRecords.length > 0) {
        showNotification(`📅 ${filteredRecords.length} registros encontrados\n${formattedDate}`, 'success');
    } else {
        showNotification(`📅 Sin registros para ${formattedDate}\n\n💡 Prueba con otra fecha o añade datos de ejemplo`, 'info', 5000);
    }
}

// Filtrar registros de hoy
function filterToday() {
    const today = new Date().toISOString().split('T')[0];
    if (dateInput) dateInput.value = today;
    
    console.log('📅 Filtrando registros de hoy:', today);
    
    // Asegurar que tenemos datos cargados
    if (allRecords.length === 0) {
        loadAllRecords();
    }
    
    filteredRecords = allRecords.filter(record => record.fecha === today);
    console.log('📊 Registros de hoy encontrados:', filteredRecords.length);
    
    updateReportDisplay();
    
    if (filteredRecords.length > 0) {
        showNotification(`📅 ${filteredRecords.length} registros de hoy`, 'success');
    } else {
        showNotification('📅 Sin registros para hoy\n\n💡 Usa el sistema de asistencia para crear registros', 'info', 4000);
    }
}

// Filtrar registros de esta semana
function filterThisWeek() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const startDate = startOfWeek.toISOString().split('T')[0];
    const endDate = endOfWeek.toISOString().split('T')[0];
    
    console.log('📆 Filtrando registros de esta semana:', startDate, 'a', endDate);
    
    // Asegurar que tenemos datos cargados
    if (allRecords.length === 0) {
        loadAllRecords();
    }
    
    filteredRecords = allRecords.filter(record => {
        return record.fecha >= startDate && record.fecha <= endDate;
    });
    
    console.log('📊 Registros de esta semana encontrados:', filteredRecords.length);
    updateReportDisplay();
    
    if (filteredRecords.length > 0) {
        showNotification(`📆 ${filteredRecords.length} registros de esta semana`, 'success');
    } else {
        showNotification('📆 Sin registros para esta semana\n\n💡 Usa el sistema de asistencia para crear registros', 'info', 4000);
    }
}

// FUNCIÓN CORREGIDA: Actualizar display de reportes
function updateReportDisplay() {
    updateSummaryCards();
    updateReportTable();
    
    console.log('📊 Display actualizado con', filteredRecords.length, 'registros');
}

// FUNCIÓN CORREGIDA: Actualizar tarjetas de resumen
function updateSummaryCards() {
    console.log('🔢 Calculando estadísticas...');
    console.log('📋 Registros a procesar:', filteredRecords);
    
    // Obtener estudiantes únicos usando matrículas
    const uniqueStudents = [...new Set(filteredRecords.map(record => record.matricula))];
    
    // Estudiantes con entrada
    const studentsWithEntry = filteredRecords.filter(record => record.horaEntrada && record.horaEntrada.trim() !== '');
    const uniquePresent = [...new Set(studentsWithEntry.map(record => record.matricula))];
    
    // Estudiantes con entrada Y salida
    const completeRecords = filteredRecords.filter(record => 
        record.horaEntrada && record.horaEntrada.trim() !== '' && 
        record.horaSalida && record.horaSalida.trim() !== ''
    );
    const uniqueComplete = [...new Set(completeRecords.map(record => record.matricula))];
    
    // Calcular porcentaje
    const percentage = uniqueStudents.length > 0 ? 
        Math.round((uniquePresent.length / uniqueStudents.length) * 100) : 0;
    
    console.log('📊 Estadísticas calculadas:');
    console.log('- Estudiantes únicos:', uniqueStudents.length);
    console.log('- Presentes:', uniquePresent.length);
    console.log('- Completos:', uniqueComplete.length);
    console.log('- Porcentaje:', percentage + '%');
    
    // Actualizar DOM inmediatamente
    if (summaryStudents) {
        summaryStudents.textContent = uniqueStudents.length.toString();
    }
    if (summaryPresent) {
        summaryPresent.textContent = uniquePresent.length.toString();
    }
    if (summaryComplete) {
        summaryComplete.textContent = uniqueComplete.length.toString();
    }
    if (summaryPercentage) {
        summaryPercentage.textContent = percentage.toString() + '%';
    }
    
    console.log('✅ Estadísticas actualizadas en DOM');
}

// Actualizar tabla de reportes
function updateReportTable() {
    if (!reportTableBody) return;
    
    if (filteredRecords.length === 0) {
        reportTableBody.innerHTML = `
            <div class="no-data">
                <h3>📊 Sin registros</h3>
                <p><strong>No hay registros para la fecha seleccionada</strong></p>
                <p>Selecciona otra fecha o verifica que haya registros de asistencia</p>
                <small>#OrgullosamenteCETIS45</small>
                <br><br>
                <button onclick="addSampleData()" style="
                    background: linear-gradient(135deg, #8b1538, #a91d47);
                    color: white;
                    border: 2px solid #ffc72c;
                    padding: 10px 20px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: 600;
                    margin-right: 10px;
                ">🎯 Añadir Datos de Ejemplo</button>
                <button onclick="generateMultipleDaysData()" style="
                    background: linear-gradient(135deg, #003f7f, #1e4a72);
                    color: white;
                    border: 2px solid #ffc72c;
                    padding: 10px 20px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: 600;
                ">📅 Generar Datos Históricos</button>
            </div>
        `;
        return;
    }
    
    // Agrupar registros por estudiante
    const studentGroups = {};
    filteredRecords.forEach(record => {
        if (!studentGroups[record.matricula]) {
            studentGroups[record.matricula] = {
                estudiante: record,
                entradas: [],
                salidas: []
            };
        }
        
        if (record.horaEntrada && record.horaEntrada.trim() !== '') {
            studentGroups[record.matricula].entradas.push(record.horaEntrada);
        }
        if (record.horaSalida && record.horaSalida.trim() !== '') {
            studentGroups[record.matricula].salidas.push(record.horaSalida);
        }
    });
    
    // Generar HTML de la tabla
    const tableHTML = Object.values(studentGroups).map(group => {
        const student = group.estudiante;
        const hasEntry = group.entradas.length > 0;
        const hasExit = group.salidas.length > 0;
        
        let status = '';
        let statusClass = '';
        
        if (hasEntry && hasExit) {
            status = '✅ Completo';
            statusClass = 'status-present';
        } else if (hasEntry) {
            status = '🟡 Solo entrada';
            statusClass = 'status-partial';
        } else {
            status = '❌ Ausente';
            statusClass = 'status-absent';
        }
        
        return `
            <div class="table-row">
                <div class="student-cell" data-label="👤 Estudiante">
                    <div><strong>${student.nombre || 'Sin nombre'}</strong></div>
                    <small>🆔 Mat: ${student.matricula || 'Sin matrícula'}</small>
                </div>
                <div class="grade-cell" data-label="🎓 Grado">
                    <strong>${student.grado || 'N/A'}° ${student.grupo || 'N/A'}</strong>
                </div>
                <div class="time-cell entry" data-label="🟢 Entrada">
                    ${group.entradas.join(', ') || '---'}
                </div>
                <div class="time-cell exit" data-label="🔴 Salida">
                    ${group.salidas.join(', ') || '---'}
                </div>
                <div class="status-cell ${statusClass}" data-label="📊 Estado">
                    ${status}
                </div>
            </div>
        `;
    }).join('');
    
    reportTableBody.innerHTML = tableHTML;
}

// Añadir datos de ejemplo
function addSampleData() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const now = new Date();
    
    const sampleRecords = [
        // Registros de hoy
        {
            id: Date.now(),
            matricula: "2508CETIS045ZIH1001",
            nombre: "PÉREZ GARCÍA JUAN CARLOS",
            grado: "1",
            grupo: "A",
            fecha: today,
            horaEntrada: now.toLocaleTimeString('es-ES'),
            horaSalida: null
        },
        {
            id: Date.now() + 1,
            matricula: "2508CETIS045ZIH1002",
            nombre: "LÓPEZ MARTÍNEZ MARÍA FERNANDA",
            grado: "1",
            grupo: "A",
            fecha: today,
            horaEntrada: new Date(now.getTime() - 60000).toLocaleTimeString('es-ES'),
            horaSalida: now.toLocaleTimeString('es-ES')
        },
        {
            id: Date.now() + 2,
            matricula: "2508CETIS045ZIH1003",
            nombre: "GONZÁLEZ RODRÍGUEZ LUIS MIGUEL",
            grado: "1",
            grupo: "B",
            fecha: today,
            horaEntrada: new Date(now.getTime() - 120000).toLocaleTimeString('es-ES'),
            horaSalida: null
        },
        {
            id: Date.now() + 3,
            matricula: "2508CETIS045ZIH1004",
            nombre: "HERNÁNDEZ LÓPEZ ANA SOFÍA",
            grado: "2",
            grupo: "A",
            fecha: today,
            horaEntrada: new Date(now.getTime() - 180000).toLocaleTimeString('es-ES'),
            horaSalida: new Date(now.getTime() - 60000).toLocaleTimeString('es-ES')
        },
        // Registros de ayer
        {
            id: Date.now() + 4,
            matricula: "2508CETIS045ZIH1001",
            nombre: "PÉREZ GARCÍA JUAN CARLOS",
            grado: "1",
            grupo: "A",
            fecha: yesterday,
            horaEntrada: "08:15:30",
            horaSalida: "14:30:15"
        },
        {
            id: Date.now() + 5,
            matricula: "2508CETIS045ZIH1002",
            nombre: "LÓPEZ MARTÍNEZ MARÍA FERNANDA",
            grado: "1",
            grupo: "A",
            fecha: yesterday,
            horaEntrada: "08:20:00",
            horaSalida: "14:25:45"
        }
    ];
    
    // Combinar con registros existentes
    const existingRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    const combinedRecords = [...existingRecords, ...sampleRecords];
    
    localStorage.setItem('attendanceRecords', JSON.stringify(combinedRecords));
    console.log('✅ Datos de ejemplo añadidos');
    
    // Recargar datos
    loadAllRecords();
    filterToday();
    
    showNotification(`🎯 Datos de ejemplo añadidos\n📊 ${sampleRecords.length} registros creados\n📅 2 días con datos (hoy y ayer)`, 'success', 4000);
}

// Generar datos de múltiples días
function generateMultipleDaysData() {
    const records = [];
    const students = [
        "PÉREZ GARCÍA JUAN CARLOS",
        "LÓPEZ MARTÍNEZ MARÍA FERNANDA", 
        "GONZÁLEZ RODRÍGUEZ LUIS MIGUEL",
        "HERNÁNDEZ LÓPEZ ANA SOFÍA",
        "MARTÍNEZ SILVA CARLOS EDUARDO",
        "RODRÍGUEZ TORRES LAURA PATRICIA",
        "GARCÍA MORALES DIEGO ALEJANDRO",
        "TORRES HERRERA VALERIA NICOLE"
    ];
    
    // Generar datos para los últimos 7 días
    for (let i = 0; i < 7; i++) {
        const date = new Date(Date.now() - (i * 86400000));
        const dateStr = date.toISOString().split('T')[0];
        
        // Simular algunos estudiantes por día
        const numStudents = Math.floor(Math.random() * 6) + 3; // 3-8 estudiantes
        
        for (let j = 0; j < numStudents; j++) {
            const student = students[j];
            const hasEntry = Math.random() > 0.1; // 90% tienen entrada
            const hasExit = hasEntry && Math.random() > 0.2; // 80% de los que entran también salen
            
            const record = {
                id: Date.now() + (i * 1000) + j,
                matricula: `2508CETIS045ZIH100${j + 1}`,
                nombre: student,
                grado: String(Math.floor(j / 2) + 1),
                grupo: j % 2 === 0 ? "A" : "B",
                fecha: dateStr,
                horaEntrada: hasEntry ? `0${8 + Math.floor(Math.random() * 2)}:${15 + Math.floor(Math.random() * 30)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : null,
                horaSalida: hasExit ? `1${4 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : null
            };
            
            records.push(record);
        }
    }
    
    // Combinar con registros existentes
    const existingRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    const combinedRecords = [...existingRecords, ...records];
    
    localStorage.setItem('attendanceRecords', JSON.stringify(combinedRecords));
    console.log('✅ Datos de múltiples días generados:', records.length, 'registros');
    
    loadAllRecords();
    filterToday();
    
    showNotification(`🎯 Datos históricos generados\n📊 ${records.length} registros\n📅 7 días con datos`, 'success', 4000);
}

// Verificar y reparar datos
function verifyAndRepairData() {
    console.log('🔧 Verificando integridad de datos...');
    
    const rawData = localStorage.getItem('attendanceRecords');
    console.log('📊 Datos brutos:', rawData ? 'Encontrados' : 'No encontrados');
    
    if (!rawData) {
        console.log('❌ No hay datos en localStorage');
        addSampleData();
        return;
    }
    
    try {
        const records = JSON.parse(rawData);
        console.log('📋 Total registros:', records.length);
        
        if (records.length === 0) {
            console.log('📝 Añadiendo datos de ejemplo...');
            addSampleData();
            return;
        }
        
        // Verificar estructura de datos
        const sampleRecord = records[0];
        const requiredFields = ['id', 'matricula', 'nombre', 'grado', 'grupo', 'fecha'];
        const missingFields = requiredFields.filter(field => !(field in sampleRecord));
        
        if (missingFields.length > 0) {
            console.log('⚠️ Campos faltantes:', missingFields);
            repairRecordStructure(records);
        }
        
        // Mostrar estadísticas
        const uniqueDates = [...new Set(records.map(r => r.fecha))];
        const today = new Date().toISOString().split('T')[0];
        const todayRecords = records.filter(r => r.fecha === today);
        
        console.log('📅 Fechas con registros:', uniqueDates);
        console.log('📅 Registros de hoy:', todayRecords.length);
        
        // Actualizar vista
        allRecords = records;
        filterToday();
        
        showNotification('✅ Datos verificados correctamente\n📊 ' + records.length + ' registros encontrados\n📅 ' + uniqueDates.length + ' días con datos', 'success', 4000);
        
    } catch (error) {
        console.error('❌ Error parseando datos:', error);
        console.log('🔄 Limpiando datos corruptos...');
        localStorage.removeItem('attendanceRecords');
        addSampleData();
    }
}

// Reparar estructura de registros
function repairRecordStructure(records) {
    const repairedRecords = records.map(record => {
        return {
            id: record.id || Date.now() + Math.random(),
            matricula: record.matricula || 'SIN_MATRICULA',
            nombre: record.nombre || 'SIN_NOMBRE',
            grado: record.grado || '1',
            grupo: record.grupo || 'A',
            fecha: record.fecha || new Date().toISOString().split('T')[0],
            horaEntrada: record.horaEntrada || null,
            horaSalida: record.horaSalida || null
        };
    });
    
    localStorage.setItem('attendanceRecords', JSON.stringify(repairedRecords));
    console.log('🔧 Estructura de datos reparada');
    showNotification('🔧 Estructura de datos reparada', 'info');
}

// Mostrar notificación
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

// Exportar datos (función simple)
function exportData() {
    if (filteredRecords.length === 0) {
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
            link.setAttribute('download', `reporte_asistencia_cetis45_${new Date().toISOString().split('T')[0]}.csv`);
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
    
    filteredRecords.forEach(record => {
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

// Exponer funciones globalmente
window.verifyAndRepairData = verifyAndRepairData;
window.addSampleData = addSampleData;
window.generateMultipleDaysData = generateMultipleDaysData;
window.filterToday = filterToday;
window.filterByDate = filterByDate;
window.filterThisWeek = filterThisWeek;
window.exportData = exportData;
window.updateReportDisplay = updateReportDisplay;

console.log('✅ Sistema de Reportes CETIS 45 cargado completamente');
console.log('🏫 CETIS No. 45 "José María Izazaga" - Zihuatanejo, Guerrero');
console.log('📊 Funciones disponibles: filterToday, filterByDate, addSampleData, verifyAndRepairData');