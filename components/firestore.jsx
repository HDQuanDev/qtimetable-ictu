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
    console.error("Error generating encryption key:", error);
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
    console.error("Error managing user key:", error);
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
    console.error("Error encrypting data:", error);
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
    console.error("Error decrypting data:", error);
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
    console.log("Document written with ID: ", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error adding document: ", e);
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
      console.log("No such document!");
      return null;
    }
  } catch (e) {
    console.error("Error reading document: ", e);
    throw e;
  }
};

// Hàm cập nhật dữ liệu mã hóa
export const updateEncryptedData = async (collectionName, docId, newData) => {
  const key = await getUserKey();
  const encryptedData = await encryptData(newData, key);
  try {
    await updateDoc(doc(db, collectionName, docId), { encryptedData });
    console.log("Document successfully updated");
  } catch (e) {
    console.error("Error updating document: ", e);
    throw e;
  }
};

// Hàm xóa dữ liệu
export const deleteData = async (collectionName, docId) => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
    console.log("Document successfully deleted");
  } catch (e) {
    console.error("Error removing document: ", e);
    throw e;
  }
};

// Hàm để lấy tất cả dữ liệu từ AsyncStorage
const getAllAsyncStorageData = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const result = {};
    for (const key of keys) {
      if (key !== KEY_STORAGE_NAME && key !== "AppLogs") {
        // Không đồng bộ khóa mã hóa và errorLogs
        const value = await AsyncStorage.getItem(key);
        result[key] = value;
      }
    }
    return result;
  } catch (error) {
    console.error("Error getting all AsyncStorage data:", error);
    throw error;
  }
};

// Hàm để đồng bộ dữ liệu từ AsyncStorage lên Firestore
export const syncAsyncStorageToFirestore = async (userId) => {
  try {
    const key = await getUserKey();
    const allData = await getAllAsyncStorageData();
    const encryptedData = await encryptData(allData, key);
    await setDoc(doc(db, SYNC_COLLECTION_NAME, userId), {
      encryptedData,
    });
    console.log("AsyncStorage data synchronized to Firestore successfully");
  } catch (error) {
    console.error("Error syncing AsyncStorage to Firestore:", error);
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
      console.log("No synchronized data found for this user");
      return null;
    }
  } catch (error) {
    console.error("Error getting decrypted sync data from Firestore:", error);
    throw error;
  }
};

// Hàm để khôi phục dữ liệu đồng bộ từ Firestore vào AsyncStorage
export const restoreSyncDataToAsyncStorage = async (userId) => {
  try {
    const decryptedData = await getDecryptedSyncDataFromFirestore(userId);
    if (decryptedData) {
      for (const [key, value] of Object.entries(decryptedData)) {
        await AsyncStorage.setItem(key, value);
      }
      console.log("Sync data restored to AsyncStorage successfully");
    }
  } catch (error) {
    console.error("Error restoring sync data to AsyncStorage:", error);
    throw error;
  }
};
