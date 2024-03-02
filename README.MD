# A simple project using Kafka to stream data in real-time to a Node.js consumer.

## Installation
First of all, go to src/index.js and change line 18. Put your endpoint there.
You can use [beeceptor](https://app.beeceptor.com/) to create a simple endpoint to receive the messages: 

```sh
uri: 'https://your-endpoint-here.free.beeceptor.com/your-path-here',
```

Run this command to build the Docker containers.

```sh
docker compose up -d --build
```

After that, use your favorite SGBD to connect to PostgreSQL using these credentials:

| name | value |
| ------ | ------ |
| user | docker |
| password | docker |
| database | exampledb |
| host | localhost |
| port | 5432 |

And then, run this sql commands:

```sh
CREATE TABLE student (id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name varchar);
ALTER TABLE public.student replica identity full;

CREATE TABLE room (id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY, room_name text);
ALTER TABLE public.room replica identity full;
```
Obs.: notice that you need to create the tables and apply an alter table: ALTER TABLE <table> replica identity full;

## Debezium

After that, you need to make an HTTP request to the Debezium container to set the configuration (debezium.json).

```sh
curl -i -X POST -H "Accept:application/json" -H "Content-Type:application/json" 127.0.0.1:8083/connectors/ --data "@debezium.json"
```

Every time you want to add new tables to watch in real-time
* first you need create the new table in the database.
* second: change your debezium-update.json
 ```sh
 {
      "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
      "plugin.name": "pgoutput",
      "database.hostname": "postgres",
      "database.port": "5432",
      "database.user": "docker",
      "database.password": "docker",
      "database.dbname": "exampledb",
      "database.server.name": "postgres",
      "table.include.list": "public.student,public.room,public.<your new table here>"
  }
 ```
Update your Debezium:

```sh
curl -i -X PUT -H "Accept:application/json" -H "Content-Type:application/json" 127.0.0.1:8083/connectors/exampledb-connector/config --data "@debezium-update.json"
```

   and subscribe your new topic in the consumer in index.js:
   ```sh
    await consumer.subscribe({ topic: 'postgres.public.student' })
    await consumer.subscribe({ topic: 'postgres.public.room' })
    await consumer.subscribe({ topic: 'postgres.public.<your new table here>' })
   ```
   
   and finally:  ```docker compose up -d --build ```

## Testing

After all these steps, you only need to insert, update, or delete a row in the created tables to receive the response (values are listed at the bottom).

A simple response:
```sh
{
   "topic": "postgres.public.room",
   "partition": 0,
   "message": {
      "schema": {
         "type": "struct",
         "fields": [
            {
               "type": "struct",
               "fields": [
                  {
                     "type": "int32",
                     "optional": false,
                     "field": "id"
                  },
                  {
                     "type": "string",
                     "optional": true,
                     "field": "room_name"
                  }
               ],
               "optional": true,
               "name": "postgres.public.room.Value",
               "field": "before"
            },
            {
               "type": "struct",
               "fields": [
                  {
                     "type": "int32",
                     "optional": false,
                     "field": "id"
                  },
                  {
                     "type": "string",
                     "optional": true,
                     "field": "room_name"
                  }
               ],
               "optional": true,
               "name": "postgres.public.room.Value",
               "field": "after"
            },
            {
               "type": "struct",
               "fields": [
                  {
                     "type": "string",
                     "optional": false,
                     "field": "version"
                  },
                  {
                     "type": "string",
                     "optional": false,
                     "field": "connector"
                  },
                  {
                     "type": "string",
                     "optional": false,
                     "field": "name"
                  },
                  {
                     "type": "int64",
                     "optional": false,
                     "field": "ts_ms"
                  },
                  {
                     "type": "string",
                     "optional": true,
                     "name": "io.debezium.data.Enum",
                     "version": 1,
                     "parameters": {
                        "allowed": "true,last,false"
                     },
                     "default": "false",
                     "field": "snapshot"
                  },
                  {
                     "type": "string",
                     "optional": false,
                     "field": "db"
                  },
                  {
                     "type": "string",
                     "optional": false,
                     "field": "schema"
                  },
                  {
                     "type": "string",
                     "optional": false,
                     "field": "table"
                  },
                  {
                     "type": "int64",
                     "optional": true,
                     "field": "txId"
                  },
                  {
                     "type": "int64",
                     "optional": true,
                     "field": "lsn"
                  },
                  {
                     "type": "int64",
                     "optional": true,
                     "field": "xmin"
                  }
               ],
               "optional": false,
               "name": "io.debezium.connector.postgresql.Source",
               "field": "source"
            },
            {
               "type": "string",
               "optional": false,
               "field": "op"
            },
            {
               "type": "int64",
               "optional": true,
               "field": "ts_ms"
            },
            {
               "type": "struct",
               "fields": [
                  {
                     "type": "string",
                     "optional": false,
                     "field": "id"
                  },
                  {
                     "type": "int64",
                     "optional": false,
                     "field": "total_order"
                  },
                  {
                     "type": "int64",
                     "optional": false,
                     "field": "data_collection_order"
                  }
               ],
               "optional": true,
               "field": "transaction"
            }
         ],
         "optional": false,
         "name": "postgres.public.room.Envelope"
      },
      "payload": {
         "before": null,
         "after": {
            "id": 1,
            "room_name": "nice room"
         },
         "source": {
            "version": "1.4.2.Final",
            "connector": "postgresql",
            "name": "postgres",
            "ts_ms": 1709390283639,
            "snapshot": "false",
            "db": "exampledb",
            "schema": "public",
            "table": "room",
            "txId": 491,
            "lsn": 23928392,
            "xmin": null
         },
         "op": "c",
         "ts_ms": 1709390284079,
         "transaction": null
      }
   }
}
```