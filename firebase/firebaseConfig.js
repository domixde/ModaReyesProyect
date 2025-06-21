// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBspx-Hnnb-y-xXTr-z5lJj0_XEYppo2QM",
  authDomain: "modareyes-59991.firebaseapp.com",
  projectId: "modareyes-59991",
  storageBucket: "modareyes-59991.firebasestorage.app",
  messagingSenderId: "49086566305",
  appId: "1:49086566305:web:44a0a1cb688c25f1f385e0",
  measurementId: "G-CSN0MT6CXZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app };  // Exporta la app para que pueda ser utilizada en otros archivos