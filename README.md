
# Safeplaces Translation Service API

This repository holds an example Translation Service API for [Safeplaces API specification](https://github.com/Path-Check/safeplaces-backend-translation/blob/master/openapi.yaml).

Safeplaces is a toolkit for public health, built on top of data shared by users of [Private Kit](https://github.com/tripleblindmarket/covid-safe-paths).

[Safeplaces Frontend](https://github.com/Path-Check/safeplaces-frontend) is an example client for these backends.

## Project Status

[![Project Status: WIP – The project is still under development and will reach a Minimum Viable Product stage soon.](https://www.repostatus.org/badges/latest/wip.svg)](https://www.repostatus.org/#wip)

The project is still under development and will reach a Minimum Viable Product (MVP) stage soon.  
*Note*: There can be breaking changes to the developing code until the MVP is released.

## Data Layer

The database, [Safeplaces Data Layer](https://github.com/Path-Check/safeplaces-data-layer), has been decoupled from the main repo and now sits in a library that can be pulled into any micro service or API.  Both Public and Private databases are managed out of this library.

Additionally, this can be forked for functionality, or replaced entirely with a data layer of your choosing.

#### CLI

Due to the nature of database management we have built in a small CLI that will allow you to run seeds and migrations. To install enter the following.

This needs to be installed globaly so run the following command.

`npm i -g @sublet/data-layer`

For more information see the CLI portion of the [Safeplaces Data Layer](https://github.com/Path-Check/safeplaces-data-layer#cli) library.

## Local Development

*Note*:
1. The installation assumes you have already installed Postgres DB in your local environment listening for connections at port 5432.
2. Your Postgres instance should listen to '*' instead of 'localhost' by setting the `listen_addresses` parameter, [this setting can be found in your pgconfig file](https://www.postgresql.org/docs/current/runtime-config-connection.html).

Clone this repository

```
cd safeplaces-backend-translation
```

To work locally with the data-layer library, clone it to your computer and then reference it locally using the following command.

```
npm install --save file:../safeplaces-data-layer
```

__NOTE:__ Where you clone it might be very different than the path below.

Once installed it should show up in the package.json file like below.

```
"@sublet/data-layer": "file:../safeplaces-data-layer"
```

#### Install Package Manager

Steps to install NVM are documented [in the nvm repository](https://github.com/nvm-sh/nvm#installing-and-updating).

Install npm using nvm

```
nvm install 13.1.0
nvm use 13.1.0
npm install
```

#### Setup Environment

Refer [.env.template](.env.template) for environment variables to be exported to your environment.

#### Setup LDAP Server
The basic, included LDAP server is to be used for testing purposes only.
It is not meant for production use.

Please see the OpenLDAP implementations for production-ready servers. Once set up, modify the environment
variables to point to the new server, with the proper host, port, password, domain components, and bind command.

Example:
```
LDAP_HOST=localhost
LDAP_PORT=1389
LDAP_PASS=safepaths
LDAP_ORG="dc=covidsafepaths, dc=org"
LDAP_BIND="cn=admin, dc=covidsafepaths, dc=org"
LDAP_SEARCH="dc=covidsafepaths, dc=org"
LDAP_FILTER="(&(objectClass=person)(cn={{username}}))"
```

The Express server queries the LDAP server with each login request at `/login`.

The search query will look like
`dc=covidsafepaths, dc=org`.

The filter query will look like
`(&(objectClass=person)(cn={{username}}))`.

Note that `{{username}}` is **explicitly required.**
`{{username}}` will be replaced by the username sent by the client's request.

To run the server:
```
cd ldapjs/
npm install
npm start
```

or there is a helper command that can be run from the main directory

```
npm run ldap:start
```

#### Setup Database

1. Create the database exported in your environment.
```
createdb safeplaces
```
1. Create the user exported in your environment.
```
psql=# CREATE USER safepaths_user
```
1. Grant database user superuser privilege to the database to create POSTGIS extension and setup other tables. Reduce this privilege later to just create and modify tables or tuples in this database after you run the migration for the first time.
```
ALTER USER safepaths_user WITH SUPERUSER
```
After migration:
```
ALTER USER safepaths_user WITH NOSUPERUSER
```
1. Install [PostGIS extension](https://postgis.net/install/).

#### Knex migrations and seed the database

Install Safe Places Data Layer globally

```
npm i -g @sublet/data-layer
```

Run migrations

```
npm run migrate:up
```

Seed the database

```
npm run seed:dev
```

#### Mocha unit tests

Install mocha globally.

```
npm install mocha -g
```

Run tests to ensure they pass

```
npm test
```

#### Start the server

```
npm start
```

## Production and Staging Deployments
This section of the readme will detail configuration of deployed environments. In our sample application, we support the deployment of a staging and production version of the application.

#### Staging
The staging deployment is based off of the `staging` branch. This environment is used by QA, product, and development teams to validate functionality before releasing to the general public.

##### Hosted Services
Frontend : [https://safeplaces.extremesolution.com/](https://safeplaces.extremesolution.com/)

Backend API: [https://zeus.safeplaces.extremesolution.com](https://zeus.safeplaces.extremesolution.com/)

Ingest Service API : [https://hermes.safeplaces.extremesolution.com/](https://hermes.safeplaces.extremesolution.com/)

Translation Service API: TBD

#### Production
The production deployment is based off of the `master` branch. This environment is a production version of the SafePlaces application(s).

##### Hosted Services
Frontend: [https://spl.extremesolution.com/](https://spl.extremesolution.com/)

Backend API (this repo): [https://yoda.spl.extremesolution.com/](https://spl.extremesolution.com/)

Ingest Service: [https://obiwan.spl.extremesolution.com/](https://spl.extremesolution.com/)

Translation Service API: TBD

### Database Configuration
Databases for the staging and production version of the application will be configured similarly. Each environment will use its own database.

SafePlaces requires a public and private database to be setup and configured. The Translation (this repo) and Backend API should support read and write access to both the private and public databases. The Ingest service will only write and read to the public database.

As mentioned above, the Translation Service API will need the ability to read and write to both databases. The following environment variables will need to be set on the server hosting the Translation Service:
```
# Private Database Configuration Environment Variables
DB_HOST (IP/URL of where database is hosted)
DB_NAME (Name of database)
DB_USER (Name of appropriatly configured user)
DB_PASS (Password for corresponding user)

# Public Database Config Environment Variables
DB_HOST_PUB (IP/URL of where database is hosted)
DB_NAME_PUB (Password for corresponding user)
DB_USER_PUB (Name of appropriatly configured user)
DB_PASS_PUB (Password for corresponding user)
```
### LDAP Server
The current version of the Translation API requires an external server running [OpenLDAP](https://www.openldap.org/) that is configured with appropriate user credentials and roles.

The Translation API requires the following environment variables to be set on the server:

```
LDAP_HOST (IP/URL of where LDAP server is hosted)
LDAP_PASS (LDAP Administrative Password)
LDAP_ORG="dc=covidsafepaths, dc=org"
LDAP_BIND="cn=admin, dc=covidsafepaths, dc=org"
LDAP_SEARCH="dc=covidsafepaths, dc=org"
LDAP_FILTER="(&(objectClass=person)(cn={{username}}))"
```

### Node Environment
The `NODE_ENV` environment variable indicates what environment the application is running in.

For the staging environment the variable should be set as follows: `NODE_ENV=staging`

For the production environment the variable should be set as follows: `NODE_ENV=production`

### JWT Configuration
The sample application makes use of JWT to authenticate requests to the server. Two environment variables need to be set in order to properly configure usage of JWT. These below environment variables' values should mirror those used in the Backend API.

#### `JWT_SECRET`
The `JWT_SECRET` is used to sign JWTs and should be at least 64 characters, and generated using a [secure source of randomness](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html#secure-random-number-generation).

Example: `JWT_SECRET="TVCH846KJdIyuB0s+vhXmoJa1YcVcDSsLjv+jTUDKJKzySdMvmIzelTjshPylKlcKpQDX2RUVc5sSuNpgVKIqA=="`

#### `JWT_EXP`
This `JWT_EXP` variable configures the time till expiration on a JWT. The value is represented as seconds. It is recommended that JWTs should be short lived.

Example: `JWT_EXP=3600`

#### `BYPASS_SAMESITE`
This value controls the `SamesSite` cookie attribute for the authorization cookie returned by `/login`. If the value is `true`, then the cookie uses `SameSite=None`. Otherwise, it uses `SameSite=Strict`. The value of the environment variable should always be set to `false` in deployed scenarios but will need to be set to `true` for local development.

### Post Deployment Tasks

#### First Deployment
Below are tasks that should run the first time the application is deployed.

#### Seeding the Database
The database should be seeded with the stock organization and users by running the following command:

`spdl seed:run --scope private --env (staging|production)`

### All Deployments
Below are tasks that should run on every deployment.

##### Migrate Database
The following command should be run on every deployment to migrate the database (if using Docker this should be handled by the [dbsetup.sh](https://github.com/Path-Check/safeplaces-backend/blob/dev/dbsetup.sh) script):

`spdl migrate:latest --scope private --env (staging|production)`

## Security Recommendations
We recommend the following for deployed versions of any and all SafePlace APIs:

- The following headers (and appropriate values) should be returned from the server to client:
	- X-Frame-Options
	- X-XSS-Protection
	- X-Content-Type-Options
	- Expect-CT
	- Feature-Policy
	- Strict-Transport-Security
- A suitable "Referrer-Policy" header is included, such as "no-referrer" or "same-origin"
- The server running SafePlaces should not expose any information about itself that is unneeded (i.e., type of server (nginx) and version (1.17.8))
- Implement an appropriate security policy
- All SafePlaces APIs should be deployed behind an appropriately configured firewall
- All requests to and from a SafePlaces API should be over HTTPS
- Old versions of SSL and TLS protocols, algorithms, ciphers, and configuration are disabled, such as SSLv2, SSLv3, or TLS 1.0 and TLS 1.1. The latest version of TLS should be the preferred cipher suite.
- The web server should be configured under a low-privilege system user account.
-  Any debug model provided by the web or application server is disabled.
