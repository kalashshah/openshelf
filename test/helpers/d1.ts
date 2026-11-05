import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

/** A D1Database good enough for Store: node:sqlite in memory, with every migration applied. */
export function fakeD1(): D1Database {
  const db = new DatabaseSync(':memory:');
  const dir = new URL('../../migrations/', import.meta.url);
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) db.exec(readFileSync(new URL(f, dir), 'utf8'));
  const stmt = (sql: string, args: unknown[] = []) => {
    const norm = () => args.map((a) => (a === undefined ? null : typeof a === 'boolean' ? Number(a) : a)) as (string | number | null)[];
    const s = {
      bind: (...a: unknown[]) => stmt(sql, a),
      run: async () => {
        const r = db.prepare(sql).run(...norm());
        return { success: true, meta: { changes: Number(r.changes) } };
      },
      first: async () => (db.prepare(sql).get(...norm()) as unknown) ?? null,
      all: async () => ({ results: db.prepare(sql).all(...norm()), success: true, meta: {} }),
    };
    return s;
  };
  return {
    prepare: (sql: string) => stmt(sql),
    batch: async (stmts: { run: () => Promise<unknown> }[]) => {
      db.exec('BEGIN');
      try {
        const out = [];
        for (const s of stmts) out.push(await s.run());
        db.exec('COMMIT');
        return out;
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
  } as unknown as D1Database;
}
