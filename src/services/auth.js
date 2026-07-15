import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, signOut, sendPasswordResetEmail } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

// Función para obtener la IP pública
const getPublicIP = async () => {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip;
  } catch (error) {
    console.warn("No se pudo obtener la IP pública", error);
    return "IP Desconocida";
  }
};

// Función para loguear el acceso en Firestore
const logAccessToDB = async (email) => {
  try {
    const ip = await getPublicIP();
    const userAgent = navigator.userAgent;
    
    await addDoc(collection(db, "access_logs"), {
      email,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
      event: "LOGIN_SUCCESS"
    });
    console.log("Acceso registrado exitosamente.");
  } catch (error) {
    console.error("Error registrando el acceso:", error);
  }
};

// Login con persistencia LOCAL
export const loginWithEmail = async (email, password) => {
  try {
    // Configuramos para que la sesión NUNCA expire a menos que hagas logout manual
    await setPersistence(auth, browserLocalPersistence);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Registrar el acceso en background
    logAccessToDB(email);
    
    return userCredential.user;
  } catch (error) {
    console.error("Error en login:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error cerrando sesión:", error);
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error("Error enviando correo de recuperación:", error);
    throw error;
  }
};
