import { v4 as uuid } from 'uuid';
import grpc from 'grpc';
import { Event } from './protos/gen/events_pb';
import { EventStoreClient } from './protos/gen/events_grpc_pb';

async function writeEvent(
  client: EventStoreClient,
  entityType: string,
  entityId: string,
  currentVersion: number,
  data: string,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const event = new Event();
    event.setEntityid(entityId);
    event.setType(entityType);
    event.setData(JSON.stringify(data));
    event.setVersion(currentVersion);

    client.writeEvent(event, (err, response) => {
      if (err) {
        console.log(err);
        reject(err);
        return;
      }
      if (response) {
        const newVersion = response.getVersion();
        resolve(newVersion);
      }
    });
  });
}

async function readEvents<T>(client: EventStoreClient, entityId: string): Promise<T[]> {
}

async function test(): Promise<void> {
  const id = uuid();
  const eventClient = new EventStoreClient('server::4422', grpc.credentials.createInsecure());
  try {
    await writeEvent(eventClient, 'SomeEntity', id, 0, JSON.stringify({
      type: 'EntityCreated',
      name: '',
      value: 'here we are yo',
    }));

    await writeEvent(eventClient, 'SomeEntity', id, 1, JSON.stringify({
      type: 'EntityUpdated',
      name: 'Steve',
      value: 5,
    }));

    await writeEvent(eventClient, 'SomeEntity', id, 2, JSON.stringify({
      type: 'EntityUpdated',
      name: 'Steven',
      value: 12,
    }));
  } catch (err) {
    console.log(err);
  }
}

test();
