import { openDB } from 'idb';

const DB_NAME = 'TwishhSync_Offline_DB';
const STORE_NAME = 'pending_punches';

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
  },
});

export const offlineStore = {
  async savePendingPunch(punchData) {
    const db = await dbPromise;
    return db.put(STORE_NAME, {
      ...punchData,
      timestamp: new Date().toISOString()
    });
  },

  async getPendingPunches() {
    const db = await dbPromise;
    return db.getAll(STORE_NAME);
  },

  async deletePendingPunch(id) {
    const db = await dbPromise;
    return db.delete(STORE_NAME, id);
  },

  async clearQueue() {
    const db = await dbPromise;
    return db.clear(STORE_NAME);
  }
};
