import net from 'net';
import grpc from 'grpc';
import { Event, Version } from './protos/gen/events_pb';
import { EventStoreService } from './protos/gen/events_grpc_pb';
import { DBClient, PGClient } from './db';

interface VersionQueryRow {
  version: number;
}

async function writeEventToDB<T>(
  client: DBClient,
  entityType: string,
  entityId: string,
  data: T,
): Promise<number | false> {
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
    return version.nextVersion;
  } catch (err) {
    console.log(err);
    await client.rollbackTransaction();
    return false;
  }
}

async function readEventsFromDB<T>(client: DBClient, entityId: string): Promise<T[]> {
  return client.readEvents<T>(entityId);
}

function writeEvent(client: DBClient): grpc.handleUnaryCall<Event, Version> {
  return (call, callback) => {
    const event = call.request;

    writeEventToDB(
      client,
      event.getType(),
      event.getEntityid(),
      JSON.parse(event.getData()),
    ).then((nextVersion) => {
      if (nextVersion === false) {
        callback({
          name: 'Version Error',
          code: grpc.status.FAILED_PRECONDITION,
          message: 'version changed',
        }, null);
      }
      const version = new Version();
      version.setCurrentversion(event.getVersion()?.getNextversion());
      return version;
    });
  };
}

function getServer(client: DBClient): grpc.Server {
  const server = new grpc.Server();
  server.addProtoService(EventStoreService, {
    writeEvent: writeEvent(client),
  });
  return server;
}


async function runServer(): Promise<void> {
  const dbClient = new PGClient();
  const server = getServer();
  server.listen(4422, () => {
    console.log('opened server on', server.address());
  });
}

runServer();
