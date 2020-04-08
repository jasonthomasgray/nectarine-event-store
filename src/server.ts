import grpc from 'grpc';
import { Event, Response } from './protos/gen/events_pb';
import { EventStoreService } from './protos/gen/events_grpc_pb';
import { DBClient, PGClient } from './db';

interface VersionQueryRow {
  version: number;
}

async function writeEventToDB<T>(
  client: DBClient,
  entityType: string,
  entityId: string,
  expectedVersion: number,
  data: T,
): Promise<number | false> {
  await client.startTransaction();
  try {
    if (expectedVersion === 0) {
      await client.createEntity(entityId, entityType);
    }
    const nextVersion = expectedVersion + 1;
    const didUpdate = await client.updateEntityVersion(entityId, entityType, {
      currentVersion: expectedVersion,
      nextVersion,
    });
    if (!didUpdate) {
      throw new Error('concurrency check failed');
    }

    await client.insertEvent(entityId, data, nextVersion);
    await client.commitTransaction();
    return nextVersion;
  } catch (err) {
    console.log(err);
    await client.rollbackTransaction();
    return false;
  }
}

async function readEventsFromDB<T>(client: DBClient, entityId: string): Promise<T[]> {
  return client.readEvents<T>(entityId);
}

function writeEvent(client: DBClient): grpc.handleUnaryCall<Event, Response> {
  return (call, callback): void => {
    const event = call.request;

    writeEventToDB(
      client,
      event.getType(),
      event.getEntityid(),
      event.getVersion(),
      JSON.parse(event.getData()),
    ).then((writtenVersion) => {
      if (writtenVersion === false) {
        callback({
          name: 'Version Error',
          code: grpc.status.FAILED_PRECONDITION,
          message: 'versionChanged',
        }, null);
        return;
      }
      const response = new Response();
      response.setVersion(writtenVersion);
      callback(null, response);
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
  const server = getServer(dbClient);
  server.bind('0.0.0.0:4422', grpc.ServerCredentials.createInsecure());
  server.start();
}

runServer();
