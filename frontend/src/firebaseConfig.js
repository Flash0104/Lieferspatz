import { initializeApp } from "firebase/app";
import { FacebookAuthProvider, GoogleAuthProvider, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyCVtfDCPZna5aRrqBnc_T0Fhqf2GhIpFNM",
  authDomain: "lieferspatz-20cf5.firebaseapp.com",
  projectId: "lieferspatz-20cf5",
  storageBucket: "lieferspatz-20cf5.appspot.com",
  messagingSenderId: "81106997823",
  appId: "1:81106997823:web:0f089e7d419952c03bde8a",
  measurementId: "G-NX8GKP1RKG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const db = getFirestore(app);

export { auth, db, facebookProvider, googleProvider };

