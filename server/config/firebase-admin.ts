import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Khởi tạo Firebase Admin SDK cho Backend.
 * 
 * Có 2 cách cấu hình:
 * 1. Đặt file `serviceAccountKey.json` và trỏ GOOGLE_APPLICATION_CREDENTIALS.
 * 2. Điền FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY vào .env.
 * 
 * Nếu cả 2 đều không có, sẽ khởi tạo với Application Default Credentials (ADC).
 */
function initFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (clientEmail && privateKey && projectId) {
    // Cách 2: Dùng biến môi trường
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  // Mặc định: Application Default Credentials (hoặc GOOGLE_APPLICATION_CREDENTIALS)
  return initializeApp({ projectId });
}

const app = initFirebaseAdmin();

const databaseId = process.env.FIREBASE_DATABASE_ID;
export const adminDb = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

export default app;
