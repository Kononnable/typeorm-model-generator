# Setting up environment
## Building
After cloning the repository you can check your changes made to source code without compiling whole library. Just run `npm start` to run typeorm-model-generator through ts-node. It helps with development speed and avoids problem with setting correct sourcemaps when debugging.

However if you want to build typeorm-model-generator you can do this by running:
```
npm run build
```
It might come handy if you want to build full pipeline workflow with model generator and install it through `npm link`.
## Running Tests Locally
To run tests you need to have docker and docker-compose installed. You may also use non-dockerized database servers but it's not recommended - they might use non-default database engine settings.
### Oracle Database
If you want to run oracle tests locally you must have [oracle client](https://oracle.github.io/node-oracledb/INSTALL.html#quickstart) configured for your machine and accepted oracle license on [DockerHub](https://hub.docker.com/_/oracle-database-enterprise-edition). Because of oracle client limitations  i.e. it's not distributed for 32bit environments you have to install oracledb manually:
```
npm install oracledb --no-save
```
### Configuration
Tests use environment values to provide credentials for connecting to multiple database engines. For developer convenience there is prepared env file with default connection settings(for connecting to dockerized db engines). After cloning the repo you just need to rename the env file:
```
cp .env.dist .env
```
### Database engines
Next you have to start db engines. If you want to test all of the drivers and have configured oracle correctly you can just:
```
docker-compose up -d
```
You can also start just specific database engines e.g.:
```
docker-compose up -d mysql postgres mariadb
```
