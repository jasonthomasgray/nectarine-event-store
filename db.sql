CREATE TABLE IF NOT EXISTS entities (
  entityid  uuid PRIMARY KEY,
  type      varchar(50) NOT NULL CHECK (type <> ''),
  version   integer
);

CREATE TABLE IF NOT EXISTS events (
  entityid  uuid REFERENCES entities,
  data      jsonb,
  version   integer
);

BEGIN;
SELECT version FROM entites WHERE entityid = '53f6c53e-a0ce-45b1-bf23-8dfd4a30eafa';

INSERT INTO entities (entityid, type, version)
  VALUES ('53f6c53e-a0ce-45b1-bf23-8dfd4a30eafa', 'Context', 0);

UPDATE entities SET version = 1 WHERE entityid = '53f6c53e-a0ce-45b1-bf23-8dfd4a30eafa' AND version = 0;

INSERT INTO events (entityid, data, version)
  VALUES (
    '53f6c53e-a0ce-45b1-bf23-8dfd4a30eafa',
    '{"type": "ContextCreated", "name": "article"}',
    0
  );
COMMIT;