import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD3cOCIeSTSJEcvWVwHicjDnUq-jpCk1JI",
  authDomain: "nowhere-nest.firebaseapp.com",
  projectId: "nowhere-nest",
  storageBucket: "nowhere-nest.firebasestorage.app",
  messagingSenderId: "345812162321",
  appId: "1:345812162321:web:f13ee9af312a5bed581eb0",
  measurementId: "G-VCX2BGFCLE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth & Google provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
