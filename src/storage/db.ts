import type { ProjectRecord } from "./types";

const DB_NAME = "iterate-local";
const DB_VERSION = 1;
const PROJECTS = "projects";

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB is unavailable."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROJECTS)) {
        const store = db.createObjectStore(PROJECTS, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local project storage."));
    request.onblocked = () => reject(new Error("Project storage upgrade is blocked by another open tab."));
  });
}

export async function saveProject(project: ProjectRecord): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PROJECTS, "readwrite");
      tx.objectStore(PROJECTS).put(project);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Could not save project."));
      tx.onabort = () => reject(tx.error ?? new Error("Project save was cancelled."));
    });
  } finally { db.close(); }
}

export async function listProjects(): Promise<ProjectRecord[]> {
  const db = await openDatabase();
  try {
    return await new Promise<ProjectRecord[]>((resolve, reject) => {
      const tx = db.transaction(PROJECTS, "readonly");
      const request = tx.objectStore(PROJECTS).getAll();
      request.onsuccess = () => resolve((request.result as ProjectRecord[]).sort((a,b) => b.updatedAt-a.updatedAt));
      request.onerror = () => reject(request.error ?? new Error("Could not read projects."));
    });
  } finally { db.close(); }
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PROJECTS, "readwrite");
      tx.objectStore(PROJECTS).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Could not delete project."));
    });
  } finally { db.close(); }
}