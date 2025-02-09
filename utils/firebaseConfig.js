// 必要なFirebase SDKをインポート
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // ← これを追加

// Firebaseの設定
const firebaseConfig = {
  apiKey: "AIzaSyD8jGq_3XATm3Rjg4fzKKyEw0MNG00j8Vo",
  authDomain: "monad-word-wolf.firebaseapp.com",
  databaseURL: "https://monad-word-wolf-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "monad-word-wolf",
  storageBucket: "monad-word-wolf.firebasestorage.app",
  messagingSenderId: "981917127623",
  appId: "1:981917127623:web:7f50b8215f70cf637cffe2",
  measurementId: "G-28WCYMNMM9"
};

// Firebaseアプリの初期化
const app = initializeApp(firebaseConfig);

// Realtime Database の取得
const database = getDatabase(app); // ← これが正しく動作するよう修正

// databaseをエクスポート
export { database };
