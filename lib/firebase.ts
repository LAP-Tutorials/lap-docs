// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB4N6NwT9F9yfsWzHiu1fJgjnq4MPfSaFA",
  authDomain: "lap-docs-c9078.firebaseapp.com",
  projectId: "lap-docs-c9078",
  storageBucket: "lap-docs-c9078.firebasestorage.app",
  messagingSenderId: "897960732857",
  appId: "1:897960732857:web:7037496fccfa4fd0f61368",
  measurementId: "G-E1SC722RF2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);