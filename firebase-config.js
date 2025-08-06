// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDmpergavNwhdwXGGJvXSyUbKYivIZwLDY",
  authDomain: "my-web-app-d807d.firebaseapp.com",
  projectId: "my-web-app-d807d",
  storageBucket: "my-web-app-d807d.firebasestorage.app",
  messagingSenderId: "196251072527",
  appId: "1:196251072527:web:499282ee4d7530a3ef8b7a",
  measurementId: "G-E294PP579Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
