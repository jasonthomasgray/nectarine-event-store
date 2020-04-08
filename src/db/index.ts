import { Client, QueryResult } from 'pg';

interface EntityVersion {
  currentVersion: number;
  nextVersion: number;
}


interface VersionQueryRow {
  version: number;
}


function extractVersionFromQuery(queryResult: QueryResult<VersionQueryRow>): EntityVersion {
  if (queryResult.rowCount === 0) {
    return {
      currentVersion: 0,
      nextVersion: 1,
    };
  }
  const currentVersion = queryResult.rows[0].version;
  return {
    currentVersion,
    nextVersion: currentVersion + 1,
  };
}

export interface DBClient {
  startTransaction(): Promise<void>;
  getEntityVersion(entityId: string): Promise<EntityVersion>;
  createEntity(entityId: string, entityType: string): Promise<void>;
  updateEntityVersion(
    entityId: string,
    entityType: string,
    version: EntityVersion
  ): Promise<boolean>;
  insertEvent<T>(entityId: string, data: T, version: EntityVersion): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;
  readEvents<T>(entityId: string): Promise<T[]>;
}


export class PGClient implements DBClient {
  private ready: Promise<void>;

  private client: Client;

  constructor() {
    this.client = new Client();
    this.ready = this.client.connect();
  }

  async startTransaction(): Promise<void> {
    await this.ready;
    await this.client.query('BEGIN;');
  }

  async getEntityVersion(entityId: string): Promise<EntityVersion> {
    const versionResult = await this.client.query(
      'SELECT version FROM entities WHERE entityid = $1;',
      [entityId],
    );
    return extractVersionFromQuery(versionResult);
  }

  async createEntity(entityId: string, entityType: string): Promise<void> {
    await this.client.query(
      'INSERT INTO entities (entityid, type, version) VALUES ($1, $2, $3);',
      [entityId, entityType, 0],
    );
  }

  async updateEntityVersion(
    entityId: string,
    entityType: string,
    version: EntityVersion,
  ): Promise<boolean> {
    const updateResult = await this.client.query(
      'UPDATE entities SET version = $1 WHERE entityid = $2 AND version = $3;',
      [version.nextVersion, entityId, version.currentVersion],
    );
    if (updateResult.rowCount === 0) {
      return false;
    }
    return true;
  }

  async insertEvent<T>(entityId: string, data: T, version: EntityVersion): Promise<void> {
    await this.client.query(
      'INSERT INTO events (entityid, data, version) VALUES ($1, $2, $3);',
      [entityId, data, version.nextVersion],
    );
  }

  async commitTransaction(): Promise<void> {
    await this.client.query('COMMIT;');
  }

  async rollbackTransaction(): Promise<void> {
    await this.client.query('ROLLBACK;');
  }

  async readEvents<T>(entityId: string): Promise<T[]> {
    await this.ready;
    const eventsResults = await this.client.query(
      'SELECT data from events WHERE entityid = $1 ORDER BY version ASC',
      [entityId],
    );
    return eventsResults.rows.map((row): T => row.data);
  }
}
