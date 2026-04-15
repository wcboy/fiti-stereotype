/**
 * Firebase 配置
 * 用于存储用户问卷统计数据（仅管理员可查看）
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyxBn_JaVNo-Zks7L54AsabCfSw6pzGfP5NY8-SOVB-Sw",
  authDomain: "fbti-counter.firebaseapp.com",
  projectId: "fbti-counter",
  storageBucket: "fbti-counter.appspot.com",
  messagingSenderId: "118920787161",
  appId: "1:118920787161:web:BElF9Y5aDNwAPIf3_yX2JQGYXtHJgXaUsji1RgMrQzbC1nFT2ReTa_GcF_9iDIt5U6QEmjiAioUtrBqr74hdIQw"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * 上传问卷结果到 Firebase
 * @param {Object} result - 问卷结果
 */
export async function uploadResult(result) {
  try {
    const docRef = await addDoc(collection(db, "results"), {
      ...result,
      timestamp: Date.now(),
      date: new Date().toISOString(),
    });
    console.log("结果已上传，ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("上传失败:", error);
    return null;
  }
}

/**
 * 获取总计数
 * @returns {Promise<number>}
 */
export async function getTotalCount() {
  try {
    const snapshot = await getDocs(collection(db, "results"));
    return snapshot.size;
  } catch (error) {
    console.error("获取计数失败:", error);
    return 0;
  }
}

/**
 * 获取最近的结果列表
 * @param {number} limitCount - 限制数量
 * @returns {Promise<Array>}
 */
export async function getRecentResults(limitCount = 10) {
  try {
    const q = query(
      collection(db, "results"),
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("获取结果列表失败:", error);
    return [];
  }
}

export { db };
