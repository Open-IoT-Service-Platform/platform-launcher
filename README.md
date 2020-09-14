
# Open IoT Service Platform (OISP)

This project is designed to provide Cloud Service Providers with a platform for enabling and supporting IoT developers to create IoT solutions with both edge devices and the cloud.

The platform provides developers with an end-to-end solution for streaming telemetry data to the cloud, applying rules (using the rules engine) to this data, triggering actuations whilst also providing an interface for the platform to communicate with your own cloud services.

Key features:

 * Easy to use and deploy IoT agent
 * Inbuilt dashboard to create rules, graphs and catalog items
 * Full RESTful JSON API supported
 * Realtime actuations (cloud -> IoT device)

## Getting started with OISP

The platform consists of multiple components (services) each designed and optimised for a specific usecase. For example, the rules engine runs seperately to the rest of the system and ingests telemetry data from a Kafka queue.

Please check the [documentation](https://platform-launcher.readthedocs.io/en/latest/) for instruction on getting started.

The project has been structured using Git submodules according to recommendations made here: https://www.philosophicalhacker.com/post/using-git-submodules-effectively/


## Development

### Development Process
Community contributions are welcome!
All PRs have to be applied to the develop branches in the ``platform-launcher`` repository or the sub repositories. At least one review and approval of a project admin is needed to merge it in.
Before submitting a PRs make sure that you checked out the most recent develop state.
The master branches are only getting PRs from the respective develop branches.

An additinal [development guide](https://platform-launcher.readthedocs.io/en/latest/development/developers_guide.html) contains tips and tricks to ease the development process.
