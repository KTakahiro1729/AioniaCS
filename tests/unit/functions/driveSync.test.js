import { describe, expect, test, beforeEach } from 'vitest';
import { app } from '../../../functions/api/[[route]].js';

function createMockDb() {
  const sessions = new Map();
  const metadata = new Map();

  return {
    sessions,
    metadata,
    prepare(query) {
      const normalized = query.trim().toLowerCase();

      return {
        bind: (...params) => ({
          async first() {
            if (normalized.startsWith('select * from sessions')) {
              const [id] = params;
              return sessions.get(id) || null;
            }
            return null;
          },
          async all() {
            if (normalized.startsWith('select * from character_metadata')) {
              const [userId] = params;
              const results = Array.from(metadata.values()).filter((row) => row.user_id === userId);
              return { results };
            }

            if (normalized.startsWith('select file_id')) {
              const [userId] = params;
              const results = Array.from(metadata.values())
                .filter((row) => row.user_id === userId)
                .sort((a, b) => b.synced_at - a.synced_at);
              return { results };
            }

            return { results: [] };
          },
          async run() {
            if (normalized.startsWith('delete from sessions')) {
              const [id] = params;
              sessions.delete(id);
              return { success: true };
            }

            if (normalized.startsWith('delete from character_metadata')) {
              const [fileId] = params;
              metadata.delete(fileId);
              return { success: true };
            }

            if (normalized.startsWith('insert into character_metadata')) {
              const [fileId, userId, characterName, fileName, contentHash, lastModifiedAtDrive, syncedAt] = params;
              metadata.set(fileId, {
                file_id: fileId,
                user_id: userId,
                character_name: characterName,
                file_name: fileName,
                content_hash: contentHash,
                last_modified_at_drive: lastModifiedAtDrive,
                synced_at: syncedAt,
              });
              return { success: true };
            }

            return { success: false };
          },
        }),
      };
    },
    async batch(statements) {
      for (const statement of statements) {
        await statement.run();
      }
      return { success: true };
    },
  };
}

describe('drive sync metadata deletion', () => {
  let env;
  let db;

  beforeEach(() => {
    db = createMockDb();
    const sessionId = 'session-1';
    const now = Math.floor(Date.now() / 1000);
    db.sessions.set(sessionId, { id: sessionId, user_id: 'user-1', expires_at: now + 1000 });
    db.metadata.set('keep', {
      file_id: 'keep',
      user_id: 'user-1',
      character_name: 'Keep',
      file_name: 'keep.json',
      content_hash: 'hash-keep',
      last_modified_at_drive: 10,
      synced_at: now - 10,
    });
    db.metadata.set('remove', {
      file_id: 'remove',
      user_id: 'user-1',
      character_name: 'Remove',
      file_name: 'remove.json',
      content_hash: 'hash-remove',
      last_modified_at_drive: 20,
      synced_at: now - 20,
    });

    env = {
      GOOGLE_CLIENT_ID: 'client-id',
      GOOGLE_CLIENT_SECRET: 'client-secret',
      SESSION_SECRET: 'secret',
      DB: db,
    };
  });

  test('removes metadata entries that are absent from sync payload', async () => {
    const payload = {
      files: [
        {
          id: 'keep',
          name: 'keep.json',
          appProperties: { character_name: 'Keep', last_app_hash: 'hash-keep' },
          modifiedTime: new Date(0).toISOString(),
        },
      ],
    };

    const res = await app.request(
      'https://example.com/api/drive/sync',
      {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'content-type': 'application/json', Cookie: 'aioniacs_session=session-1' },
      },
      env,
    );

    expect(res.status).toBe(200);
    expect(db.metadata.has('remove')).toBe(false);
    expect(db.metadata.has('keep')).toBe(true);

    const updated = db.metadata.get('keep');
    expect(updated.last_modified_at_drive).toBe(0);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
  });
});
