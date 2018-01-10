# Open IoT Connector

This project is designed to provide Cloud Service Providers with a platform for enabling and supporting IoT developers to create IoT solutions with both edge devices and the cloud.

The platform provides developers with an end-to-end solution for streaming telemetry data to the cloud, applying rules (using the rules engine) to this data, triggering actuations whilst also providing an interface for the platform to communicate with your own cloud services.

Key features:

 * Easy to use and deploy IoT agent
 * Inbuilt dashboard to create rules, graphs and catalog items
 * Full RESTful JSON API supported
 * Realtime actuations (cloud -> IoT device)

## Getting started

The platform consists of multiple components (services) each designed and optimised for a specific usecase. For example, the rules engine (built on top of Gearpump) runs seperately to the rest of the system and ingests telemetry data from a Kafka queue.

To get platform running quickly we recommened using Docker. First ensure you have the latest version of Docker installed on your computer.

## Cloning the Open IoT Connector

```shell
# git clone https://github.com/emea-ssg-drd/open-iot-connector.git
```

## Starting from scratch
To get started quickly we suggest you use Docker.
We have created a shell script to install all the dependencies including Git, Docker, docker-compose, etc for Ubuntu 16.04:
```shell
# cd open-iot-connector
# ./docker-platform-setup/install-docker-ubuntu16.04.sh
```

## Creating the IoT Connector

```shell
# cd open-iot-connector
# cp setup-environment.example.sh setup-environment.sh
```
**Now modify the setup-environment.sh shell script with parameters valid for your needs.** For example the SMTP settings require you to have an SMTP server.

To build all the images,run:
```shell
# make
```

## Starting application using Docker

Now that all the images are built, we can create (if not already) and start all the neccessary containers:
```shell
# make start
```

**Note:** If your environment requries a proxy. Ensure you have set the *http_proxy* and *https_proxy* enviornment variables before running the script above.

Once all the containers have been built and are running, you can access the application in your browser by visiting: http://localhost

## Other make commands

#### Stop the IoT connector
The following command will stop all the Open IoT Connector containers:
```shell
# make stop
```

#### Update (including submodules) the project
The following command will pull latest changes to the Open IoT Connector **and** the latest changes from the submodules:
```shell
# make update
```

#### Destroy the IoT connector (including data)
The following command will stop and remove the containers and images:
```shell
# make distclean
```

The project has been structured using Git submodules according to recommendations made here: https://www.philosophicalhacker.com/post/using-git-submodules-effectively/
