// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
// import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAP5PBi7HibZJPI-GyNKfnhlZh7EVSxxVA",
    authDomain: "pantry-74160.firebaseapp.com",
    projectId: "pantry-74160",
    storageBucket: "pantry-74160.appspot.com",
    messagingSenderId: "961375640433",
    appId: "1:961375640433:web:7627d58fa086846964f4d0",
    measurementId: "G-5SH7CXEZSB"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
//   const analytics = getAnalytics(app);
  const firestore = getFirestore(app);

  export {firestore}
