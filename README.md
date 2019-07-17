# Kubernetes Templates for OISP

## Introduction

This project contains a collection of Kubernetes templates and some helper scripts for deploying the Open IoT Service Platform to a Kubernetes cluster.

## Requirements

 - Kubernetes 1.9
 - an ingress controller
 - a persisten volume provisioner
 - Access to oisp Dockerhub repo

## Local installation

In order to run OISP locally, see the setup.md file in this directory.

## Usage

The templates directory contains templates for all required objects. You will want to edit the configmap and secrets to set up SMTP details and define secure and unique passwords. You will also want to update the secrets with generated public and private keys for encoding the JWTs used for authentication.

You will also want to configure the Ingress objects to have the correct hostnames for your cluster.

After you are done with the configuration, run `make import-templates`
The stack will take around 5 minutes to deploy, you can monitor the progress in the logs for the dashboard pod. Once the stack is up and serving content. Once it is up, you can vist the hostname specified in the ingress.

For more details, run `make help`.

## Future Work and Improvements
 - Move the config from a JSON structure inside the configmap to properly defined key-value pairs in the ConfigMap.
 - Produce a helm chart from the templates.
