// firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAh9FcD2XvfYxnyj1SSfQohlSajqeDPw7A",
  authDomain: "gokqmp.firebaseapp.com",
  databaseURL: "https://gokqmp-default-rtdb.firebaseio.com",
  projectId: "gokqmp",
  storageBucket: "gokqmp.appspot.com",
  messagingSenderId: "36775330040",
  appId: "1:36775330040:web:c9bbd3694d2907db5e3b0d",
  measurementId: "G-RX1JTKQ3JJ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const database = getDatabase(app);
const firestore = getFirestore(app);

export { auth, firestore, database, ref, set, push, storage };
