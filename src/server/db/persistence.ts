/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataStore } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../../data');
const DB_FILE = path.join(DATA_DIR, 'advantage_ai_db.json');

export interface SerializedDataStore {
  version: number;
  lastSavedAt: string;
  users: Array<[string, any]>;
  organizations: Array<[string, any]>;
  memberships: Array<[string, any]>;
  invitations: Array<[string, any]>;
  providerConnections: Array<[string, any]>;
  campaigns: Array<[string, any]>;
  proposals: Array<[string, any]>;
  creatives: Array<[string, any]>;
  brandProfiles: Array<[string, any]>;
  leads: Array<[string, any]>;
  auditLogs: any[];
}

export class PersistenceManager {
  private static instance: PersistenceManager;
  private saveTimeout: NodeJS.Timeout | null = null;
  private isSaving = false;

  private constructor() {
    this.ensureDataDirectory();
  }

  public static getInstance(): PersistenceManager {
    if (!PersistenceManager.instance) {
      PersistenceManager.instance = new PersistenceManager();
    }
    return PersistenceManager.instance;
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  /**
   * Loads serialized database from disk if present.
   */
  public loadFromDisk(): SerializedDataStore | null {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw) as SerializedDataStore;
      }
    } catch (err) {
      console.error('[Persistence] Error loading database file:', err);
    }
    return null;
  }

  /**
   * Schedules a debounced atomic write to disk to ensure performance and crash resistance.
   */
  public scheduleSave(store: DataStore, delayMs = 150): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveToDiskSync(store);
    }, delayMs);
  }

  /**
   * Atomically writes the store to disk using a temporary file and atomic rename.
   */
  public saveToDiskSync(store: DataStore): boolean {
    if (this.isSaving) return false;
    this.isSaving = true;

    try {
      this.ensureDataDirectory();
      const payload: SerializedDataStore = {
        version: 1,
        lastSavedAt: new Date().toISOString(),
        users: Array.from(store.users.entries()),
        organizations: Array.from(store.organizations.entries()),
        memberships: Array.from(store.memberships.entries()),
        invitations: Array.from(store.invitations.entries()),
        providerConnections: Array.from(store.providerConnections.entries()),
        campaigns: Array.from(store.campaigns.entries()),
        proposals: Array.from(store.proposals.entries()),
        creatives: Array.from(store.creatives.entries()),
        brandProfiles: Array.from(store.brandProfiles.entries()),
        leads: Array.from(store.leads.entries()),
        auditLogs: store.auditLogs,
      };

      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
      return true;
    } catch (err) {
      console.error('[Persistence] Failed to write persistent store to disk:', err);
      return false;
    } finally {
      this.isSaving = false;
    }
  }

  public getStorageStatus(): { path: string; exists: boolean; sizeBytes: number; lastModified?: string } {
    try {
      if (fs.existsSync(DB_FILE)) {
        const stat = fs.statSync(DB_FILE);
        return {
          path: DB_FILE,
          exists: true,
          sizeBytes: stat.size,
          lastModified: stat.mtime.toISOString(),
        };
      }
    } catch {}
    return {
      path: DB_FILE,
      exists: false,
      sizeBytes: 0,
    };
  }
}
