import { openDB, type IDBPDatabase } from "idb";

interface QueuedMutation {
  id: string;
  table: string;
  operation: "insert" | "update" | "upsert";
  data: Record<string, unknown>;
  retries: number;
  createdAt: string;
}

const DB_NAME = "proof-offline";
const STORE_NAME = "mutations";
const MAX_RETRIES = 10;
const MAX_BACKOFF_MS = 5 * 60 * 1000;

let db: IDBPDatabase | null = null;

async function getDb() {
  if (db) return db;
  db = await openDB(DB_NAME, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    },
  });
  return db;
}

export async function queueMutation(
  table: string,
  operation: "insert" | "update" | "upsert",
  data: Record<string, unknown>
) {
  const database = await getDb();
  const mutation: QueuedMutation = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    table,
    operation,
    data,
    retries: 0,
    createdAt: new Date().toISOString(),
  };
  await database.put(STORE_NAME, mutation);
  return mutation.id;
}

export async function getQueueDepth(): Promise<number> {
  const database = await getDb();
  return database.count(STORE_NAME);
}

export async function flushQueue(
  executor: (
    table: string,
    operation: string,
    data: Record<string, unknown>
  ) => Promise<boolean>
): Promise<{ flushed: number; failed: number }> {
  const database = await getDb();
  const tx = database.transaction(STORE_NAME, "readonly");
  const all = await tx.store.getAll();
  await tx.done;

  let flushed = 0;
  let failed = 0;

  for (const mutation of all as QueuedMutation[]) {
    const success = await executor(mutation.table, mutation.operation, mutation.data);
    if (success) {
      await database.delete(STORE_NAME, mutation.id);
      flushed++;
    } else if (mutation.retries >= MAX_RETRIES) {
      await database.delete(STORE_NAME, mutation.id);
      failed++;
    } else {
      await database.put(STORE_NAME, { ...mutation, retries: mutation.retries + 1 });
      const backoff = Math.min(
        Math.pow(2, mutation.retries) * 1000,
        MAX_BACKOFF_MS
      );
      await new Promise((r) => setTimeout(r, backoff));
    }
  }

  return { flushed, failed };
}

export function getBackoffMs(retries: number): number {
  return Math.min(Math.pow(2, retries) * 1000, MAX_BACKOFF_MS);
}
