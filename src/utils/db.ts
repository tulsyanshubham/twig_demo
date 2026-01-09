import { openDB, type DBSchema, type IDBPDatabase } from "idb";

/* ------------------ */
/* Constants */
/* ------------------ */
const DB_NAME = "VideoEditorDB";
const DB_VERSION = 1;

const PROJECTS_STORE = "projects";
const ASSETS_STORE = "assets";

/* ------------------ */
/* Types */
/* ------------------ */
export interface ProjectRecord {
    id: string;
    name: string;
    editDraft: any;
    assetIds: string[];
    updatedAt: number;
}

export interface AssetRecord {
    id: string;
    fileName: string;
    type: "audio" | "video" | "image" | "other";
    mimeType: string;
    blob: Blob;
    createdAt: number;
}

interface EditorDB extends DBSchema {
    [PROJECTS_STORE]: {
        key: string;
        value: ProjectRecord;
    };
    [ASSETS_STORE]: {
        key: string;
        value: AssetRecord;
    };
}

/* ------------------ */
/* DB Init */
/* ------------------ */
export const initDB = async (): Promise<IDBPDatabase<EditorDB>> => {
    return openDB<EditorDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
                db.createObjectStore(PROJECTS_STORE);
            }
            if (!db.objectStoreNames.contains(ASSETS_STORE)) {
                db.createObjectStore(ASSETS_STORE);
            }
        },
    });
};

/* ========================================================= */
/* PROJECTS */
/* ========================================================= */

export const saveProject = async (
    project: ProjectRecord
) => {
    const db = await initDB();
    await db.put(PROJECTS_STORE, project, project.id);
};

export const getProject = async (
    projectId: string
): Promise<ProjectRecord | undefined> => {
    const db = await initDB();
    return db.get(PROJECTS_STORE, projectId);
};

export const updateEditDraft = async (
    projectId: string,
    editDraft: any
) => {
    const db = await initDB();
    const project = await db.get(PROJECTS_STORE, projectId);
    if (!project) return;

    project.editDraft = editDraft;
    project.updatedAt = Date.now();

    await db.put(PROJECTS_STORE, project, projectId);
};

export const listProjects = async () => {
    const db = await initDB();
    return db.getAll(PROJECTS_STORE);
};

/* ========================================================= */
/* ASSETS */
/* ========================================================= */
export const addAssetToProject = async (
    projectId: string,
    asset: AssetRecord
) => {
    const db = await initDB();
    const tx = db.transaction([PROJECTS_STORE, ASSETS_STORE], "readwrite");

    const projectStore = tx.objectStore(PROJECTS_STORE);
    const assetStore = tx.objectStore(ASSETS_STORE);

    const project = await projectStore.get(projectId);

    if (!project) {
        throw new Error(`Project ${projectId} not found`);
    }

    // Save asset
    await assetStore.put(asset, asset.id);

    // Link asset to project (avoid duplicates)
    if (!project.assetIds.includes(asset.id)) {
        project.assetIds.push(asset.id);
    }

    project.updatedAt = Date.now();

    // Save project
    await projectStore.put(project, projectId);

    await tx.done;
};

export const saveAsset = async (
    asset: AssetRecord
) => {
    const db = await initDB();
    await db.put(ASSETS_STORE, asset, asset.id);
};

export const getAsset = async (
    assetId: string
): Promise<AssetRecord | undefined> => {
    const db = await initDB();
    return db.get(ASSETS_STORE, assetId);
};

export const deleteAsset = async (
    assetId: string
) => {
    const db = await initDB();
    await db.delete(ASSETS_STORE, assetId);
};

/* ========================================================= */
/* HELPERS */
/* ========================================================= */

export const createAssetFromFile = (
    file: File,
    type: "audio" | "video" | "image" | "other"
): AssetRecord => {
    return {
        id: crypto.randomUUID(),
        fileName: file.name,
        type,
        mimeType: file.type,
        blob: file,
        createdAt: Date.now(),
    };
};
