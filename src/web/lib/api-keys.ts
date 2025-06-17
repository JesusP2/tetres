import { db } from './instant';

export async function toggleApiKey(keyId: string, isActive: boolean) {
  return db.transact(
    db.tx.apiKeys[keyId].update({
      isActive,
      updatedAt: new Date().toISOString(),
    }),
  );
}

export async function deleteKey(keyId: string) {
  return db.transact(db.tx.apiKeys[keyId].delete());
}
