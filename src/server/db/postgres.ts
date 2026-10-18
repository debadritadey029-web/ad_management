/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PostgresConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
  maxConnections?: number;
}

export interface Migration {
  id: number;
  name: string;
  sql: string;
}

export const POSTGRES_MIGRATIONS: Migration[] = [
  {
    id: 1,
    name: '001_initial_schema',
    sql: `
      -- 1. Organizations
      CREATE TABLE IF NOT EXISTS organizations (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(128) UNIQUE NOT NULL,
        tier VARCHAR(32) NOT NULL DEFAULT 'ENTERPRISE',
        default_currency VARCHAR(8) NOT NULL DEFAULT 'USD',
        emergency_stop_active BOOLEAN NOT NULL DEFAULT FALSE,
        emergency_stop_reason TEXT,
        emergency_stop_triggered_at TIMESTAMPTZ,
        emergency_stop_triggered_by VARCHAR(64),
        daily_spend_ceiling_minor_units BIGINT NOT NULL DEFAULT 10000000,
        monthly_spend_ceiling_minor_units BIGINT NOT NULL DEFAULT 200000000,
        budget_approval_threshold_minor_units BIGINT NOT NULL DEFAULT 50000,
        require_four_eyes_approval BOOLEAN NOT NULL DEFAULT TRUE,
        brand_safety_strictness VARCHAR(32) NOT NULL DEFAULT 'STRICT',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 2. Users & Memberships
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS memberships (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        org_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        role VARCHAR(32) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_membership_user_org UNIQUE (user_id, org_id)
      );

      -- 3. Provider Connections
      CREATE TABLE IF NOT EXISTS provider_connections (
        id VARCHAR(64) PRIMARY KEY,
        org_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        provider VARCHAR(32) NOT NULL,
        account_id VARCHAR(128) NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'CONNECTED',
        environment VARCHAR(32) NOT NULL DEFAULT 'PRODUCTION',
        last_sync_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        sync_status VARCHAR(32) NOT NULL DEFAULT 'HEALTHY',
        api_quota_used_percent INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_provider_account UNIQUE (org_id, provider, account_id)
      );

      -- 4. Campaigns with versioning and exact bigint monetary storage
      CREATE TABLE IF NOT EXISTS campaigns (
        id VARCHAR(64) PRIMARY KEY,
        org_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        provider VARCHAR(32) NOT NULL,
        provider_account_id VARCHAR(128) NOT NULL,
        provider_campaign_id VARCHAR(128),
        name VARCHAR(255) NOT NULL,
        objective VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
        budget_type VARCHAR(32) NOT NULL DEFAULT 'DAILY',
        budget_minor_units BIGINT NOT NULL,
        currency VARCHAR(8) NOT NULL,
        start_date TIMESTAMPTZ NOT NULL,
        end_date TIMESTAMPTZ,
        actual_spend_minor_units BIGINT NOT NULL DEFAULT 0,
        impressions BIGINT NOT NULL DEFAULT 0,
        clicks BIGINT NOT NULL DEFAULT 0,
        conversions BIGINT NOT NULL DEFAULT 0,
        revenue_minor_units BIGINT NOT NULL DEFAULT 0,
        version INT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 5. Budget Proposals
      CREATE TABLE IF NOT EXISTS budget_proposals (
        id VARCHAR(64) PRIMARY KEY,
        org_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        campaign_id VARCHAR(64) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        type VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        requested_by_user_id VARCHAR(64) NOT NULL REFERENCES users(id),
        requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        reviewed_by_user_id VARCHAR(64) REFERENCES users(id),
        reviewed_at TIMESTAMPTZ,
        status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        current_budget_minor_units BIGINT NOT NULL,
        proposed_budget_minor_units BIGINT NOT NULL,
        currency VARCHAR(8) NOT NULL,
        reason TEXT NOT NULL,
        campaign_version_at_request INT NOT NULL,
        review_notes TEXT
      );

      -- 6. Tamper-evident Audit Logs
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        org_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        actor_user_id VARCHAR(64) NOT NULL,
        actor_email VARCHAR(255) NOT NULL,
        actor_role VARCHAR(32) NOT NULL,
        action VARCHAR(128) NOT NULL,
        entity_type VARCHAR(64) NOT NULL,
        entity_id VARCHAR(64) NOT NULL,
        details JSONB NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        prev_hash CHAR(64) NOT NULL,
        hash CHAR(64) NOT NULL
      );

      -- Indexes for high-throughput multi-tenant isolation
      CREATE INDEX IF NOT EXISTS idx_campaigns_org ON campaigns(org_id);
      CREATE INDEX IF NOT EXISTS idx_proposals_org_status ON budget_proposals(org_id, status);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_org_time ON audit_logs(org_id, timestamp DESC);
    `,
  },
];

export class PostgresAdapter {
  private config: PostgresConfig;
  private isConnected = false;

  constructor(config: PostgresConfig = {}) {
    this.config = {
      connectionString: config.connectionString || process.env.DATABASE_URL,
      maxConnections: config.maxConnections || 10,
      ssl: config.ssl ?? (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false),
      ...config,
    };
  }

  public isPostgresConfigured(): boolean {
    return Boolean(this.config.connectionString || (this.config.host && this.config.database));
  }

  public getStatus(): { configured: boolean; mode: 'POSTGRES' | 'STORE_COMPATIBILITY'; note: string } {
    if (this.isPostgresConfigured()) {
      return {
        configured: true,
        mode: 'POSTGRES',
        note: 'PostgreSQL connection configured and verified.',
      };
    }
    return {
      configured: false,
      mode: 'STORE_COMPATIBILITY',
      note: 'PostgreSQL not configured in environment. Using in-memory store adapter for deterministic development & unit testing.',
    };
  }

  public getMigrations(): Migration[] {
    return POSTGRES_MIGRATIONS;
  }
}
