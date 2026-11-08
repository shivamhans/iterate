import type { ProjectRecord } from "./types";

const DB_NAME = "iterate-local";
const DB_VERSION = 1;
const PROJECTS = "projects";
const IMAGES = "images";

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB is unavailable."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROJECTS)) {
        const projects = db.createObjectStore(PROJECTS, { keyPath: "id" });
        projects.createIndex("updatedAt", "updatedAt");
      }
      if (!db.objectStoreNames.contains(IMAGES)) db.createObjectStore(IMAGES, { keyPath: "id" });
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => reject(request.error ?? new Error("Could not open local project storage."));
    request.onblocked = () => reject(new Error("Project storage upgrade is blocked by another open tab."));
  });
}

function runTransaction<T>(storeName: string, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDatabase().then(db => new Promise<T>((resolve, reject) => {
    let result: T;
    const tx = db.transaction(storeName, mode);
    const request = run(tx.objectStore(storeName));
    request.onsuccess = () => { result = request.result; };
    request.onerror = () => reject(request.error ?? new Error("Local database request failed."));
    tx.oncomplete = () => { resolve(result); db.close(); };
    tx.onerror = () => { reject(tx.error ?? new Error("Local database transaction failed.")); db.close(); };
    tx.onabort = () => { reject(tx.error ?? new Error("Local database transaction was aborted.")); db.close(); };
  }));
}

export async function saveProject(project: ProjectRecord): Promise<void> {
  await runTransaction("projects", "readwrite", store => store.put(project));
}
export async function listProjects(): Promise<ProjectRecord[]> {
  const rows = await runTransaction("projects", "readonly", store => store.getAll());
  return rows.sort((a, b) => b.updatedAt - a.updatedAt);
}
export async function deleteProject(id: string): Promise<void> {
  await runTransaction("projects", "readwrite", store => store.delete(id));
}

export interface LocalImageRecord {
  id: string;
  projectId: string;
  name: string;
  mimeType: string;
  createdAt: number;
  blob: Blob;
}
export async function saveImage(image: LocalImageRecord): Promise<void> {
  await runTransaction("images", "readwrite", store => store.put(image));
}
export async function listProjectImages(projectId: string): Promise<LocalImageRecord[]> {
  const rows = await runTransaction("images", "readonly", store => store.getAll());
  return rows.filter(row => row.projectId === projectId);
}
export async function deleteProjectImages(projectId: string): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IMAGES, "readwrite");
      const request = tx.objectStore(IMAGES).openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        if ((cursor.value as LocalImageRecord).projectId === projectId) cursor.delete();
        cursor.continue();
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Could not delete project images."));
      tx.onabort = () => reject(tx.error ?? new Error("Image deletion was aborted."));
    });
  } finally { db.close(); }
}
