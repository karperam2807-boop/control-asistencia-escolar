// Variables globales
let currentStudentData = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎫 Generador de códigos QR iniciado');
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    const studentForm = document.getElementById('studentForm');
    const generateBulk = document.getElementById('generateBulk');
    const downloadPng = document.getElementById('downloadPng');
    const downloadSvg = document.getElementById('downloadSvg');
    const printQr = document.getElementById('printQr');
    
    if (studentForm) {
        studentForm.addEventListener('submit', handleFormSubmit);
    }
    
    if (generateBulk) {
        generateBulk.addEventListener('click', handleBulkGeneration);
    }
    
    if (downloadPng) {
        downloadPng.addEventListener('click', () => downloadQR('png'));
    }
    
    if (downloadSvg) {
        downloadSvg.addEventListener('click', () => downloadQR('svg'));
    }
    
    if (printQr) {
        printQr.addEventListener('click', printQRCode);
    }
    
    console.log('✅ Event listeners del generador configurados');
}

// Manejar envío del formulario
function handleFormSubmit(event) {
    event.preventDefault();
    
    // Obtener datos del formulario
    const matricula = document.getElementById('matricula').value.trim();
    const nombre = document.getElementById('nombre').value.trim();
    const grado = document.getElementById('grado').value;
    const grupo = document.getElementById('grupo').value;
    
    // Validar datos
    if (!matricula || !nombre || !grado || !grupo) {
        alert('❌ Por favor completa todos los campos');
        return;
    }
    
    // Crear objeto del estudiante
    currentStudentData = {
        matricula: matricula,
        nombre: nombre,
        grado: grado,
        grupo: grupo
    };
    
    console.log('👤 Generando QR para:', currentStudentData);
    
    // Generar código QR
    generateQRCode(currentStudentData);
}

// Generar código QR individual
function generateQRCode(studentData) {
    const qrDisplay = document.getElementById('qrDisplay');
    const studentInfo = document.getElementById('studentInfo');
    const qrCodeContainer = document.getElementById('qrCode');
    
    if (!qrDisplay || !studentInfo || !qrCodeContainer) {
        console.error('❌ Elementos del QR no encontrados');
        return;
    }
    
    // Mostrar información del estudiante
    studentInfo.innerHTML = `
        <h4>📝 Información del estudiante:</h4>
        <p><strong>Nombre:</strong> ${studentData.nombre}</p>
        <p><strong>Matrícula:</strong> ${studentData.matricula}</p>
        <p><strong>Grado y Grupo:</strong> ${studentData.grado}° ${studentData.grupo}</p>
    `;
    
    // Preparar datos JSON para el QR
    const qrData = JSON.stringify(studentData);
    
    // Limpiar contenedor anterior
    qrCodeContainer.innerHTML = '';
    
    // Generar QR usando la librería QRCode
    QRCode.toCanvas(qrData, {
        width: 300,
        height: 300,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        }
    }, function(error, canvas) {
        if (error) {
            console.error('❌ Error generando QR:', error);
            qrCodeContainer.innerHTML = '<p style="color: red;">Error generando código QR</p>';
            return;
        }
        
        // Agregar canvas al contenedor
        qrCodeContainer.appendChild(canvas);
        
        // Mostrar sección de QR
        qrDisplay.style.display = 'block';
        
        // Scroll hacia el QR
        qrDisplay.scrollIntoView({ behavior: 'smooth' });
        
        console.log('✅ QR generado correctamente');
        
        // Mostrar notificación
        showNotification(`✅ Código QR generado para ${studentData.nombre}`);
    });
}

// Manejar generación masiva
function handleBulkGeneration() {
    const csvInput = document.getElementById('csvInput');
    const bulkResults = document.getElementById('bulkResults');
    
    if (!csvInput || !csvInput.value.trim()) {
        alert('❌ Por favor ingresa la lista de estudiantes');
        return;
    }
    
    const csvData = csvInput.value.trim();
    const lines = csvData.split('\n');
    
    console.log('👥 Generando QRs masivos para', lines.length, 'estudiantes');
    
    // Limpiar resultados anteriores
    bulkResults.innerHTML = '<h3>🚀 Generando códigos QR...</h3>';
    
    // Procesar cada línea
    const students = [];
    const errors = [];
    
    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const parts = line.split(',').map(part => part.trim());
        
        if (parts.length !== 4) {
            errors.push(`Línea ${lineNumber}: Formato incorrecto (necesita 4 campos)`);
            return;
        }
        
        const [matricula, nombre, grado, grupo] = parts;
        
        if (!matricula || !nombre || !grado || !grupo) {
            errors.push(`Línea ${lineNumber}: Campos vacíos`);
            return;
        }
        
        students.push({ matricula, nombre, grado, grupo });
    });
    
    if (errors.length > 0) {
        alert('❌ Errores encontrados:\n' + errors.join('\n'));
        return;
    }
    
    // Generar QRs
    generateBulkQRs(students);
}

// Generar múltiples QRs
function generateBulkQRs(students) {
    const bulkResults = document.getElementById('bulkResults');
    
    let html = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
    `;
    
    let completed = 0;
    const total = students.length;
    
    students.forEach((student, index) => {
        const qrData = JSON.stringify(student);
        
        // Crear contenedor para este estudiante
        const studentContainer = document.createElement('div');
        studentContainer.style.cssText = `
            border: 2px solid #ddd;
            border-radius: 10px;
            padding: 15px;
            text-align: center;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        `;
        
        studentContainer.innerHTML = `
            <h4 style="margin: 0 0 10px 0; color: #2c3e50;">${student.nombre}</h4>
            <p style="margin: 5px 0; font-size: 0.9em; color: #666;">
                Mat: ${student.matricula} | ${student.grado}° ${student.grupo}
            </p>
            <div id="qr-${index}" style="margin: 15px 0;"></div>
            <button onclick="downloadStudentQR(${index}, '${student.nombre}')" 
                    style="background: #007bff; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-size: 0.9em;">
                📥 Descargar
            </button>
        `;
        
        // Generar QR para este estudiante
        QRCode.toCanvas(qrData, {
            width: 200,
            height: 200,
            margin: 1
        }, function(error, canvas) {
            if (error) {
                console.error('❌ Error generando QR para', student.nombre, error);
                return;
            }
            
            const qrContainer = studentContainer.querySelector(`#qr-${index}`);
            if (qrContainer) {
                qrContainer.appendChild(canvas);
            }
            
            completed++;
            if (completed === total) {
                console.log('✅ Todos los QRs generados');
                showNotification(`✅ ${total} códigos QR generados correctamente`);
            }
        });
        
        // Agregar al contenedor principal
        if (index === 0) {
            bulkResults.innerHTML = '<h3>📱 Códigos QR generados:</h3>';
        }
        bulkResults.appendChild(studentContainer);
    });
}

// Descargar QR individual
function downloadQR(format) {
    if (!currentStudentData) {
        alert('❌ No hay código QR para descargar');
        return;
    }
    
    const canvas = document.querySelector('#qrCode canvas');
    if (!canvas) {
        alert('❌ No se encontró el código QR');
        return;
    }
    
    const fileName = `QR_${currentStudentData.matricula}_${currentStudentData.nombre.replace(/\s+/g, '_')}`;
    
    if (format === 'png') {
        // Descargar como PNG
        const link = document.createElement('a');
        link.download = `${fileName}.png`;
        link.href = canvas.toDataURL();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('📥 Imagen PNG descargada');
    } else if (format === 'svg') {
        // Para SVG necesitaríamos generar nuevamente
        alert('🔧 Función SVG en desarrollo. Usa PNG por ahora.');
    }
}

// Descargar QR de estudiante específico (para generación masiva)
function downloadStudentQR(index, nombre) {
    const canvas = document.querySelector(`#qr-${index} canvas`);
    if (!canvas) {
        alert('❌ No se encontró el código QR');
        return;
    }
    
    const fileName = `QR_${nombre.replace(/\s+/g, '_')}`;
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`📥 QR de ${nombre} descargado`);
}

// Imprimir código QR
function printQRCode() {
    if (!currentStudentData) {
        alert('❌ No hay código QR para imprimir');
        return;
    }
    
    const canvas = document.querySelector('#qrCode canvas');
    const studentInfo = document.getElementById('studentInfo');
    
    if (!canvas || !studentInfo) {
        alert('❌ No se encontró el código QR');
        return;
    }
    
    // Crear ventana de impresión
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Código QR - ${currentStudentData.nombre}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                    padding: 20px;
                }
                .student-info {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 10px;
                    margin: 20px 0;
                    border: 2px solid #dee2e6;
                }
                .qr-code {
                    margin: 20px 0;
                }
                h1 { color: #2c3e50; }
                p { margin: 5px 0; }
            </style>
        </head>
        <body>
            <h1>🎫 Código QR de Estudiante</h1>
            <div class="student-info">
                <h3>${currentStudentData.nombre}</h3>
                <p><strong>Matrícula:</strong> ${currentStudentData.matricula}</p>
                <p><strong>Grado y Grupo:</strong> ${currentStudentData.grado}° ${currentStudentData.grupo}</p>
            </div>
            <div class="qr-code">
                <img src="${canvas.toDataURL()}" style="max-width: 300px; height: auto;">
            </div>
            <p style="font-size: 0.8em; color: #666; margin-top: 30px;">
                Sistema de Control de Asistencia Escolar
            </p>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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

// Exponer función globalmente para los botones dinámicos
window.downloadStudentQR = downloadStudentQR;

console.log('✅ Generador.js cargado completamente');

if (typeof qrImage !== 'undefined' && qrImage) {
// QR 18mm nítido (pantalla/imprimir)
qrImage.style.cssText = `
  width: 18mm;
  height: 18mm;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  image-rendering: -webkit-optimize-contrast;
  background: #FFFFFF;
  border: 2px solid #000000;
  padding: 0.8mm;
  box-shadow: inset 0 0 0 1px white;
  border-radius: 1.5mm;
  filter: none;
  -webkit-filter: none;
`;
}
