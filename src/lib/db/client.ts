import path from "node:path";
import { Pool, type QueryResultRow } from "pg";
import { PGlite } from "@electric-sql/pglite";

export type DbBackend = "pg" | "pglite";

export interface QueryResponse<T extends QueryResultRow = QueryResultRow> {
  rows: T[];
  rowCount: number;
}

export interface DbClient {
  backend: DbBackend;
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResponse<T>>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
}

interface GlobalDbHolder {
  client?: DbClient;
  initPromise?: Promise<void>;
}

const globalForDb = globalThis as typeof globalThis & {
  __travelVlogFinderDb?: GlobalDbHolder;
};

function getHolder(): GlobalDbHolder {
  if (!globalForDb.__travelVlogFinderDb) {
    globalForDb.__travelVlogFinderDb = {};
  }
  return globalForDb.__travelVlogFinderDb;
}

function createPgClient(connectionString: string): DbClient {
  const useSsl =
    process.env.DATABASE_SSL === "true" ||
    connectionString.includes("sslmode=require");

  const pool = new Pool({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    max: 10,
  });

  return {
    backend: "pg",
    async query<T extends QueryResultRow = QueryResultRow>(
      text: string,
      params: unknown[] = []
    ): Promise<QueryResponse<T>> {
      const res = await pool.query<T>(text, params);
      return {
        rows: res.rows,
        rowCount: res.rowCount ?? res.rows.length,
      };
    },
    async exec(sql: string): Promise<void> {
      await pool.query(sql);
    },
    async close(): Promise<void> {
      await pool.end();
    },
  };
}

function createPgliteClient(dataDir: string): DbClient {
  const resolvedDir =
    dataDir === "memory" || dataDir === "memory://"
      ? "memory://"
      : path.isAbsolute(dataDir)
        ? dataDir
        : path.join(process.cwd(), dataDir);

  const pgLite = new PGlite(resolvedDir);
  const ready = pgLite.waitReady;

  return {
    backend: "pglite",
    async query<T extends QueryResultRow = QueryResultRow>(
      text: string,
      params: unknown[] = []
    ): Promise<QueryResponse<T>> {
      await ready;
      const res = await pgLite.query<T>(text, params);
      return {
        rows: res.rows,
        rowCount: res.affectedRows ?? res.rows.length,
      };
    },
    async exec(sql: string): Promise<void> {
      await ready;
      await pgLite.exec(sql);
    },
    async close(): Promise<void> {
      await ready;
      await pgLite.close();
    },
  };
}

export function getDb(): DbClient {
  const holder = getHolder();
  if (holder.client) {
    return holder.client;
  }

  const connectionString =
    process.env.NETLIFY_DB_URL?.trim() || process.env.DATABASE_URL?.trim();

  if (connectionString) {
    holder.client = createPgClient(connectionString);
  } else {
    const dataDir = process.env.PGLITE_DATA_DIR?.trim() || ".pgdata";
    holder.client = createPgliteClient(dataDir);
  }

  return holder.client;
}

export async function resetDbInstance(): Promise<void> {
  const holder = getHolder();
  if (holder.client) {
    await holder.client.close();
  }
  holder.client = undefined;
  holder.initPromise = undefined;
}

export function getDbHolder(): GlobalDbHolder {
  return getHolder();
}
