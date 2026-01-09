import { openDB, type DBSchema } from 'idb';

const DB_NAME = 'DynamicJsonDB';
const STORE_NAME = 'json_store';

interface MyDB extends DBSchema {
    [STORE_NAME]: {
        key: string;
        value: any;
    };
}

export const initDB = async () => {
    return openDB<MyDB>(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        },
    });
};

export const saveToDB = async (key: string, value: any) => {
    const db = await initDB();
    await db.put(STORE_NAME, value, key);
};

export const getFromDB = async (key: string) => {
    const db = await initDB();
    return await db.get(STORE_NAME, key);
};