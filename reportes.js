// ARCHIVO COMPLETO: fix_reports_data.js
// Añadir al final de reportes.js - Funciones de debugging y corrección

// Función para verificar y reparar datos
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

// Función para añadir datos de ejemplo
function addSampleData() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const now = new Date();
    
    const sampleRecords = [
        // Registros de hoy
        {
            id: Date.now(),
            matricula: "2508CETIS045G1P1001",
            nombre: "PÉREZ GARCÍA JUAN CARLOS",
            grado: "1",
            grupo: "A",
            fecha: today,
            horaEntrada: now.toLocaleTimeString('es-ES'),
            horaSalida: null
        },
        {
            id: Date.now() + 1,
            matricula: "2508CETIS045G1P1002",
            nombre: "LÓPEZ MARTÍNEZ MARÍA FERNANDA",
            grado: "1",
            grupo: "A",
            fecha: today,
            horaEntrada: new Date(now.getTime() - 60000).toLocaleTimeString('es-ES'),
            horaSalida: now.toLocaleTimeString('es-ES')
        },
        {
            id: Date.now() + 2,
            matricula: "2508CETIS045G1P1003",
            nombre: "GONZÁLEZ RODRÍGUEZ LUIS MIGUEL",
            grado: "1",
            grupo: "B",
            fecha: today,
            horaEntrada: new Date(now.getTime() - 120000).toLocaleTimeString('es-ES'),
            horaSalida: null
        },
        {
            id: Date.now() + 3,
            matricula: "2508CETIS045G1P1004",
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
            matricula: "2508CETIS045G1P1001",
            nombre: "PÉREZ GARCÍA JUAN CARLOS",
            grado: "1",
            grupo: "A",
            fecha: yesterday,
            horaEntrada: "08:15:30",
            horaSalida: "14:30:15"
        },
        {
            id: Date.now() + 5,
            matricula: "2508CETIS045G1P1002",
            nombre: "LÓPEZ MARTÍNEZ MARÍA FERNANDA",
            grado: "1",
            grupo: "A",
            fecha: yesterday,
            horaEntrada: "08:20:00",
            horaSalida: "14:25:45"
        }
    ];
    
    localStorage.setItem('attendanceRecords', JSON.stringify(sampleRecords));
    console.log('✅ Datos de ejemplo añadidos');
    
    // Recargar datos
    loadAllRecords();
    filterToday();
    
    showNotification('🎯 Datos de ejemplo añadidos\n📊 ' + sampleRecords.length + ' registros creados\n📅 2 días con datos (hoy y ayer)', 'success', 4000);
}

// Función para reparar estructura de registros
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

// Función mejorada para cargar registros
function loadAllRecords() {
    try {
        const savedRecords = localStorage.getItem('attendanceRecords');
        if (savedRecords) {
            allRecords = JSON.parse(savedRecords);
            console.log('📚 Registros cargados para reportes:', allRecords.length);
            
            if (allRecords.length === 0) {
                console.log('📝 No hay registros, añadiendo datos de ejemplo');
                addSampleData();
            }
        } else {
            allRecords = [];
            console.log('ℹ️ No hay registros guardados, añadiendo datos de ejemplo');
            addSampleData();
        }
    } catch (error) {
        console.error('⚠️ Error cargando registros:', error);
        allRecords = [];
        showNotification('⚠️ Error cargando datos. Se han añadido datos de ejemplo.', 'warning');
        addSampleData();
    }
}

// Función mejorada de filtrado por fecha
function filterByDate() {
    const dateInput = document.getElementById('dateInput');
    if (!dateInput || !dateInput.value) {
        showNotification('⚠️ Por favor selecciona una fecha', 'warning');
        return;
    }
    
    const selectedDate = dateInput.value;
    console.log('🔍 Filtrando por fecha:', selectedDate);
    
    // Recargar datos desde localStorage
    loadAllRecords();
    
    filteredRecords = allRecords.filter(record => {
        const match = record.fecha === selectedDate;
        if (match) {
            console.log('✅ Registro encontrado:', record.nombre, record.fecha);
        }
        return match;
    });
    
    console.log('📊 Registros filtrados:', filteredRecords.length);
    console.log('📋 Registros:', filteredRecords);
    
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

// Función para hoy mejorada
function filterToday() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('dateInput');
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

// NUEVA FUNCIÓN: Filtrar esta semana
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

// Función de debugging completa
function debugReports() {
    console.log('🔍 === DEBUG REPORTES CETIS 45 ===');
    console.log('📊 Estado actual del sistema:');
    console.log('- allRecords.length:', allRecords.length);
    console.log('- filteredRecords.length:', filteredRecords.length);
    
    const rawData = localStorage.getItem('attendanceRecords');
    console.log('- localStorage data:', rawData ? 'EXISTS' : 'EMPTY');
    
    if (rawData) {
        try {
            const parsed = JSON.parse(rawData);
            console.log('- localStorage records:', parsed.length);
            console.log('- Sample record:', parsed[0]);
            
            const dates = [...new Set(parsed.map(r => r.fecha))];
            console.log('- Available dates:', dates);
            
            const today = new Date().toISOString().split('T')[0];
            const todayRecords = parsed.filter(r => r.fecha === today);
            console.log('- Today records:', todayRecords.length);
            
            // Mostrar resumen por fecha
            dates.forEach(date => {
                const dayRecords = parsed.filter(r => r.fecha === date);
                console.log(`- ${date}: ${dayRecords.length} registros`);
            });
            
        } catch (e) {
            console.log('- Parse error:', e.message);
        }
    }
    
    // Verificar elementos DOM
    console.log('📋 Elementos DOM:');
    console.log('- dateInput:', document.getElementById('dateInput') ? 'OK' : 'MISSING');
    console.log('- reportTableBody:', document.getElementById('reportTableBody') ? 'OK' : 'MISSING');
    console.log('- summaryStudents:', document.getElementById('summaryStudents') ? 'OK' : 'MISSING');
    
    console.log('🔍 === FIN DEBUG ===');
}

// NUEVA FUNCIÓN: Generar datos de múltiples días
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
                matricula: `2508CETIS045G1P100${j + 1}`,
                nombre: student,
                grado: String(Math.floor(j / 2) + 1),
                grupo: j % 2 === 0 ? "A" : "B",
                fecha: dateStr,
                horaEntrada: hasEntry ? `0${8 + Math.floor(Math.random() * 2)}:${15 + Math.floor(Math.random() * 30)}:${Math.floor(Math.random() * 60)}` : null,
                horaSalida: hasExit ? `1${4 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60)}:${Math.floor(Math.random() * 60)}` : null
            };
            
            records.push(record);
        }
    }
    
    localStorage.setItem('attendanceRecords', JSON.stringify(records));
    console.log('✅ Datos de múltiples días generados:', records.length, 'registros');
    
    loadAllRecords();
    filterToday();
    
    showNotification(`🎯 Datos históricos generados\n📊 ${records.length} registros\n📅 7 días con datos`, 'success', 4000);
}

// Añadir botón de debugging en desarrollo
function addDebugButtons() {
    const debugContainer = document.createElement('div');
    debugContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 10px;
    `;
    
    const buttons = [
        { text: '🔧 Verificar Datos', action: verifyAndRepairData },
        { text: '📊 Debug Info', action: debugReports },
        { text: '🎯 Datos Ejemplo', action: addSampleData },
        { text: '📅 Datos Históricos', action: generateMultipleDaysData },
        { text: '🗑️ Limpiar Datos', action: () => {
            if (confirm('¿Estás seguro de limpiar todos los datos?')) {
                localStorage.removeItem('attendanceRecords');
                allRecords = [];
                filteredRecords = [];
                updateReportDisplay();
                showNotification('🗑️ Datos limpiados', 'info');
            }
        }}
    ];
    
    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.textContent = btn.text;
        button.style.cssText = `
            background: linear-gradient(135deg, #8b1538, #a91d47);
            color: white;
            border: 2px solid #d4af37;
            padding: 8px 12px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            transition: all 0.3s ease;
        `;
        button.onmouseover = () => button.style.transform = 'translateY(-2px)';
        button.onmouseout = () => button.style.transform = 'translateY(0)';
        button.onclick = btn.action;
        debugContainer.appendChild(button);
    });
    
    document.body.appendChild(debugContainer);
    
    // Auto-hide después de 15 segundos
    setTimeout(() => {
        debugContainer.style.opacity = '0.3';
        debugContainer.style.pointerEvents = 'none';
    }, 15000);
}

// Inicializar debugging en desarrollo
if (window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname.includes('github.io')) {
    
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(addDebugButtons, 2000);
    });
}

// Exponer funciones útiles globalmente
window.verifyAndRepairData = verifyAndRepairData;
window.addSampleData = addSampleData;
window.debugReports = debugReports;
window.generateMultipleDaysData = generateMultipleDaysData;
window.filterThisWeek = filterThisWeek;

// Auto-verificar datos al cargar
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(verifyAndRepairData, 1000);
});

// FUNCIÓN MEJORADA: updateReportDisplay
function updateReportDisplay() {
    updateSummaryCards();
    updateReportTable();
    
    // Log para debugging
    console.log('📊 Actualizando display con', filteredRecords.length, 'registros');
}

// FUNCIÓN MEJORADA: updateSummaryCards
function updateSummaryCards() {
    const uniqueStudents = [...new Set(filteredRecords.map(record => record.matricula))];
    
    const studentsWithEntry = filteredRecords.filter(record => record.horaEntrada);
    const uniquePresent = [...new Set(studentsWithEntry.map(record => record.matricula))];
    
    const completeRecords = filteredRecords.filter(record => record.horaEntrada && record.horaSalida);
    const uniqueComplete = [...new Set(completeRecords.map(record => record.matricula))];
    
    const percentage = uniqueStudents.length > 0 ? 
        Math.round((uniquePresent.length / uniqueStudents.length) * 100) : 0;
    
    // Actualizar elementos con animación
    animateNumber('summaryStudents', uniqueStudents.length);
    animateNumber('summaryPresent', uniquePresent.length);
    animateNumber('summaryComplete', uniqueComplete.length);
    animateNumberWithPercent('summaryPercentage', percentage);
}

// FUNCIÓN NUEVA: Animar números
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

// FUNCIÓN NUEVA: Animar porcentajes
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

// Función mejorada para actualizar tabla
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
                <br><br>
                <button onclick="addSampleData()" style="
                    background: linear-gradient(135deg, #8b1538, #a91d47);
                    color: white;
                    border: 2px solid #d4af37;
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
                    <small>🆔 Mat: ${student.matricula}</small>
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

// CSS adicional para mejorar la tabla
const additionalStyles = `
<style>
.table-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
    gap: 10px;
    padding: 12px;
    border-bottom: 1px solid #ddd;
    font-size: 0.9em;
    align-items: center;
    transition: background-color 0.3s ease;
}

.table-row:hover {
    background-color: #f8f9fa;
    transform: translateX(2px);
}

.table-row:nth-child(even) {
    background: #f8f9fa;
}

.student-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.student-cell strong {
    color: #8b1538;
    font-size: 1em;
}

.student-cell small {
    color: #6c757d;
    font-size: 0.8em;
}

.time-cell {
    font-family: 'Courier New', monospace;
    font-size: 0.85em;
    text-align: center;
}

.status-present {
    color: #28a745;
    font-weight: bold;
    text-align: center;
}

.status-partial {
    color: #ffc107;
    font-weight: bold;
    text-align: center;
}

.status-absent {
    color: #dc3545;
    font-weight: bold;
    text-align: center;
}

.no-data {
    text-align: center;
    padding: 40px 20px;
    color: #6c757d;
    border: 2px dashed #dee2e6;
    border-radius: 15px;
    background: white;
    margin: 20px 0;
}

.no-data h3 {
    color: #8b1538;
    margin-bottom: 15px;
}

.no-data p {
    margin-bottom: 10px;
}

.summary-card {
    transition: transform 0.3s ease;
}

.summary-card:hover {
    transform: translateY(-3px);
}

@media (max-width: 768px) {
    .table-row {
        grid-template-columns: 1fr;
        gap: 8px;
        padding: 15px 10px;
        border: 1px solid #ddd;
        border-radius: 8px;
        margin-bottom: 10px;
    }
    
    .table-row > div {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 5px 0;
    }
    
    .table-row > div:before {
        content: attr(data-label);
        font-weight: bold;
        color: #8b1538;
    }
}
</style>
`;

// Inyectar estilos adicionales
if (!document.getElementById('additional-report-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'additional-report-styles';
    styleElement.innerHTML = additionalStyles;
    document.head.appendChild(styleElement);
}

console.log('✅ fix_reports_data.js cargado completamente - Versión COMPLETA');
console.log('🔧 Funciones disponibles:');
console.log('  - verifyAndRepairData()');
console.log('  - addSampleData()');
console.log('  - generateMultipleDaysData()');
console.log('  - debugReports()');
console.log('  - filterThisWeek()');
