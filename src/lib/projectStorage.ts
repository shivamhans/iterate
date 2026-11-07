export type StoredProject = {
  id: string;
  name: string;
  kind: string;
  updated: string;
  status: string;
  icon: string;
  initialIdea: string;
  createdAt: number;
  updatedAt: number;
  interviewData?: { turns: import("./interviewEngine").InterviewTurn[]; decision: import("./interviewEngine").InterviewDecision | null; specification: Record<string, unknown>; approved: boolean; started: boolean };
};

const DATABASE_NAME = "iterate-local";
const DATABASE_VERSION = 1;
const STORE_NAME = "projects";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("This browser does not support IndexedDB."));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local project storage."));
    request.onblocked = () => reject(new Error("Project storage is blocked by another Iterate tab. Close other Iterate tabs and retry."));
  });
}

export async function listProjects(): Promise<StoredProject[]> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve((request.result as StoredProject[]).sort((a, b) => b.updatedAt - a.updatedAt));
      request.onerror = () => reject(request.error ?? new Error("Could not read projects."));
      tx.onabort = () => reject(tx.error ?? new Error("Project read was interrupted."));
    });
  } finally {
    db.close();
  }
}

export async function saveProject(project: StoredProject): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(project);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Could not save project."));
      tx.onabort = () => reject(tx.error ?? new Error("Project save was interrupted."));
    });
  } finally {
    db.close();
  }
}

export async function removeProject(id: string): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Could not delete project."));
      tx.onabort = () => reject(tx.error ?? new Error("Project deletion was interrupted."));
    });
  } finally {
    db.close();
  }
}
