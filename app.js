import { initializeApp } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import { getDatabase, ref, push, update, onValue } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-database.js";
import ExcelJS from "https://cdn.jsdelivr.net/npm/exceljs/dist/exceljs.min.js";

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Configuración de Google API (Credenciales OAuth2)
const CLIENT_ID = "775813436384-qt2link5p9gri0vgm1va1442crvhltdf.apps.googleusercontent.com";
const API_KEY = "AIzaSyAvgL0rkaKqXDKrtV15BTdcGglQE57pJsA"; // Asegúrate de tener la API Key configurada
const SCOPES = "https://www.googleapis.com/auth/drive.file"; // Permiso para subir archivos
let auth2;

// Inicializar la autenticación de Google
function initAuth() {
  gapi.load("client:auth2", () => {
    gapi.auth2.init({
      client_id: CLIENT_ID,
    }).then(() => {
      auth2 = gapi.auth2.getAuthInstance();
    });
  });
}

// Autenticar al usuario
function authenticate() {
  return new Promise((resolve, reject) => {
    auth2.signIn().then(resolve, reject);
  });
}

// Cargar la librería de Google API
function loadClient() {
  return new Promise((resolve, reject) => {
    gapi.client.setApiKey(API_KEY);
    gapi.client.load("https://content.googleapis.com/discovery/v1/apis/drive/v3/rest").then(resolve, reject);
  });
}

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
      .then(() => {
        if (newStatus === "Entregado") {
          const orders = getAllOrders(); // Obtiene todos los pedidos con estado "Entregado"
          generateExcel(orders).then((fileContent) => {
            authenticate().then(() => {
              loadClient().then(() => {
                uploadToDrive(fileContent);
              });
            });
          });
        }
      })
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

// Función para obtener todos los pedidos con estado "Entregado"
function getAllOrders() {
  let orders = [];
  onValue(ref(db, "pedidos"), (snapshot) => {
    const ordersData = snapshot.val();
    if (ordersData) {
      Object.keys(ordersData).forEach((category) => {
        const categoryOrders = ordersData[category];
        Object.keys(categoryOrders).forEach((orderId) => {
          const order = categoryOrders[orderId];
          if (order.status === "Entregado") {
            orders.push(order);
          }
        });
      });
    }
  });
  return orders;
}

// Función para generar el archivo Excel
async function generateExcel(orders) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Pedidos");

  // Encabezados
  worksheet.addRow(["Cliente", "Número", "Fecha", "Hora", "Categoría", "Comanda", "Persona", "Notas", "Estado"]);

  orders.forEach(order => {
    const { client, number, date, time, category, comanda, person, notes, status } = order;
    worksheet.addRow([client, number, date, time, category, comanda, person, notes, status]);
  });

  // Guardar el archivo Excel en el navegador
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

// Función para subir el archivo a Google Drive
function uploadToDrive(fileContent) {
  const boundary = "-------314159265358979323846";
  const delimiter = "\r\n--" + boundary + "\r\n";
  const closeDelim = "\r\n--" + boundary + "--";

  const metadata = {
    name: "reporte_pedidos.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };

  const multipartRequestBody =
    delimiter +
    "Content-Type: application/json\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    "Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n" +
    fileContent +
    closeDelim;

  const request = gapi.client.request({
    path: "/upload/drive/v3/files?uploadType=multipart",
    method: "POST",
    body: multipartRequestBody,
    headers: {
      "Content-Type": "multipart/related; boundary=" + boundary,
    },
  });

  request.execute((file) => {
    console.log("Archivo subido a Google Drive: ", file);
  });
}

