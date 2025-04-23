import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyB9gHRbYpdqsaH45klHvjMzZXGr6NRqi6Y",
    authDomain: "hahai-ec5af.firebaseapp.com",
    projectId: "hahai-ec5af",
    storageBucket: "hahai-ec5af.appspot.com",
    messagingSenderId: "772379566979",
    appId: "1:772379566979:web:4cbffe29769dc24531ccb6"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { storage };
