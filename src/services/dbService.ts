import { User, Course, AttendanceRecord, Announcement, AppNotification, ChangeRequest, StudentResultReport, TimetableSlot } from '../types';

const DB_NAME = 'eduportal_db';
const DB_VERSION = 1;

export const STORES = {
  USERS: 'users',
  DELETED_USERS: 'deleted_users',
  COURSES: 'courses',
  DELETED_COURSES: 'deleted_courses',
  ATTENDANCE: 'attendance',
  ANNOUNCEMENTS: 'announcements',
  DELETED_ANNOUNCEMENTS: 'deleted_announcements',
  STUDENT_RESULTS: 'student_results',
  DELETED_RESULTS: 'deleted_results',
  TIMETABLE: 'timetable',
  CHANGE_REQUESTS: 'change_requests',
  NOTIFICATIONS: 'notifications',
  APP_METADATA: 'app_metadata',
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

let dbPromise: Promise<IDBDatabase> | null = null;

export const getDB = (): Promise<IDBDatabase> => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this environment.'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        const createStore = (name: string, keyPath: string = 'id') => {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath });
          }
        };

        createStore(STORES.USERS, 'id');
        createStore(STORES.DELETED_USERS, 'id');
        createStore(STORES.COURSES, 'id');
        createStore(STORES.DELETED_COURSES, 'id');
        createStore(STORES.ATTENDANCE, 'id');
        createStore(STORES.ANNOUNCEMENTS, 'id');
        createStore(STORES.DELETED_ANNOUNCEMENTS, 'id');
        createStore(STORES.STUDENT_RESULTS, 'id');
        createStore(STORES.DELETED_RESULTS, 'id');
        createStore(STORES.TIMETABLE, 'id');
        createStore(STORES.CHANGE_REQUESTS, 'id');
        createStore(STORES.NOTIFICATIONS, 'id');
        createStore(STORES.APP_METADATA, 'key');
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  return dbPromise;
};

export async function dbGet<T>(storeName: StoreName, key: string): Promise<T | undefined> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value ?? request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn(`dbGet error [${storeName}]:`, e);
    return undefined;
  }
}

export async function dbGetAll<T>(storeName: StoreName): Promise<T[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => {
        const results = request.result || [];
        resolve(results.map((item) => (item && typeof item === 'object' && 'value' in item ? item.value : item)));
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn(`dbGetAll error [${storeName}]:`, e);
    return [];
  }
}

export async function dbPut<T extends { id?: string; key?: string }>(storeName: StoreName, item: T): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn(`dbPut error [${storeName}]:`, e);
  }
}

export async function dbPutMany<T extends { id?: string; key?: string }>(storeName: StoreName, items: T[]): Promise<void> {
  if (!items || items.length === 0) return;
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      items.forEach((item) => store.put(item));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn(`dbPutMany error [${storeName}]:`, e);
  }
}

export async function dbDelete(storeName: StoreName, key: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn(`dbDelete error [${storeName}]:`, e);
  }
}

export async function dbClear(storeName: StoreName): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn(`dbClear error [${storeName}]:`, e);
  }
}

export async function dbGetMeta<T>(key: string): Promise<T | undefined> {
  const res = await dbGet<{ key: string; value: T }>(STORES.APP_METADATA, key);
  return res ? (res.value !== undefined ? res.value : (res as unknown as T)) : undefined;
}

export async function dbSetMeta<T>(key: string, value: T): Promise<void> {
  await dbPut(STORES.APP_METADATA, { key, value });
}

export async function migrateFromLocalStorage(): Promise<void> {
  try {
    const migrationFlag = localStorage.getItem('eduportal_db_migrated');
    if (migrationFlag === 'true') return;

    // 1. Users
    const usersRaw = localStorage.getItem('eduportal_all_users');
    if (usersRaw) {
      const users: User[] = JSON.parse(usersRaw);
      if (Array.isArray(users) && users.length > 0) {
        await dbPutMany(STORES.USERS, users);
      }
    }

    // 2. Attendance
    const attRaw = localStorage.getItem('eduportal_attendance_records');
    if (attRaw) {
      const att: AttendanceRecord[] = JSON.parse(attRaw);
      if (Array.isArray(att) && att.length > 0) {
        await dbPutMany(STORES.ATTENDANCE, att);
      }
    }

    // 3. Student Results
    const resRaw = localStorage.getItem('eduportal_student_results');
    if (resRaw) {
      const res: StudentResultReport[] = JSON.parse(resRaw);
      if (Array.isArray(res) && res.length > 0) {
        await dbPutMany(STORES.STUDENT_RESULTS, res);
      }
    }

    // 4. Academic Term Period
    const termRaw = localStorage.getItem('eduportal_academic_term_period');
    if (termRaw) {
      const term = JSON.parse(termRaw);
      if (term) {
        await dbSetMeta('academic_term_period', term);
      }
    }

    // 5. Deleted Items
    const delUsersRaw = localStorage.getItem('eduportal_deleted_users');
    if (delUsersRaw) {
      const delUsers = JSON.parse(delUsersRaw);
      if (Array.isArray(delUsers)) await dbPutMany(STORES.DELETED_USERS, delUsers);
    }

    const delCoursesRaw = localStorage.getItem('eduportal_deleted_courses');
    if (delCoursesRaw) {
      const delCourses = JSON.parse(delCoursesRaw);
      if (Array.isArray(delCourses)) await dbPutMany(STORES.DELETED_COURSES, delCourses);
    }

    const delAnnRaw = localStorage.getItem('eduportal_deleted_announcements');
    if (delAnnRaw) {
      const delAnn = JSON.parse(delAnnRaw);
      if (Array.isArray(delAnn)) await dbPutMany(STORES.DELETED_ANNOUNCEMENTS, delAnn);
    }

    const delResRaw = localStorage.getItem('eduportal_deleted_results');
    if (delResRaw) {
      const delRes = JSON.parse(delResRaw);
      if (Array.isArray(delRes)) await dbPutMany(STORES.DELETED_RESULTS, delRes);
    }

    localStorage.setItem('eduportal_db_migrated', 'true');
  } catch (e) {
    console.warn('LocalStorage to IndexedDB migration error:', e);
  }
}

export async function clearAllLocalData(): Promise<void> {
  try {
    localStorage.clear();
    sessionStorage.clear();
    const storeKeys = Object.values(STORES);
    for (const store of storeKeys) {
      await dbClear(store);
    }
  } catch (e) {
    console.warn('Error clearing all local data:', e);
  }
}

export const dbService = {
  get: dbGet,
  getAll: dbGetAll,
  put: dbPut,
  putMany: dbPutMany,
  delete: dbDelete,
  clear: dbClear,
  clearAllLocalData,
  getMeta: dbGetMeta,
  setMeta: dbSetMeta,
  migrateFromLocalStorage,
};
