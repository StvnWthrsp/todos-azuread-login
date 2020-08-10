FROM mariadb:latest

ENV MYSQL_ROOT_PASSWORD=rootpw
ENV MYSQL_DATABASE users
ENV MYSQL_INITDB_SKIP_TZINFO=1

COPY ./scripts/ /docker-entrypoint-initdb.d/
