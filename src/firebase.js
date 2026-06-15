import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBomXykf8VkCn4x8Mq-nj0CCZVF9cwywoE",
  authDomain: "juntada-app-6a447.firebaseapp.com",
  projectId: "juntada-app-6a447",
  storageBucket: "juntada-app-6a447.firebasestorage.app",
  messagingSenderId: "511509450342",
  appId: "1:511509450342:web:021fd56c9ae74a7417a7a7"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
