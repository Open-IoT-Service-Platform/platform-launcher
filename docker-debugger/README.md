#Debug Container
===============

This container has the tools that are often required to debug various parts of OISP, like kafkacat, node & npm, python & pip etc.

Since this is not supposed to be deployed in production, lightness of this container is not a concern, so it is meant to be a all in one solution.

## Build & run

Run the make commands from project root directory, and set DEBUG=true or add debugger to CONTAINERS.

## Advantages over debugging via host machine


1. Not all host machines necessarily have the tools installed.
2. This can be used to access endpoints not exposed publicly within docker/k8s networks.
