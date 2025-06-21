// main.js

// Importa las funciones necesarias de Firebase
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBspx-Hnnb-y-xXTr-z5lJj0_XEYppo2QM",
    authDomain: "modareyes-59991.firebaseapp.com",
    projectId: "modareyes-59991",
    storageBucket: "modareyes-59991.firebasestorage.app",
    messagingSenderId: "49086566305",
    appId: "1:49086566305:web:44a0a1cb688c25f1f385e0",
    measurementId: "G-CSN0MT6CXZ"
};

// Inicializa la aplicación Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

