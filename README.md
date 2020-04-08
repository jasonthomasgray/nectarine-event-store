# nectarine-event-store

This project aims to be:
* a minimal server to write event data into some DB (currently PostgreSQL)
* client libraries to connect to this server and write and read events. (currently node.js)


## What you need
* Docker
* docker-compose

## How to run (current setup hacks)

no docker compose deps or healthchecks yet, run  things in this order

1. `docker-compose up -d db`
2. `docker-compose up server` -- in own terminal
3. `docker-compose up application` -- in own terminal

if you want to look in the DB for debugging (password in docker-compose file)

```shell
docker run -it --rm --network nectarine-event-store_default postgres:12-alpine psql -h db -U postgres
```
