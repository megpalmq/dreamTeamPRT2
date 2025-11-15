// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/d ocs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC74Yy1umbex7FlZbo3WLb9Skr3YRyDGDA",
  authDomain: "n423-6048d.firebaseapp.com",
  projectId: "n423-6048d",
  storageBucket: "n423-6048d.firebasestorage.app",
  messagingSenderId: "358545178901",
  appId: "1:358545178901:web:19ce544398e43bb601e91c",
  measurementId: "G-72TXE25F8B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export { app };