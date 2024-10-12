import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { firebaseConfig } from "./firebaseConfig";
import { logError } from "./SaveLogs";

const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);

const KEY_STORAGE_NAME = "user_encryption_key";
const SYNC_COLLECTION_NAME = "user_data_sync";

// Hàm tạo khóa mã hóa
export const generateEncryptionKey = async () => {
  try {
    const key = await Crypto.getRandomBytesAsync(32);
    return Array.from(key)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  } catch (error) {
    logError("ERROR", "firestore.jsx-33: Lỗi khi tạo khóa mã hóa:" + error);
    throw error;
  }
};

// Hàm để lấy hoặc tạo khóa người dùng
export const getUserKey = async () => {
  try {
    let storedKey = await AsyncStorage.getItem(KEY_STORAGE_NAME);
    if (!storedKey) {
      storedKey = await generateEncryptionKey();
      await AsyncStorage.setItem(KEY_STORAGE_NAME, storedKey);
    }
    return storedKey;
  } catch (error) {
    logError(
      "ERROR",
      "firestore.jsx-48: Lỗi khi lấy hoặc tạo khóa người dùng:" + error
    );
    throw error;
  }
};

// Hàm mã hóa dữ liệu
export const encryptData = async (data, key) => {
  try {
    const jsonString = JSON.stringify(data);
    const encodedData = new TextEncoder().encode(jsonString);
    const encryptedData = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      jsonString + key
    );
    const base64Data = btoa(String.fromCharCode(...encodedData));
    return `${encryptedData}:${base64Data}`;
  } catch (error) {
    logError("ERROR", "firestore.jsx-66: Lỗi khi mã hóa dữ liệu:" + error);
    throw error;
  }
};

// Hàm giải mã dữ liệu
export const decryptData = async (encryptedData, key) => {
  try {
    const [hash, base64Data] = encryptedData.split(":");
    const decodedData = Uint8Array.from(atob(base64Data), (c) =>
      c.charCodeAt(0)
    );
    const jsonString = new TextDecoder().decode(decodedData);
    const verifyHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      jsonString + key
    );
    if (hash !== verifyHash) {
      throw new Error("Data integrity check failed");
    }
    return JSON.parse(jsonString);
  } catch (error) {
    logError("ERROR", "firestore.jsx-88: Lỗi khi giải mã dữ liệu:" + error);
    throw error;
  }
};

// Hàm thêm dữ liệu mã hóa
export const addEncryptedData = async (collectionName, data) => {
  const key = await getUserKey();
  const encryptedData = await encryptData(data, key);
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      encryptedData,
    });
    return docRef.id;
  } catch (e) {
    logError("ERROR", "firestore.jsx-103: Lỗi khi thêm dữ liệu:" + e);
    throw e;
  }
};

// Hàm đọc và giải mã dữ liệu
export const readAndDecryptData = async (collectionName, docId) => {
  try {
    const key = await getUserKey();
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const encryptedData = docSnap.data().encryptedData;
      return await decryptData(encryptedData, key);
    } else {
      logError("INFO", "firestore.jsx-118: Không tìm thấy dữ liệu");
      return null;
    }
  } catch (e) {
    logError("ERROR", "firestore.jsx-122: Lỗi khi đọc dữ liệu:" + e);
    throw e;
  }
};

// Hàm cập nhật dữ liệu mã hóa
export const updateEncryptedData = async (collectionName, docId, newData) => {
  const key = await getUserKey();
  const encryptedData = await encryptData(newData, key);
  try {
    await updateDoc(doc(db, collectionName, docId), { encryptedData });
  } catch (e) {
    logError("ERROR", "firestore.jsx-134: Lỗi khi cập nhật dữ liệu:" + e);
    throw e;
  }
};

// Hàm xóa dữ liệu
export const deleteData = async (collectionName, docId) => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (e) {
    logError("ERROR", "firestore.jsx-144: Lỗi khi xóa dữ liệu:" + e);
    throw e;
  }
};

// Hàm để đồng bộ dữ liệu từ AsyncStorage lên Firestore
export const syncAsyncStorageToFirestore = async (userId) => {
  try {
    const key = await getUserKey();
    const userGhiChu = await AsyncStorage.getItem("userGhiChu");
    if (userGhiChu) {
      const encryptedData = await encryptData(JSON.parse(userGhiChu), key);
      await setDoc(doc(db, SYNC_COLLECTION_NAME, userId), {
        encryptedData,
      });
    } else {
      logError("INFO", "firestore.jsx-160: Không tìm thấy dữ liệu để đồng bộ");
    }
  } catch (error) {
    logError("ERROR", "firestore.jsx-163: Lỗi khi đồng bộ dữ liệu:" + error);
    throw error;
  }
};

// Hàm để lấy và giải mã dữ liệu đồng bộ từ Firestore
export const getDecryptedSyncDataFromFirestore = async (userId) => {
  try {
    const key = await getUserKey();
    const docRef = doc(db, SYNC_COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const encryptedData = docSnap.data().encryptedData;
      return await decryptData(encryptedData, key);
    } else {
      logError("INFO", "firestore.jsx-179: Không tìm thấy dữ liệu đồng bộ");
      return null;
    }
  } catch (error) {
    logError("ERROR", "firestore.jsx-183: Lỗi khi lấy dữ liệu đồng bộ:" + error);
    throw error;
  }
};

// Hàm để khôi phục dữ liệu đồng bộ từ Firestore vào AsyncStorage
export const restoreSyncDataToAsyncStorage = async (userId) => {
  try {
    const decryptedData = await getDecryptedSyncDataFromFirestore(userId);
    if (decryptedData) {
      await AsyncStorage.setItem("userGhiChu", JSON.stringify(decryptedData));
    } else {
      logError("INFO", "firestore.jsx-195: Không tìm thấy dữ liệu đồng bộ");
    }
  } catch (error) {
    logError("ERROR", "firestore.jsx-198: Lỗi khi khôi phục dữ liệu:" + error);
    throw error;
  }
};
