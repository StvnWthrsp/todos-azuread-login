CREATE TABLE users (
	oid varchar(255) NOT NULL PRIMARY KEY,
	Name varchar(255),
	Age varchar(255),
	Sex varchar(255)
);

CREATE TABLE todos (
	id varchar(255) NOT NULL PRIMARY KEY,
	item varchar(255),
	owner_oid varchar(255)
);
