// Variables globales
let allRecords = [];
let filteredRecords = [];

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Página de reportes iniciada');
    loadAllRecords();
    setupEventListeners();
    setTodayDate();
    filterToday();
});

// Configurar event listeners
function setupEventListeners() {
    const filterBtn = document.getElementById('filterBtn');
    const todayBtn = document.getElementById('todayBtn');
    const weekBtn = document.getElementById('weekBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const dateInput = document.getElementById('dateInput');
    
    if (filterBtn) filterBtn.addEventListener('click', filterByDate);
    if (todayBtn) todayBtn.addEventListener('click', filterToday);
    if (weekBtn) weekBtn.addEventListener('click', filterThisWeek);
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportToPDF);
    if (exportExcelBtn) exportExcelBtn.addEventListener('click', exportToExcel);
    if (dateInput) dateInput.addEventListener('change', filterByDate);
    
    console.log('✅ Event listeners de reportes configurados');
}

// Cargar todos los registros del localStorage
function loadAllRecords() {
    const savedRecords = localStorage.getItem('attendanceRecords');
    if (savedRecords) {
        allRecords = JSON.parse(savedRecords);
        console.log('📚 Registros cargados para reportes:', allRecords.length);
    } else {
        allRecords = [];
        console.log('ℹ️ No hay registros guardados');
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
        alert('Por favor selecciona una fecha');
        return;
    }
    
    const selectedDate = dateInput.value;
    filteredRecords = allRecords.filter(record => record.fecha === selectedDate);
    
    console.log(`🔍 Filtrando por fecha ${selectedDate}:`, filteredRecords.length, 'registros');
    updateReportDisplay();
}

// Filtrar registros de hoy
function filterToday() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('dateInput');
    if (dateInput) dateInput.value = today;
    
    filteredRecords = allRecords.filter(record => record.fecha === today);
    console.log(`📅 Filtrando registros de hoy:`, filteredRecords.length, 'registros');
    updateReportDisplay();
}

// Filtrar registros de esta semana
function filterThisWeek() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Domingo
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sábado
    
    const startDate = startOfWeek.toISOString().split('T')[0];
    const endDate = endOfWeek.toISOString().split('T')[0];
    
    filteredRecords = allRecords.filter(record => {
        return record.fecha >= startDate && record.fecha <= endDate;
    });
    
    console.log(`📆 Filtrando registros de esta semana:`, filteredRecords.length, 'registros');
    updateReportDisplay();
}

// Actualizar la visualización del reporte
function updateReportDisplay() {
    updateSummaryCards();
    updateReportTable();
}

// Actualizar tarjetas de resumen
function updateSummaryCards() {
    // Estudiantes únicos
    const uniqueStudents = [...new Set(filteredRecords.map(record => record.matricula))];
    
    // Estudiantes con al menos una entrada
    const studentsWithEntry = filteredRecords.filter(record => record.horaEntrada);
    const uniquePresent = [...new Set(studentsWithEntry.map(record => record.matricula))];
    
    // Estudiantes con entrada y salida completa
    const completeRecords = filteredRecords.filter(record => record.horaEntrada && record.horaSalida);
    const uniqueComplete = [...new Set(completeRecords.map(record => record.matricula))];
    
    // Calcular porcentaje (asumiendo que todos los estudiantes únicos deberían estar presentes)
    const percentage = uniqueStudents.length > 0 ? 
        Math.round((uniquePresent.length / uniqueStudents.length) * 100) : 0;
    
    // Actualizar DOM
    updateElement('summaryStudents', uniqueStudents.length);
    updateElement('summaryPresent', uniquePresent.length);
    updateElement('summaryComplete', uniqueComplete.length);
    updateElement('summaryPercentage', percentage + '%');
}

// Actualizar tabla de reportes
function updateReportTable() {
    const tableBody = document.getElementById('reportTableBody');
    if (!tableBody) return;
    
    if (filteredRecords.length === 0) {
        tableBody.innerHTML = `
            <div class="table-row">
                <div style="text-align: center; color: #6c757d; grid-column: 1 / -1; padding: 40px;">
                    No hay registros para la fecha seleccionada
                </div>
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
        
        if (hasEntry && hasExit) {
            status = 'Completo';
            statusClass = 'status-present';
        } else if (hasEntry) {
            status = 'Solo entrada';
            statusClass = 'status-present';
        } else {
            status = 'Ausente';
            statusClass = 'status-absent';
        }
        
        return `
            <div class="table-row">
                <div class="student-cell">
                    <div>${student.nombre}</div>
                    <div style="font-size: 0.8em; color: #6c757d;">Mat: ${student.matricula}</div>
                </div>
                <div>${student.grado}° ${student.grupo}</div>
                <div class="time-cell">${group.entradas.join(', ') || '-'}</div>
                <div class="time-cell">${group.salidas.join(', ') || '-'}</div>
                <div class="${statusClass}">${status}</div>
            </div>
        `;
    }).join('');
    
    tableBody.innerHTML = tableHTML;
}

// Función auxiliar para actualizar elementos
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Exportar a PDF (simulado)
function exportToPDF() {
    if (filteredRecords.length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    // Por ahora, mostrar los datos que se exportarían
    const dateRange = getDateRangeText();
    const summary = getSummaryText();
    
    alert(`📄 Exportación PDF (simulada)\n\n${dateRange}\n\n${summary}\n\nEn una versión completa, esto descargaría un PDF real.`);
    
    console.log('📄 Datos preparados para PDF:', filteredRecords);
}

// Exportar a Excel (CSV)
function exportToExcel() {
    if (filteredRecords.length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    // Generar CSV
    const csvContent = generateDetailedCSV();
    
    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        const dateRange = getDateRangeText().replace(/[^\w\-]/g, '_');
        link.setAttribute('download', `reporte_asistencia_${dateRange}.csv`);
        
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('📊 Archivo Excel descargado correctamente');
    }
}

// Generar CSV detallado
function generateDetailedCSV() {
    const headers = [
        'Fecha', 'Matrícula', 'Nombre', 'Grado', 'Grupo', 
        'Hora Entrada', 'Hora Salida', 'Estado'
    ];
    
    const csvRows = [headers.join(',')];
    
    // Agrupar por estudiante
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
    
    // Generar filas
    Object.values(studentGroups).forEach(group => {
        const student = group.estudiante;
        const hasEntry = group.entradas.length > 0;
        const hasExit = group.salidas.length > 0;
        
        let status = hasEntry && hasExit ? 'Completo' : 
                    hasEntry ? 'Solo entrada' : 'Ausente';
        
        const row = [
            student.fecha,
            student.matricula,
            `"${student.nombre}"`,
            student.grado,
            student.grupo,
            group.entradas.join('; ') || '',
            group.salidas.join('; ') || '',
            status
        ];
        
        csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
}

// Obtener texto del rango de fechas
function getDateRangeText() {
    const dateInput = document.getElementById('dateInput');
    if (dateInput && dateInput.value) {
        return `Fecha: ${dateInput.value}`;
    }
    return 'Rango de fechas no especificado';
}

// Obtener texto del resumen
function getSummaryText() {
    const students = document.getElementById('summaryStudents')?.textContent || '0';
    const present = document.getElementById('summaryPresent')?.textContent || '0';
    const complete = document.getElementById('summaryComplete')?.textContent || '0';
    const percentage = document.getElementById('summaryPercentage')?.textContent || '0%';
    
    return `Resumen:\n- Estudiantes únicos: ${students}\n- Presentes: ${present}\n- Completos: ${complete}\n- Porcentaje asistencia: ${percentage}`;
}

// Mostrar notificación
function showNotification(message) {
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
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

console.log('✅ Reportes.js cargado completamente');