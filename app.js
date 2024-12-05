import { initializeApp } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import { getDatabase, ref, push, onValue, update } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-database.js";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.18.5/package/xlsx.mjs";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAvgL0rkaKqXDKrtV15BTdcGglQE57pJsA",
  authDomain: "pedidos-iag.firebaseapp.com",
  databaseURL: "https://pedidos-iag-default-rtdb.firebaseio.com",
  projectId: "pedidos-iag",
  storageBucket: "pedidos-iag.appspot.com",
  messagingSenderId: "775813436384",
  appId: "1:775813436384:web:4dba50e3fed84354e11185"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Configuración para Google API
function authenticateGoogle() {
  gapi.load("client:auth2", () => {
    gapi.client.init({
      apiKey: "AIzaSyAvgL0rkaKqXDKrtV15BTdcGglQE57pJsA",
      clientId: "775813436384-qt2link5p9gri0vgm1va1442crvhltdf.apps.googleusercontent.com",
      scope: "https://www.googleapis.com/auth/drive.file",
    }).then(() => {
      gapi.auth2.getAuthInstance().signIn().then(user => {
        const token = user.getAuthResponse().access_token;
        uploadReportToDrive(token, deliveredBlob);
      }).catch(error => console.error("Error en la autenticación:", error));
    });
  });
}

let deliveredOrders = [];
let deliveredBlob = null;

// Función para agregar pedidos entregados al reporte
function addDeliveredOrderToReport(orderId, category) {
  onValue(ref(db, `pedidos/${category}/${orderId}`), (snapshot) => {
    const order = snapshot.val();
    deliveredOrders.push(order);

    // Generar archivo Excel
    const worksheet = XLSX.utils.json_to_sheet(deliveredOrders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Entregados");

    // Convertir a Blob
    deliveredBlob = XLSX.write(workbook, { bookType: "xlsx", type: "blob" });
  }, { onlyOnce: true });
}

// Subir archivo a Google Drive
async function uploadReportToDrive(token, blob) {
  const formData = new FormData();
  formData.append("file", blob, "reporte_entregados.xlsx");

  try {
    const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.ok) {
      console.log("Archivo subido exitosamente");
    } else {
      console.error("Error al subir archivo:", response.statusText);
    }
  } catch (error) {
    console.error("Error en la solicitud de subida:", error);
  }
}

// Escuchar cambios de estado y gestionar pedidos entregados o no entregados
document.addEventListener("change", async (event) => {
  if (event.target.classList.contains("order-status")) {
    const orderId = event.target.closest("tr").dataset.id;
    const category = event.target.closest("table").id;
    const newStatus = event.target.value;

    try {
      await update(ref(db, `pedidos/${category}/${orderId}`), { status: newStatus });

      if (newStatus === "Entregado" || newStatus === "No Entregado") {
        event.target.closest("tr").nextElementSibling.remove();  // Elimina fila de notas
        event.target.closest("tr").remove();  // Elimina fila principal

        if (newStatus === "Entregado") {
          addDeliveredOrderToReport(orderId, category);
          authenticateGoogle(); // Llama a la autenticación para subir el archivo
        }
      }

      console.log("Estado actualizado");
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
    }
  }
});