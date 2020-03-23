import { v4 as uuid } from 'uuid';
import initialiseDB, { DBClient, PGClient } from './db';

interface VersionQueryRow {
  version: number;
}

async function writeEvent<T>(
  client: DBClient,
  entityType: string,
  entityId: string,
  data: T,
): Promise<void> {
  await client.startTransaction();
  const version = await client.getEntityVersion(entityId);
  try {
    if (version.currentVersion === 0) {
      await client.createEntity(entityId, entityType);
    }
    const didUpdate = await client.updateEntityVersion(entityId, entityType, version);
    if (!didUpdate) {
      throw new Error('concurrency check failed');
    }

    await client.insertEvent(entityId, data, version);
    await client.commitTransaction();
  } catch (err) {
    console.log(err);
    await client.rollbackTransaction();
  }
}


async function runServer(): Promise<void> {
  const client = new PGClient();
  const id = uuid();
  try {
    await writeEvent(client, 'SomeEntity', id, {
      type: 'EntityCreated',
      name: '',
      value: 'here we are yo',
    });

    await writeEvent(client, 'SomeEntity', id, {
      type: 'EntityUpdated',
      name: 'Steve',
      value: 5,
    });

    await writeEvent(client, 'SomeEntity', id, {
      type: 'EntityUpdated',
      name: 'Steven',
      value: 12,
    });
  } catch (err) {
    console.log(err);
  }
}

runServer();
