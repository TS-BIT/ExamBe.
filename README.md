# ExamBe

SQL script to boot the DB: 
```
CREATE DATABASE ferry_bookings;
USE ferry_bookings;
CREATE TABLE cars(
	id INT(11) AUTO_INCREMENT PRIMARY KEY, NOT NULL, UNIQUE,
	plate VARCHAR(10) NOT NULL, UNIQUE,
	passengers TINYINT(2) NOT NULL,
    weight DECIMAL(4,2) NOT NULL,
	priority TINYINT(1) NOT NULL
);

SELECT * FROM cars;
```
```
Database (MySQL) dump file: "ferry_bookings_cars.sql"
```