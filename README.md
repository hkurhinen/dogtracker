# Dog Tracker

This is a dog tracker service based on ElasticSearch and NodeJS.
System consists of 2 components, NodeJS server which can be found from folder src/server
another component is the actual tracker device which isbase on Raspberry Pi and SIM7600E-H GNSS/4G module.

## Usage

Create file called config.json in the root of the project, file should contain following values:

```
{
  "elastic": {
    "id": "YOUR_ELASTIC_CLOUD_ID",
    "username": "YOUR_ELASTIC_CLOUD_USER",
    "password": "YOUR_ELASTIC_CLOUD_PASSWORD"
  },
  "dog": "YOUR_DOG_NAME",
  "device": "/dev/ttyS0",
  "port": 3000
}
```

Build project by running command npm run build-ts.
The order which components are started does not matter since both components will initialize required ElasticSearch indices if the do not yet exist.

### Running server

Server can be started by running ```command npm run start-server```

Server has few endpoints:

#### GET /trips/:dogname

Lists trips by dog.

Returned data will be in format:
```
[
    {
        "name": "DOG_NAME",
        "status": "DONE",
        "start": 1570553697817,
        "end": 1570553763000
    },
    .
    .
    .
]
```

#### GET /traces/:dogname?start=1234566&end=1234567

Lists traces by dog between start and end parameters,
start and end parameters are mandatory and they need to be in timestamp format in ms.

Returned data will be in format:
```
[
    {
        "name": "DOG_NAME",
        "location": {
            "lat": 61.64319506666667,
            "lon": 27.27350978333333
        },
        "time": 1570553700419
    },
    .
    .
    .
]
```

#### POST /trips/start

Post command with body 
```
{"name": "DOG_NAME"}
```
will start new trip for dog, request will fail if dog already has ongoing trip.

#### POST /trips/finish

Post command with body 
```
{"name": "DOG_NAME"}
```
will finish trip for dog, request will fail if dog has not on going trip.

### Running tracker

Running tracker requires Raspberry Pi 2 or 3 and SIM7600E-H GNSS/4G module. You don't need to initialize the module by manufactorers instructions since the software will do that for you. 

NodeJS needs to be installed on Raspberry Pi in order to run the tracker, also the tracker software should be installed as a service which will be started on boot.

Service can be installed as follows:

Create file /etc/systemd/system/dogtracker.service with following contents:
```
[Unit]
Description=Dogtracker Service
After=network.target

[Service]
WorkingDirectory=PATH_TO_TRACKER_SOFTWARE
ExecStart=/usr/bin/npm run start-tracker
Restart=on-failure
User=root

[Install]
WantedBy=multi-user.target
```

Enable the service with following command

```sudo systemctl enable dogtracker.service```

Service can now be started with command:

```sudo systemctl start dogtracker.servic```

After this service should start automatically on reboot.