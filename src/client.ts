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
    console.log('make event proto');
    const event = new Event();
    event.setEntityid(entityId);
    event.setType(entityType);
    event.setData(JSON.stringify(data));
    event.setVersion(currentVersion);

    console.log('filled event proto');
    client.writeEvent(event, (err, response) => {
      if (err) {
        console.log(err);
        reject(err);
        return;
      }
      console.log('response', response);
      if (response) {
        console.log('got a valid response');
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
  console.log('Entity Id = ', id);
  const eventClient = new EventStoreClient('server:4422', grpc.credentials.createInsecure());
  console.log('EventClient created');
  try {
    let version = 0;
    console.log(`gonna write version ${version}`);
    version = await writeEvent(eventClient, 'SomeEntity', id, version, JSON.stringify({
      type: 'EntityCreated',
      name: '',
      value: 'here we are yo',
    }));

    console.log(`gonna write version ${version}`);
    version = await writeEvent(eventClient, 'SomeEntity', id, version, JSON.stringify({
      type: 'EntityUpdated',
      name: 'Steve',
      value: 5,
    }));

    console.log(`gonna write version ${version}`);
    version = await writeEvent(eventClient, 'SomeEntity', id, version, JSON.stringify({
      type: 'EntityUpdated',
      name: 'Steven',
      value: 12,
    }));
    console.log(`Wrote event ${version} for ${id}`);
  } catch (err) {
    console.log(err);
  }
}

test();
