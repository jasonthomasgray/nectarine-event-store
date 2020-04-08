import net from 'net';
import { v4 as uuid } from 'uuid';

const client = net.createConnection({
  port: 4422,
  host: 'server',
}, () => {
  // 'connect' listener.
  console.log('connected to server!');
});

client.on('data', (data) => {
  console.log(data.toString());
  client.end();
});

client.on('end', () => {
  console.log('disconnected from server');
});

async function writeEvent<T>(
  client: DBClient,
  entityType: string,
  entityId: string,
  data: T,
): Promise<boolean> {
  client.write();
}

async function readEvents<T>(client: DBClient, entityId: string): Promise<T[]> {
}

async function test() {
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
