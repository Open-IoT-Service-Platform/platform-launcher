FROM postgres:9.4-alpine

COPY ./oisp-frontend/public-interface/deploy/postgres/base/*.sql /docker-entrypoint-initdb.d/
COPY ./oisp-frontend/public-interface/scripts/database/*.sh /docker-entrypoint-initdb.d/
