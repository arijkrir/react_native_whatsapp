// Import the functions you need from the SDKs you need
import app from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBMSn5BtQSQa1qr3YfJJEzD9S16T9ptFns",
  authDomain: "whatsapp-617e5.firebaseapp.com",
  databaseURL: "https://whatsapp-617e5-default-rtdb.firebaseio.com",
  projectId: "whatsapp-617e5",
  storageBucket: "whatsapp-617e5.firebasestorage.app",
  messagingSenderId: "972583520356",
  appId: "1:972583520356:web:8e4829928d7a8d73abb771",
  measurementId: "G-YRBKCK7W2K"
};

// Initialize Firebase
const firebase=app.initializeApp(firebaseConfig);
export default firebase;

import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://dwlzdljfcbrehhowrlor.supabase.co';
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3bHpkbGpmY2JyZWhob3dybG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3MDU5MzEsImV4cCI6MjA0ODI4MTkzMX0.O-jH66fdKJ6QgJENmx6_9wNpuz-sThf5ixQkTOXku74";
const supabase = createClient(supabaseUrl, supabaseKey);

export {supabase}