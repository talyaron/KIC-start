import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

// Collections
const usersCollection = collection(db, 'users');
const excusesCollection = collection(db, 'excuses');
const usageLogCollection = collection(db, 'usageLog');

// User operations
export const createOrUpdateUser = async (user) => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      displayName: user.displayName,
      photoURL: user.photoURL,
      score: 0,
      createdAt: serverTimestamp()
    });
  }

  return userRef;
};

export const getUserData = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null;
};

export const getTopUsers = async (limitCount = 10) => {
  const q = query(usersCollection, orderBy('score', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Excuse operations
export const createExcuse = async (excuseData, user) => {
  const docRef = await addDoc(excusesCollection, {
    text: excuseData.text,
    category: excuseData.category,
    eventType: excuseData.eventType,
    creatorId: user.uid,
    creatorName: user.displayName,
    usageCount: 0,
    believedCount: 0,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const getRandomExcuses = async (currentUserId, count = 5) => {
  // Get excuses sorted by usage count (less used first), excluding user's own
  const q = query(
    excusesCollection,
    orderBy('usageCount', 'asc'),
    limit(20)
  );
  const snapshot = await getDocs(q);
  let excuses = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(excuse => excuse.creatorId !== currentUserId);

  // Shuffle and pick random ones
  excuses = excuses.sort(() => Math.random() - 0.5);
  return excuses.slice(0, count);
};

export const getTailoredExcuses = async (currentUserId, category, eventType, count = 5) => {
  // Query by category and eventType
  const q = query(
    excusesCollection,
    where('category', '==', category),
    where('eventType', '==', eventType),
    orderBy('usageCount', 'asc'),
    limit(20)
  );

  try {
    const snapshot = await getDocs(q);
    let excuses = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(excuse => excuse.creatorId !== currentUserId);

    // Sort by believability ratio
    excuses.sort((a, b) => {
      const ratioA = a.usageCount > 0 ? a.believedCount / a.usageCount : 0;
      const ratioB = b.usageCount > 0 ? b.believedCount / b.usageCount : 0;
      return ratioB - ratioA;
    });

    return excuses.slice(0, count);
  } catch (error) {
    // If composite index doesn't exist, fall back to simpler query
    console.warn('Composite index may be needed, falling back to simple query');
    const simpleQuery = query(
      excusesCollection,
      where('category', '==', category),
      limit(20)
    );
    const snapshot = await getDocs(simpleQuery);
    let excuses = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(excuse => excuse.creatorId !== currentUserId && excuse.eventType === eventType);

    return excuses.slice(0, count);
  }
};

export const getBestExcuses = async (limitCount = 10) => {
  const q = query(excusesCollection, orderBy('believedCount', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getUserExcuses = async (userId) => {
  const q = query(excusesCollection, where('creatorId', '==', userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Usage operations
export const useExcuse = async (excuseId, creatorId, userId) => {
  const excuseRef = doc(db, 'excuses', excuseId);
  const creatorRef = doc(db, 'users', creatorId);

  // Increment usage count
  await updateDoc(excuseRef, { usageCount: increment(1) });

  // Add point to creator
  await updateDoc(creatorRef, { score: increment(1) });

  // Create usage log
  const logRef = await addDoc(usageLogCollection, {
    excuseId,
    userId,
    believed: null,
    usedAt: serverTimestamp()
  });

  return logRef.id;
};

export const reportBelieved = async (excuseId, creatorId, logId, believed) => {
  const excuseRef = doc(db, 'excuses', excuseId);
  const creatorRef = doc(db, 'users', creatorId);
  const logRef = doc(db, 'usageLog', logId);

  // Update log
  await updateDoc(logRef, { believed });

  if (believed) {
    // Increment believed count and add bonus points
    await updateDoc(excuseRef, { believedCount: increment(1) });
    await updateDoc(creatorRef, { score: increment(2) });
  }
};

// Seed data
export const seedExcuses = async (adminUserId, adminUserName) => {
  const seedData = [
    { text: "הכלב אכל את המחברת", category: "homework", eventType: "assignment" },
    { text: "התקלקלה מערכת ההסעות של העירייה", category: "late", eventType: "general" },
    { text: "עזרתי לסבתא לחצות את הכביש והיא הלכה לאט", category: "late", eventType: "regular_class" },
    { text: "הייתי בטוח שהיום שבת", category: "absence", eventType: "general" },
    { text: "השעון בבית עצר ולא שמתי לב", category: "late", eventType: "test" },
    { text: "האוטובוס עבר לי מול האף", category: "late", eventType: "regular_class" },
    { text: "אמא שלי הדפיסה לי את השיעורים אבל המדפסת נגמר לה הדיו", category: "homework", eventType: "assignment" },
    { text: "הייתי צריך לעזור לשכן להוריד ארון מהמשאית", category: "late", eventType: "general" },
    { text: "התיק שלי נשאר על הגדר ליד הכניסה לבית ספר ולא שמתי לב", category: "forgot_equipment", eventType: "regular_class" },
    { text: "חשבתי שהמבחן בשבוע הבא", category: "homework", eventType: "test" }
  ];

  for (const excuse of seedData) {
    await addDoc(excusesCollection, {
      ...excuse,
      creatorId: adminUserId,
      creatorName: adminUserName,
      usageCount: Math.floor(Math.random() * 5),
      believedCount: Math.floor(Math.random() * 3),
      createdAt: serverTimestamp()
    });
  }
};
