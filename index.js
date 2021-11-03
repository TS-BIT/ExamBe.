import express from "express";
import mysql from "mysql";
import cors from 'cors';
import { body, check, validationResult  } from "express-validator";

const port = 3000;
const app = express();

const corsOptions = {
	origin: "http://localhost:4200",
};


const dbConfig = {
	host: "localhost",
	user: "root",
	password: "root",
	database: "ferry_bookings",
	multipleStatements: false,
};

const connection = mysql.createConnection({
	host: dbConfig.host,
	user: dbConfig.user,
	password: dbConfig.password,
	database: dbConfig.database,
});

connection.connect((error) => {
	if (error) throw error;
	console.log("Successfully connected to the database.");
});

app.use(cors(corsOptions));
app.use(express.json());


app.get("/test-conn", (req, res) => {
	connection.query("SELECT 1 + 1 AS solution", (err, rows, fields) => {
		if (err) throw err;
		console.log("The solution is: ", rows[0].solution);
		res.status(200).send({ solution: rows[0].solution });
	});
});

// get all records
app.get("/cars", (req, res) => {
	connection.query("SELECT * FROM cars", (err, rows, fields) => {
		if (err) {
            console.log(err.message);
            return res.status(500).send({
                error_code: err.code,
                error_message: err.sqlMessage,
            });
        };
        try {
            console.log('You got all', rows.length, 'records!');
        } catch (err) {
            console.log(err.message);
        };
        res.status(200).send(rows);
	});
});

// get record by id
app.get("/cars/:id", (req, res) => {
	connection.query(
		"SELECT * FROM cars WHERE id = ?",
		req.params.id,
		(err, rows, fields) => {
			if (err) {
                console.log(err.message);
                return res.status(500).send({
                    error_code: err.code,
                    error_message: err.sqlMessage,
                });
            };
            try {
                console.log('You got record with id: ', rows[0].id);
            } catch (err) {
                console.log(`Record with id ${req.params.id} not found!`);
            };
            if (rows.length === 0) {
                return res.status(404).send({
                    id: +req.params.id,
                    error_message: 'Record not found'
                });
            }
            res.status(200).send(rows);		
		}
	);
});

// create new record
app.post(
	"/cars", 

	//validation:
	check("plate").isLength({min: 2, max: 10}).withMessage("'plate' field must be 2-10 characters long!"),
	check("passengers").isFloat({min: 0, max: 99}).withMessage("'pasangers' field amout must be from 0 to 99 persons!"),
	check("weight").isFloat({min: 0.01, max: 99.99}).withMessage("'weight' field amout must be from 0.01 to 99.99 tons!"),
	check("priority").custom(value => (value == 1 || value == 0) ? true : false).withMessage("when car registration is priority field value = 1, when car registration isn't priority field value = 0!"),

	(req, res) => {
	
		const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log(errors.errors[0].msg);
            return res.status(400).json(errors);
        }
		
		connection.query(
			"INSERT INTO cars (`plate`, `passengers`, `weight`, `priority`) VALUES (?, ?, ?, ?)",
			[
				req.body.plate,
				req.body.passengers,
				req.body.weight,
				req.body.priority,
			],
			(err, rows, field) => {
				if (err) {
					console.log(err.message);
					return res.status(500).send({
						error_code: err.code,
						error_message: err.sqlMessage,
					});
				};
				console.log("created: ", { id: rows.insertId, ...req.body });
				res.status(201).send({ id: rows.insertId, ...req.body });	
			}
		);
	}
);

// update existing (previous) record by id
app.put(
	"/cars/:id",
	
	//validation:
	check("plate").isLength({min: 2, max: 10}).withMessage("'plate' field must be 2-10 characters long!"),
	check("passengers").isFloat({min: 0, max: 99}).withMessage("'pasangers' field amout must be from 0 to 99 persons!"),
	check("weight").isFloat({min: 0.01, max: 99.99}).withMessage("'weight' field amout must be from 0.01 to 99.99 tons!"),
	check("priority").custom(value => (value == 1 || value == 0) ? true : false).withMessage("when car registration is priority field value = 1, when car registration isn't priority field value = 0!"),
		
	(req, res) => {

		const errors = validationResult(req);
        	if (!errors.isEmpty()) {
            	console.log(errors.errors[0].msg);
            	return res.status(400).json(errors);
        	}
		
		connection.query(
			"UPDATE cars SET plate = ?, passengers = ?, weight = ?, priority = ? WHERE id = ?",
		[
				req.body.plate,
				req.body.passengers,
				req.body.weight,
				req.body.priority,
				req.params.id,							
		],
		(err, rows, field) => {
			if (err) {
				console.log(err.message);
				return res.status(500).send({
					error_code: err.code,
					error_message: err.sqlMessage,
				});
			};
			console.log("Updated rows:", rows === undefined ? 0 : rows.affectedRows);
                if (!rows.affectedRows) {
                    console.log(`Record with id ${req.params.id} not found!`);
                    return res.status(404).send({
                        id: +req.params.id,
                        error_message: 'Record not found'
                    });
                }
                res.status(201).send({id: +req.params.id, ...req.body});	
			}
		);
	}
);

// delete record by id
app.delete("/cars/:id", (req, res) => {
	console.log(req.params.id);
	connection.query(
		"DELETE FROM cars WHERE id=?",
		req.params.id,
		(err, rows, field) => {
			if (err) {
                console.log(err.message);
                return res.status(500).send({
                    error_code: err.code,
                    error_message: err.sqlMessage,
                });
            };
            console.log("Deleted rows:", rows.affectedRows);
            if (!rows.affectedRows) return res.status(404).send({
                id: +req.params.id,
                error_message: 'Record not found'
            });
            res.status(204).send({
                id: +req.params.id,
                message: `Record with id ${req.params.id} deleted`
            });					
		}
	);
});

// total cars:
app.get("/total", (req, res) => {
    connection.query("SELECT count(*) as total_cars FROM cars", (err, rows, fields) => {
        if (err) {
            console.log(err.message);
            return res.status(500).send({
                error_code: err.code,
                error_message: err.sqlMessage,
            });
        };
        console.log("Total cars: ", rows[0].total_cars);
        res.status(200).send({ total_cars: rows[0].total_cars });
    });
});

// total weight:
app.get("/weight", (req, res) => {
    connection.query("SELECT sum(weight) as total_weight FROM cars", (err, rows, fields) => {
        if (err) {
            console.log(err.message);
            return res.status(500).send({
                error_code: err.code,
                error_message: err.sqlMessage,
            });
        };
        console.log("Total weight: ", rows[0].total_weight);
        res.status(200).send({ total_weight: rows[0].total_weight });
    });
});


app.listen(port, () =>
	console.log(`App listening on port ${port}!`)
);