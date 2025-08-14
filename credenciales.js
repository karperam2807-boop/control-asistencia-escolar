// ================================
// GENERADOR DE CREDENCIALES CETIS 45
// ================================

// Variables globales
let currentStudentData = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎫 Generador de credenciales CETIS 45 iniciado');
    setupEventListeners();
    showWelcomeMessage();
});

// Mostrar mensaje de bienvenida
function showWelcomeMessage() {
    setTimeout(() => {
        showNotification('🎫 Generador de Credenciales CETIS 45\n¡Crea credenciales profesionales para tus estudiantes!', 'info', 3000);
    }, 1000);
}

// Event listeners mejorados
function setupEventListeners() {
    const studentForm = document.getElementById('studentForm');
    
    if (studentForm) {
        studentForm.addEventListener('submit', handleFormSubmit);
    }
    
    console.log('✅ Event listeners del generador configurados');
}

// Función para generar URL del QR
function generateQRURL(data, size = 200) {
    const encodedData = encodeURIComponent(data);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&margin=0`;
}

// Manejar envío del formulario
function handleFormSubmit(event) {
    event.preventDefault();
    
    const matricula = document.getElementById('matricula').value.trim();
    const nombre = document.getElementById('nombre').value.trim().toUpperCase();
    const grado = document.getElementById('grado').value;
    const grupo = document.getElementById('grupo').value;
    
    if (!matricula || !nombre || !grado || !grupo) {
        showNotification('⚠️ Por favor completa todos los campos', 'warning');
        return;
    }
    
    generateCredential({ matricula, nombre, grado, grupo });
}

// Generar credencial
function generateCredential(studentData) {
    // Actualizar información en la credencial
    document.getElementById('credentialName').textContent = studentData.nombre;
    document.getElementById('credentialMatricula').textContent = studentData.matricula;
    document.getElementById('credentialGrado').textContent = studentData.grado + '°';
    document.getElementById('credentialGrupo').textContent = studentData.grupo;
    
    // Generar QR
    const qrData = JSON.stringify(studentData);
    const qrURL = generateQRURL(qrData, 150);
    document.getElementById('qrCodeImage').src = qrURL;
    
    // Guardar datos actuales
    currentStudentData = studentData;
    
    // Mostrar credencial
    document.getElementById('credentialPreview').classList.remove('hidden');
    
    // Scroll hacia la credencial
    document.getElementById('credentialPreview').scrollIntoView({ 
        behavior: 'smooth' 
    });
    
    // Notificación
    showNotification(`✅ Credencial generada para ${studentData.nombre}`, 'success');
}

// Imprimir credencial
function printCredential() {
    if (!currentStudentData) {
        showNotification('⚠️ No hay credencial para imprimir', 'warning');
        return;
    }
    
    const credential = document.getElementById('credential').outerHTML;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Credencial CETIS 45 - ${currentStudentData.nombre}</title>
            <link rel="stylesheet" href="styles.css">
            <style>
                body { 
                    background: white; 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    min-height: 100vh;
                    margin: 0;
                    padding: 20px;
                }
                .credential { 
                    transform: scale(2); 
                    margin: 50px;
                }
                @media print {
                    body { 
                        margin: 0; 
                        background: white;
                    }
                    .credential { 
                        transform: scale(1.8);
                        margin: 20mm;
                        page-break-inside: avoid;
                    }
                }
                .no-print {
                    display: block;
                    text-align: center;
                    margin-bottom: 20px;
                }
                @media print {
                    .no-print { display: none; }
                }
                .print-btn {
                    background: linear-gradient(135deg, #8b1538, #a91d47);
                    color: white;
                    border: 2px solid #d4af37;
                    padding: 10px 20px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-weight: 600;
                    margin: 0 5px;
                }
            </style>
        </head>
        <body>
            <div class="no-print">
                <h2 style="color: #8b1538;">🎫 Credencial CETIS No. 45</h2>
                <p><strong>${currentStudentData.nombre}</strong></p>
                <button class="print-btn" onclick="window.print()">🖨️ Imprimir</button>
                <button class="print-btn" onclick="window.close()">❌ Cerrar</button>
            </div>
            ${credential}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    showNotification('🖨️ Ventana de impresión abierta', 'info');
}

// Generar PDF individual
function generatePDFCredential() {
    if (!currentStudentData) {
        showNotification('⚠️ No hay credencial para generar PDF', 'warning');
        return;
    }
    
    generateCredentialsHTML([currentStudentData]);
    showNotification(`📄 PDF generado para ${currentStudentData.nombre}`, 'success');
}

// Generar credenciales masivas
function generateBulkCredentials() {
    const csvInput = document.getElementById('csvInput');
    
    if (!csvInput || !csvInput.value.trim()) {
        showNotification('⚠️ Por favor ingresa la lista de estudiantes en formato CSV', 'warning');
        return;
    }
    
    const students = parseCSVStudents(csvInput.value.trim());
    
    if (students.length === 0) {
        showNotification('⚠️ No se encontraron estudiantes válidos en el formato CSV', 'error');
        return;
    }
    
    generateBulkCredentialsWindow(students);
}

// Parsear estudiantes CSV
function parseCSVStudents(csvData) {
    const lines = csvData.split('\n');
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
        
        students.push({
            matricula: matricula,
            nombre: nombre.toUpperCase(),
            grado: grado,
            grupo: grupo
        });
    });
    
    if (errors.length > 0) {
        showNotification('⚠️ Errores encontrados:\n' + errors.join('\n'), 'error');
        return [];
    }
    
    return students;
}

// Generar ventana con múltiples credenciales
function generateBulkCredentialsWindow(students) {
    const credentialsWindow = window.open('', '_blank', 'width=1200,height=800');
    
    let credentialsHTML = '';
    students.forEach(student => {
        const qrData = JSON.stringify(student);
        const qrURL = generateQRURL(qrData, 150);
        
        credentialsHTML += `
            <div class="credential" style="margin: 20px; display: inline-block; transform: scale(0.8);">
                <div class="credential-header">
                    <div class="credential-logos">
                        <div class="credential-logo">SEP</div>
                        <div class="credential-institution">
                            <div class="credential-institution-name">CETIS No. 45</div>
                            <div class="credential-institution-subtitle">
                                Centro de Estudios Tecnológicos<br>
                                Industrial y de Servicios
                            </div>
                        </div>
                        <div class="credential-logo">DG</div>
                    </div>
                </div>
                
                <div class="credential-body">
                    <div class="student-section">
                        <div class="photo-placeholder">👤</div>
                        <div class="student-name">${student.nombre}</div>
                        <div class="student-details">
                            <div><span>Matrícula:</span><span>${student.matricula}</span></div>
                            <div><span>Grado:</span><span>${student.grado}°</span></div>
                            <div><span>Grupo:</span><span>${student.grupo}</span></div>
                            <div><span>Ciclo:</span><span>2025-2026</span></div>
                        </div>
                    </div>
                    
                    <div class="qr-section">
                        <img class="qr-code-img" src="${qrURL}" alt="Código QR">
                        <div class="qr-label">CÓDIGO<br>ASISTENCIA</div>
                    </div>
                </div>
                
                <div class="credential-footer">
                    #OrgullosamenteCETIS45 | Sistema de Control de Asistencia
                </div>
            </div>
        `;
    });
    
    credentialsWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Credenciales Masivas - CETIS 45</title>
            <link rel="stylesheet" href="styles.css">
            <style>
                body { 
                    background: white; 
                    padding: 20px;
                    text-align: center;
                }
                .credential { 
                    page-break-inside: avoid;
                }
                h1 {
                    color: #8b1538;
                    margin-bottom: 30px;
                }
                .actions {
                    margin: 30px 0;
                    text-align: center;
                }
                .btn {
                    background: linear-gradient(135deg, #8b1538, #a91d47);
                    color: white;
                    border: 2px solid #d4af37;
                    padding: 12px 25px;
                    margin: 0 10px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: 600;
                }
                @media print {
                    .actions { display: none; }
                    .credential { 
                        transform: scale(0.7) !important;
                        margin: 10px !important;
                    }
                }
            </style>
        </head>
        <body>
            <h1>🎫 Credenciales CETIS No. 45 - ${students.length} estudiantes</h1>
            <div class="actions">
                <button class="btn" onclick="window.print()">🖨️ Imprimir Todas</button>
                <button class="btn" onclick="window.close()">❌ Cerrar</button>
            </div>
            <div class="credentials-container">
                ${credentialsHTML}
            </div>
        </body>
        </html>
    `);
    
    credentialsWindow.document.close();
    
    showNotification(`🎫 ${students.length} credenciales generadas exitosamente`, 'success');
}

// Generar PDF masivo (4 por hoja)
function generateBulkPDF() {
    const csvInput = document.getElementById('csvInput').value.trim();
    
    if (!csvInput) {
        showNotification('⚠️ Por favor ingresa la lista de estudiantes primero', 'warning');
        return;
    }
    
    const students = parseCSVStudents(csvInput);
    
    if (students.length === 0) {
        showNotification('⚠️