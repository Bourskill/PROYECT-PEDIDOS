import { initializeApp } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, update } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-database.js";
import * as ExcelJS from "https://cdn.jsdelivr.net/npm/exceljs@4.3.0/dist/exceljs.min.js";


// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAvgL0rkaKqXDKrtV15BTdcGglQE57pJsA",
    authDomain: "pedidos-iag.firebaseapp.com",
    databaseURL: "https://pedidos-iag-default-rtdb.firebaseio.com",
    projectId: "pedidos-iag",
    storageBucket: "pedidos-iag.firebasestorage.app",
    messagingSenderId: "775813436384",
    appId: "1:775813436384:web:4dba50e3fed84354e11185"
};

// Inicializar Firebase (debe usar la función 'initializeApp')
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Mostrar el formulario de agregar pedido
document.getElementById("makeOrderBtn").addEventListener("click", () => {
    document.getElementById("orderForm").style.display = "block";
});

// Cerrar el formulario
document.querySelector(".close").addEventListener("click", () => {
    document.getElementById("orderForm").style.display = "none";
    document.getElementById("orderFormContent").reset();
});

// Agregar un nuevo pedido
document.getElementById("orderFormContent").addEventListener("submit", (e) => {
    e.preventDefault();

    const client = document.getElementById("client").value;
    const number = document.getElementById("number").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const category = document.getElementById("category").value;
    const comanda = document.getElementById("comanda").value;
    const person = document.getElementById("person").value;
    const notes = document.getElementById("notes").value;
    const status = "Por Revisar";

    push(ref(db, `pedidos/${category}`), {
        client,
        number,
        date,
        time,
        category,
        comanda,
        person,
        notes,
        status
    }).then(() => {
        document.getElementById("orderForm").style.display = "none";
        document.getElementById("orderFormContent").reset();
    }).catch(error => console.error("Error al agregar pedido:", error));
});

// Escuchar cambios en Firebase para actualizar la tabla
onValue(ref(db, "pedidos"), (snapshot) => {
    const orders = snapshot.val();
    document.querySelectorAll("table tbody").forEach(tbody => tbody.innerHTML = "");

    if (orders) {
        Object.keys(orders).forEach(category => {
            const categoryOrders = orders[category];
            Object.keys(categoryOrders).forEach(orderId => {
                const order = categoryOrders[orderId];
                addOrderToTable(order, orderId, category);
            });
        });
    }

    // Filtrar pedidos entregados y generar el reporte
    generateExcelReport(orders);
});

// Agregar pedidos a la tabla
function addOrderToTable(order, orderId, category) {
    const { client, number, date, time, comanda, person, notes, status } = order;
    const table = document.getElementById(category);

    if (!table) {
        console.warn(`La tabla con el id "${category}" no existe.`);
        return;
    }

    const tbody = table.querySelector("tbody");
    const row = document.createElement("tr");
    row.dataset.id = orderId;
    row.innerHTML = `
        <td>${comanda ? `#${comanda}<br>${person}` : ""}</td>
        <td>${client}<br>${number}</td>
        <td>${date} ${time}</td>
        <td>
            <select class="order-status">
                <option value="Por Revisar" ${status === "Por Revisar" ? "selected" : ""}>Por Revisar</option>
                <option value="Revisado" ${status === "Revisado" ? "selected" : ""}>Revisado</option>
                <option value="Por Aprobar" ${status === "Por Aprobar" ? "selected" : ""}>Por Aprobar</option>
                <option value="En Proceso" ${status === "En Proceso" ? "selected" : ""}>En Proceso</option>
                <option value="Entregado" ${status === "Entregado" ? "selected" : ""}>Entregado</option>
                <option value="No Entregado" ${status === "No Entregado" ? "selected" : ""}>No Entregado</option>
            </select>
        </td>
    `;
    tbody.appendChild(row);

    const notesRow = document.createElement("tr");
    notesRow.innerHTML = `
        <td colspan="3">${notes || "Sin notas"}</td>
        <td><button class="edit-notes">Editar</button></td>
    `;
    tbody.appendChild(notesRow);
}

// Actualizar el estado del pedido
document.addEventListener("change", (event) => {
    if (event.target.classList.contains("order-status")) {
        const orderId = event.target.closest("tr").dataset.id;
        const category = event.target.closest("table").id;
        const newStatus = event.target.value;

        update(ref(db, `pedidos/${category}/${orderId}`), { status: newStatus })
            .then(() => console.log("Estado actualizado"))
            .catch(error => console.error("Error al actualizar el estado:", error));
    }
});

// Editar notas
document.addEventListener("click", (event) => {
    if (event.target.classList.contains("edit-notes")) {
        const row = event.target.closest("tr").previousElementSibling;
        const orderId = row.dataset.id;
        const category = row.closest("table").id;
        const newNotes = prompt("Editar notas:", row.nextElementSibling.querySelector("td").textContent.trim());

        if (newNotes !== null) {
            update(ref(db, `pedidos/${category}/${orderId}`), { notes: newNotes })
                .then(() => console.log("Notas actualizadas"))
                .catch(error => console.error("Error al actualizar notas:", error));
        }
    }
});

// Generar el archivo Excel de pedidos entregados
function generateExcelReport(orders) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pedidos Entregados');

    worksheet.columns = [
        { header: 'ID', key: 'id' },
        { header: 'Cliente', key: 'client' },
        { header: 'Fecha', key: 'date' },
        { header: 'Estado', key: 'status' }
    ];

    // Filtra solo los pedidos que están "Entregados"
    Object.keys(orders).forEach(category => {
        const categoryOrders = orders[category];
        Object.keys(categoryOrders).forEach(orderId => {
            const order = categoryOrders[orderId];
            if (order.status === "Entregado") {
                worksheet.addRow({
                    id: orderId,
                    client: order.client,
                    date: order.date,
                    status: order.status
                });
            }
        });
    });

    // Escribir el archivo Excel en un buffer y luego subirlo
    workbook.xlsx.writeBuffer().then(function (buffer) {
        const file = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        uploadToGoogleDrive(file);
    });
}

// Subir el archivo a Google Drive
function uploadToGoogleDrive(file) {
    const fileMetadata = {
        'name': 'Pedidos_Entregados.xlsx',
        'mimeType': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };

    const media = {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: file
    };

    const request = gapi.client.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
    });

    request.execute(function (response) {
        if (response.id) {
            console.log('Archivo subido a Google Drive con ID:', response.id);
            alert('Archivo Excel subido correctamente!');
        } else {
            console.log('Error al subir el archivo');
        }
    });
}

// Cargar la API de Google Drive
function loadGoogleDriveAPI() {
    gapi.load('client:auth2', function () {
        gapi.auth2.init({ client_id: '775813436384-qt2link5p9gri0vgm1va1442crvhltdf.apps.googleusercontent.com' }).then(function () {
            console.log("API de Google Drive cargada.");
        });
    });
}
