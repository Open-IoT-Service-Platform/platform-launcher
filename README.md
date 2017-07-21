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

```bash
git clone https://github.com/emea-ssg-drd/open-iot-connector.git
cd open-iot-connector
git submodule update --remote --merge
cp setup-environment.example.sh setup-environment.sh
```

Now modify the setup-environment shell script with parameters valid for your needs. For example the SMTP settings require you have an SMTP server.

The project has been structured using Git submodules according to recommendations made here: https://www.philosophicalhacker.com/post/using-git-submodules-effectively/