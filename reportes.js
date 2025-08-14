// ================================
// SISTEMA DE REPORTES DE ASISTENCIA
// CETIS No. 45 - REPORTES PRINCIPAL
// ================================

// Variables globales
let allRecords = [];
let filteredRecords = [];

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Sistema de reportes CETIS 45 iniciado');
    loadAllRecords();
    setupEventListeners();
    setTodayDate();
    filterToday();
    showWelcomeMessage();
});

// Mostrar mensaje de bienvenida
function showWelcomeMessage() {
    setTimeout(() => {
        showNotification('📊 Sistema de Reportes CETIS 45\n¡Analiza la asistencia de tus estudiantes!', 'info', 3000);
    }, 1000);
}

// Configurar event listeners
function setupEventListeners() {
    const filterBtn = document.getElementById('filterBtn');
    const todayBtn = document.getElementById('todayBtn');
    const weekBtn = document.getElementById('weekBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const printReportBtn = document.getElementById('printReportBtn');
    const dateInput = document.getElementById('dateInput');
    
    if (filterBtn) filterBtn.addEventListener('click', filterByDate);
    if (todayBtn) todayBtn.addEventListener('click', filterToday);
    if (weekBtn) weekBtn.addEventListener('click', filterThisWeek);
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportToPDF);
    if (exportExcelBtn) exportExcelBtn.addEventListener('click', exportToExcel);
    if (printReportBtn) printReportBtn.addEventListener('click', printReport);
    if (dateInput) dateInput.addEventListener('change', filterByDate);
    
    console.log('✅ Event listeners de reportes configurados');
}

// Cargar todos los registros del localStorage
function loadAllRecords() {
    try {
        const savedRecords = localStorage.getItem('attendanceRecords');
        if (savedRecords) {
            allRecords = JSON.parse(savedRecords);
            console.log('📚 Registros cargados para reportes:', allRecords.length);
        } else {
            allRecords = [];
            console.log('ℹ️ No hay registros guardados');
        }
    } catch (error) {
        console.error('⚠️ Error cargando registros:', error);
        allRecords = [];
        showNotification('⚠️ Error cargando datos. Verifica el almacenamiento local.', 'warning');
    }
}

// Establecer fecha de hoy en el input
function setTodayDate() {
    const dateInput = document.getElementById('dateInput');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
}

// Filtrar registros por fecha específica
function filterByDate() {
    const dateInput = document.getElementById('dateInput');
    if (!dateInput || !dateInput.value) {
        showNotification('⚠️ Por favor selecciona una fecha', 'warning');
        return;
    }
    
    const selectedDate = dateInput.value;
    filteredRecords = allRecords.filter(record => record.fecha === selectedDate);
    
    console.log(`🔍 Filtrando por fecha ${selectedDate}:`, filteredRecords.length, 'registros');
    updateReportDisplay();
    
    const formattedDate = new Date(selectedDate).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    if (filteredRecords.length > 0) {
        showNotification(`📅 Mostrando ${filteredRecords.length} registros del ${formattedDate}`, 'success');
    } else {
        showNotification(`📅 No hay registros para el ${formattedDate}`, 'info');
    }
}

// Filtrar registros de hoy
function filterToday() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('dateInput');
    if (dateInput) dateInput.value = today;
    
    filteredRecords = allRecords.filter(record => record.fecha === today);
    console.log(`📅 Filtrando registros de hoy:`, filteredRecords.length, 'registros');
    updateReportDisplay();
    
    showNotification(`📅 Mostrando registros de hoy (${filteredRecords.length})`, 'success');
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
    
    filteredRecords = allRecords.filter(record => {
        return record.fecha >= startDate && record.fecha <= endDate;
    });
    
    console.log(`📆 Filtrando registros de esta semana:`, filteredRecords.length, 'registros');
    updateReportDisplay();
    
    showNotification(`📆 Mostrando registros de esta semana (${filteredRecords.length})`, 'success');
}

// Actualizar la visualización del reporte
function updateReportDisplay() {
    updateSummaryCards();
    updateReportTable();
}

// Actualizar tarjetas de resumen
function updateSummaryCards() {
    const uniqueStudents = [...new Set(filteredRecords.map(record => record.matricula))];
    
    const studentsWithEntry = filteredRecords.filter(record => record.horaEntrada);
    const uniquePresent = [...new Set(studentsWithEntry.map(record => record.matricula))];
    
    const completeRecords = filteredRecords.filter(record => record.horaEntrada && record.horaSalida);
    const uniqueComplete = [...new Set(completeRecords.map(record => record.matricula))];
    
    const percentage = uniqueStudents.length > 0 ? 
        Math.round((uniquePresent.length / uniqueStudents.length) * 100) : 0;
    
    // Animar los números
    animateNumber('summaryStudents', uniqueStudents.length);
    animateNumber('summaryPresent', uniquePresent.length);
    animateNumber('summaryComplete', uniqueComplete.length);
    animateNumberWithPercent('summaryPercentage', percentage);
}

// Animar números en las tarjetas
function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const currentValue = parseInt(element.textContent) || 0;
    const increment = targetValue > currentValue ? 1 : -1;
    let current = currentValue;
    
    const timer = setInterval(() => {
        current += increment;
        element.textContent = current;
        
        if (current === targetValue) {
            clearInterval(timer);
        }
    }, 50);
}

// Animar porcentajes
function animateNumberWithPercent(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const currentValue = parseInt(element.textContent) || 0;
    const increment = targetValue > currentValue ? 1 : -1;
    let current = currentValue;
    
    const timer = setInterval(() => {
        current += increment;
        element.textContent = current + '%';
        
        if (current === targetValue) {
            clearInterval(timer);
        }
    }, 50);
}

// Actualizar tabla de reportes
function updateReportTable() {
    const tableBody = document.getElementById('reportTableBody');
    if (!tableBody) return;
    
    if (filteredRecords.length === 0) {
        tableBody.innerHTML = `
            <div class="no-data">
                <h3>📊 Sin registros</h3>
                <p><strong>No hay registros para la fecha seleccionada</strong></p>
                <p>Selecciona otra fecha o verifica que haya registros de asistencia</p>
                <small>#OrgullosamenteCETIS45</small>
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
        
        if (record.horaEntrada) {
            studentGroups[record.matricula].entradas.push(record.horaEntrada);
        }
        if (record.horaSalida) {
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
        
        if (hasEntry && hasExit && group.entradas[0] && group.salidas[0]) {
            const entrada = new Date(`2000-01-01 ${group.entradas[0]}`);
            const salida = new Date(`2000-01-01 ${group.salidas[0]}`);
            const diferencia = salida - entrada;
            const horas = Math.floor(diferencia / (1000 * 60 * 60));
            const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
            tiempoEnPlantel = `${horas}h ${minutos}m`;
        }
        
        const row = [
            student.fecha,
            student.matricula,
            `"${student.nombre}"`,
            student.grado,
            student.grupo,
            group.entradas.join('; ') || '',
            group.salidas.join('; ') || '',
            status,
            tiempoEnPlantel
        ];
        
        csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
}

// Imprimir reporte
function printReport() {
    exportToPDF();
    showNotification('📄 Use "Guardar como PDF" en el diálogo de impresión', 'info');
}

// Obtener texto del rango de fechas
function getDateRangeText() {
    const dateInput = document.getElementById('dateInput');
    if (dateInput && dateInput.value) {
        const date = new Date(dateInput.value);
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    return new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
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

// Funciones de análisis adicionales
function getAttendanceStats() {
    const stats = {
        totalDays: [...new Set(allRecords.map(r => r.fecha))].length,
        totalStudents: [...new Set(allRecords.map(r => r.matricula))].length,
        averageDaily: 0,
        mostActiveDay: '',
        mostActiveStudent: ''
    };
    
    // Calcular promedio diario
    if (stats.totalDays > 0) {
        stats.averageDaily = Math.round(allRecords.length / stats.totalDays);
    }
    
    // Día más activo
    const dailyCount = {};
    allRecords.forEach(record => {
        dailyCount[record.fecha] = (dailyCount[record.fecha] || 0) + 1;
    });
    
    const maxDay = Object.keys(dailyCount).reduce((a, b) => 
        dailyCount[a] > dailyCount[b] ? a : b, ''
    );
    
    if (maxDay) {
        const date = new Date(maxDay);
        stats.mostActiveDay = date.toLocaleDateString('es-ES', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
    }
    
    // Estudiante más activo
    const studentCount = {};
    allRecords.forEach(record => {
        studentCount[record.matricula] = (studentCount[record.matricula] || 0) + 1;
    });
    
    const maxStudent = Object.keys(studentCount).reduce((a, b) => 
        studentCount[a] > studentCount[b] ? a : b, ''
    );
    
    if (maxStudent) {
        const studentRecord = allRecords.find(r => r.matricula === maxStudent);
        stats.mostActiveStudent = studentRecord ? studentRecord.nombre : 'Desconocido';
    }
    
    return stats;
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
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .table-row {
        animation: fadeIn 0.3s ease;
    }
    
    .summary-card:hover {
        animation: pulse 0.6s ease;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// Función para mostrar estadísticas avanzadas (opcional)
function showAdvancedStats() {
    const stats = getAttendanceStats();
    const message = `
📊 ESTADÍSTICAS AVANZADAS CETIS 45

📅 Total de días registrados: ${stats.totalDays}
👥 Total de estudiantes: ${stats.totalStudents}
📈 Promedio de registros por día: ${stats.averageDaily}
🔥 Día más activo: ${stats.mostActiveDay}
⭐ Estudiante más activo: ${stats.mostActiveStudent}

#OrgullosamenteCETIS45
    `;
    
    showNotification(message, 'info', 8000);
}

// Event listener para mostrar estadísticas avanzadas (Ctrl+Shift+S)
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        showAdvancedStats();
    }
});

console.log('✅ Sistema de reportes CETIS 45 cargado completamente');
console.log('📊 Funcionalidades de reportes disponibles:');
console.log('  - Filtrado por fecha');
console.log('  - Estadísticas en tiempo real');
console.log('  - Exportación PDF/Excel');
console.log('  - Análisis de asistencia');
console.log('💡 Tip: Ctrl+Shift+S para estadísticas avanzadas');
console.log('🏫 #OrgullosamenteCETIS45');Entry && hasExit) {
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
                <div class="student-cell">
                    <div><strong>${student.nombre}</strong></div>
                    <small>📝 Mat: ${student.matricula}</small>
                </div>
                <div><strong>${student.grado}° ${student.grupo}</strong></div>
                <div class="time-cell">${group.entradas.join(', ') || '---'}</div>
                <div class="time-cell">${group.salidas.join(', ') || '---'}</div>
                <div class="${statusClass}">${status}</div>
            </div>
        `;
    }).join('');
    
    tableBody.innerHTML = tableHTML;
}

// Exportar a PDF
function exportToPDF() {
    if (filteredRecords.length === 0) {
        showNotification('⚠️ No hay datos para exportar', 'warning');
        return;
    }
    
    generatePDFReport();
}

// Generar reporte PDF
function generatePDFReport() {
    const dateRange = getDateRangeText();
    const reportWindow = window.open('', '_blank', 'width=900,height=700');
    
    const reportHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Asistencia - CETIS 45</title>
    <style>
        @page { size: A4; margin: 20mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: Arial, sans-serif; 
            background: white; 
            color: #333;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #8b1538, #a91d47);
            color: white;
            border-radius: 10px;
        }
        .header h1 {
            color: #d4af37;
            font-size: 24px;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 14px;
            margin-bottom: 5px;
        }
        .report-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 2px solid #8b1538;
        }
        .report-info h3 {
            color: #8b1538;
            margin-bottom: 10px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 25px;
        }
        .stat-box {
            background: linear-gradient(135deg, #8b1538, #a91d47);
            color: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border: 2px solid #d4af37;
        }
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #d4af37;
        }
        .stat-label {
            font-size: 12px;
            margin-top: 5px;
        }
        .table-container {
            border: 2px solid #8b1538;
            border-radius: 8px;
            overflow: hidden;
        }
        .table-header {
            background: linear-gradient(135deg, #8b1538, #a91d47);
            color: white;
            padding: 12px;
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
            gap: 10px;
            font-weight: bold;
        }
        .table-row {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
            gap: 10px;
            padding: 10px 12px;
            border-bottom: 1px solid #ddd;
            font-size: 11px;
        }
        .table-row:nth-child(even) {
            background: #f8f9fa;
        }
        .student-name {
            font-weight: bold;
            color: #8b1538;
        }
        .student-matricula {
            font-size: 10px;
            color: #666;
        }
        .time-cell {
            font-family: 'Courier New', monospace;
        }
        .status-complete { color: #28a745; font-weight: bold; }
        .status-partial { color: #ffc107; font-weight: bold; }
        .status-absent { color: #dc3545; font-weight: bold; }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 2px solid #8b1538;
            padding-top: 15px;
        }
        .no-print { display: block; }
        @media print {
            .no-print { display: none !important; }
            .table-row { font-size: 10px; }
        }
        .print-controls {
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 2px solid #8b1538;
        }
        .btn {
            background: linear-gradient(135deg, #8b1538, #a91d47);
            color: white;
            border: 2px solid #d4af37;
            padding: 10px 20px;
            margin: 0 5px;
            border-radius: 20px;
            cursor: pointer;
            font-weight: 600;
        }
        .btn:hover {
            background: linear-gradient(135deg, #a91d47, #8b1538);
        }
    </style>
</head>
<body>
    <div class="print-controls no-print">
        <h2 style="color: #8b1538; margin-bottom: 15px;">📊 Reporte de Asistencia</h2>
        <button class="btn" onclick="window.print()">🖨️ Imprimir</button>
        <button class="btn" onclick="window.close()">❌ Cerrar</button>
    </div>
    
    <div class="header">
        <h1>🏫 CETIS No. 45</h1>
        <p>Centro de Estudios Tecnológicos Industrial y de Servicios</p>
        <p><strong>Reporte de Asistencia Escolar</strong></p>
    </div>
    
    <div class="report-info">
        <h3>📋 Información del Reporte</h3>
        <p><strong>Fecha:</strong> ${dateRange}</p>
        <p><strong>Generado:</strong> ${new Date().toLocaleString('es-ES')}</p>
        <p><strong>Total de registros:</strong> ${filteredRecords.length}</p>
    </div>
    
    <div class="stats-grid">
        <div class="stat-box">
            <div class="stat-number">${document.getElementById('summaryStudents')?.textContent || '0'}</div>
            <div class="stat-label">👥 Estudiantes</div>
        </div>
        <div class="stat-box">
            <div class="stat-number">${document.getElementById('summaryPresent')?.textContent || '0'}</div>
            <div class="stat-label">✅ Presentes</div>
        </div>
        <div class="stat-box">
            <div class="stat-number">${document.getElementById('summaryComplete')?.textContent || '0'}</div>
            <div class="stat-label">🔄 Completos</div>
        </div>
        <div class="stat-box">
            <div class="stat-number">${document.getElementById('summaryPercentage')?.textContent || '0%'}</div>
            <div class="stat-label">📊 Asistencia</div>
        </div>
    </div>
    
    <div class="table-container">
        <div class="table-header">
            <div>👤 Estudiante</div>
            <div>🎓 Grado</div>
            <div>🟢 Entrada</div>
            <div>🔴 Salida</div>
            <div>📊 Estado</div>
        </div>
        ${generatePDFTableRows()}
    </div>
    
    <div class="footer">
        <p><strong>Sistema de Control de Asistencia CETIS No. 45</strong></p>
        <p>Ciclo Escolar 2025-2026 | #OrgullosamenteCETIS45</p>
        <p>Generado automáticamente el ${new Date().toLocaleDateString('es-ES')}</p>
    </div>
</body>
</html>`;
    
    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
    
    showNotification('📄 Reporte PDF generado exitosamente', 'success');
}

// Generar filas de tabla para PDF
function generatePDFTableRows() {
    const studentGroups = {};
    filteredRecords.forEach(record => {
        if (!studentGroups[record.matricula]) {
            studentGroups[record.matricula] = {
                estudiante: record,
                entradas: [],
                salidas: []
            };
        }
        
        if (record.horaEntrada) {
            studentGroups[record.matricula].entradas.push(record.horaEntrada);
        }
        if (record.horaSalida) {
            studentGroups[record.matricula].salidas.push(record.horaSalida);
        }
    });
    
    return Object.values(studentGroups).map(group => {
        const student = group.estudiante;
        const hasEntry = group.entradas.length > 0;
        const hasExit = group.salidas.length > 0;
        
        let status = '';
        let statusClass = '';
        
        if (hasEntry && hasExit) {
            status = '✅ Completo';
            statusClass = 'status-complete';
        } else if (hasEntry) {
            status = '🟡 Parcial';
            statusClass = 'status-partial';
        } else {
            status = '❌ Ausente';
            statusClass = 'status-absent';
        }
        
        return `
            <div class="table-row">
                <div>
                    <div class="student-name">${student.nombre}</div>
                    <div class="student-matricula">Mat: ${student.matricula}</div>
                </div>
                <div>${student.grado}° ${student.grupo}</div>
                <div class="time-cell">${group.entradas.join(', ') || '---'}</div>
                <div class="time-cell">${group.salidas.join(', ') || '---'}</div>
                <div class="${statusClass}">${status}</div>
            </div>
        `;
    }).join('');
}

// Exportar a Excel (CSV)
function exportToExcel() {
    if (filteredRecords.length === 0) {
        showNotification('⚠️ No hay datos para exportar', 'warning');
        return;
    }
    
    try {
        const csvContent = generateDetailedCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            
            const dateRange = getDateRangeText().replace(/[^\w\-]/g, '_');
            link.setAttribute('download', `reporte_asistencia_cetis45_${dateRange}.csv`);
            
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification('📊 Archivo Excel descargado exitosamente', 'success');
        }
    } catch (error) {
        console.error('Error exportando a Excel:', error);
        showNotification('⚠️ Error al exportar archivo Excel', 'error');
    }
}

// Generar CSV detallado
function generateDetailedCSV() {
    const headers = [
        'Fecha', 'Matrícula', 'Nombre', 'Grado', 'Grupo', 
        'Hora Entrada', 'Hora Salida', 'Estado', 'Tiempo en Plantel'
    ];
    
    const csvRows = [headers.join(',')];
    
    const studentGroups = {};
    filteredRecords.forEach(record => {
        if (!studentGroups[record.matricula]) {
            studentGroups[record.matricula] = {
                estudiante: record,
                entradas: [],
                salidas: []
            };
        }
        
        if (record.horaEntrada) {
            studentGroups[record.matricula].entradas.push(record.horaEntrada);
        }
        if (record.horaSalida) {
            studentGroups[record.matricula].salidas.push(record.horaSalida);
        }
    });
    
    Object.values(studentGroups).forEach(group => {
        const student = group.estudiante;
        const hasEntry = group.entradas.length > 0;
        const hasExit = group.salidas.length > 0;
        
        let status = hasEntry && hasExit ? 'Completo' : 
                    hasEntry ? 'Solo entrada' : 'Ausente';
        
        // Calcular tiempo en plantel
        let tiempoEnPlantel = '';
        if (has