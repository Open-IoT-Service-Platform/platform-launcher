# OISP - Single Sign On Client Example

This directory contains an example Node.js application which uses SSO to request account and device information from OISP.

To run this project simply run:

```bash
npm install
node app.js
```

Supports Node.js Version 10 and above

## Configuration

Two important things have to be done for this application to work:

1. Keycloak and Frontend should be accessible (either running locally or by port forwarding in kubernetes)
    * If you are not running them locally, you can forward them using the tool kubefwd. Check this [documentation](https://oisp-wip.readthedocs.io/en/latest/usage/quickstart.html#using-oisp) to see how it can be done.

2. Client should be added to Keycloak. You can add and configure manually, or you can use the provided **sso-example-client.json** file to import the client to OISP realm. Either way, you must login to keycloak with admin credentials.

This example assumes that the default configuration is used.

> If you are not using the default configuration, you should adjust the **keycloak.json** and **app.js** files.

## Usage

After starting the application, you should add a user and create account and devices. To create a test user go to root directory (platform-launcher) and run:

```bash
make add-test-user
```

This will add a test user named **user1@example.com** with the password **'password'**. Login with these credentials to OISP - Frontend. If you are using the default configuration with port forwarding the address should be: http://frontend:4001.

You will be asked to add an account, create an account with the name you like. After that you will be redirected back to homepage. Head over to devices section from the top left menu and create some devices.

> You do not need to provide all details to create a device, required values are id, name and gateway id.

With that you can head to example application. If you are using the default configuration, the address should be: http://localhost:4081.

You can either list current accounts or current devices.

* When you are listing the accounts, no external request to OISP is required, because this information is already included in the token that keycloak produces. This behavior can be changed by disabling the 'accounts' client scope in the client.

* When you list the devices, an external request to OISP will be made with the token provided by Keycloak.

Most important thing to notice here is, that the request should contain the token in the authorization header. Some keycloak adapters can do this automatically (for example: spring-boot adapter) but Node.js adapter does not do that. The developer should check this and proceed accordingly.

You will notice that if you head over the OISP - Frontend Dashboard and logout from it, you won't be logged out from the example client neither from the keycloak. The reason is that currently dashboard is using Direct Access Grants feature, which disables SSO in the sense that dashboard cannot understand if the user is logged in, but it will work if the token is provided (exactly why the example client works). This option is required if you want to provide a custom login through REST calls. However, in the future, we are considering to refactor the dashboard so that it does not use REST for login, rather it uses the  standard keycloakflow (the REST endpoint will still be there, just dashboard will not use it for the authentication so that SSO with dashboard can fully work).

Look at app.js for a more detailed explanation.
