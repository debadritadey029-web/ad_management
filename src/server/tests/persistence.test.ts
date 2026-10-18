/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PersistenceManager } from '../db/persistence.js';
import { globalStore } from '../db/store.js';

test('Persistence: Atomic store save creates valid snapshot on disk', () => {
  const manager = PersistenceManager.getInstance();
  const saved = manager.saveToDiskSync(globalStore);

  assert.equal(saved, true);

  const status = manager.getStorageStatus();
  assert.equal(status.exists, true);
  assert.ok(status.sizeBytes > 100);
});

test('Persistence: Restores identical state from serialized disk snapshot', () => {
  const manager = PersistenceManager.getInstance();
  const loaded = manager.loadFromDisk();

  assert.ok(loaded);
  assert.equal(loaded?.version, 1);
  assert.ok(loaded?.users.length > 0);
  assert.ok(loaded?.campaigns.length > 0);
  assert.ok(loaded?.organizations.length > 0);

  // Check specific seeded organization preservation
  const apexOrgEntry = loaded?.organizations.find(([id]) => id === 'org_apex');
  assert.ok(apexOrgEntry);
  assert.equal(apexOrgEntry?.[1].slug, 'apex-global');
});
