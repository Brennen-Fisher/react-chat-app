import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAw83er0zUuA8ojuGAHxdVFrzO7EhM39kc",
    authDomain: "react-chat-app-cf837.firebaseapp.com",
    projectId: "react-chat-app-cf837",
    storageBucket: "react-chat-app-cf837.appspot.com",
    messagingSenderId: "546548669925",
    appId: "1:546548669925:web:98fe1500f32ccfb3d9230c",
    measurementId: "G-77EPKSWWJV"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const storage = getStorage();
export const db = getFirestore()