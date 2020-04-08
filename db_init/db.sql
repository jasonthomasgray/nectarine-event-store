-- Create the required tables
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