'use strict'

const fs = require('fs');
const express = require('express');
const app = express();
app.use(express.static('public'));
const cors = require('cors');
app.use(cors());

const { Pool } = require('pg');

const bodyParser = require('body-parser');
const { Console } = require('console');
// const { get } = require('http');
app.use(bodyParser.json());

const port = process.env.PORT || 8000;
const DB_HOST = process.env.DATABASE_HOST || '127.0.0.1';

const pool = new Pool ({
    user:'postgres',
    host: DB_HOST,
    database: 'jdmcars',
    password: 'password',
    port: 5432
});

// GET request to /jdmcars- Read all the cars
app.get('/api/jdmcars', (req, res, next) => {
  // Get all the rows in pets table
  pool.query('SELECT * FROM model', (err, result) => {
    if (err){
      return next(err);
    }
    
    let rows = result.rows;
    console.log(rows);
    return res.send(rows);
  });
});

// GET request to /pets/:id - Read one pet
app.get('/api/jdmcars/:id', (req, res, next) => {
  // Get a single ship from the table
  let id = Number.parseInt(req.params.id);
  if (!Number.isInteger(id)){
    res.status(404).send("No car found with that ID");
  }
  console.log("jdmcars ID: ", id);
  
  pool.query('SELECT * FROM model WHERE model_id = $1', [id], (err, result) => {
    if (err){
      return next(err);
    }
    
    let jdmcars = result.rows[0];
    console.log("Single jdm car ID", id, "values:", jdmcars);
    if (jdmcars){
      return res.send(jdmcars);
    } else {
      return res.status(404).send("No cars found with that ID");
    }
  });
});

// POST to /jdmcars - Create a car
app.post('/api/jdmcars', (req, res, next) => {
  //const age = Number.parseInt(req.body.age);
  const make_sn = Number.parseInt(req.body.make_sn);
  const {name, engine} = req.body;
  console.log("Request body name, engine, make_sn", name, engine, make_sn);
  // check request data - if everything exists and id is a number
  if (name && engine && make_sn){
    pool.query('INSERT INTO model (name, engine, make_sn) VALUES ($1, $2, $3) RETURNING *', [name, engine, make_sn], (err, data) => {
      const car = data.rows[0];
      console.log("Created new car: ", car);
      if (car){
        return res.send(car);
      } else {
        return next(err);
      }
    });

  } else {
    return res.status(400).send("Unable to create car from request body");
  }

});


// PATCH to /pets/:id - Update ship
app.patch('/jdmcars/:id', (req, res, next) => {
  // parse id from URL
  const id = Number.parseInt(req.params.id);
  // get data from request body
  const sn = Number.parseInt(req.body.make_sn);
  const {name, engine} = req.body;
  // if id input is ok, make DB call to get existing values
  if (!Number.isInteger(id)){
    res.status(400).send("No car found with that ID");
  }
  console.log("Model ID: ", id);
  // get current values of the pet with that id from our DB
  pool.query('SELECT * FROM model WHERE model_id = $1', [id], (err, result) => {
    if (err){
      return next(err);
    }
    console.log("request body name, engine, sn: ", name, engine, sn);
    const car = result.rows[0];
    console.log("Single car ID from DB", id, "values:", car);
    if (!car){
      return res.status(404).send("No car found with that ID");
    } else {
      // check which values are in the request body, otherwise use the previous pet values
      // let updatedName = null; 
         // if (name){
      //   updatedName = name;
      // } else {
      //   updatedName = pets.name;
      // }
      const updatedName = name || car.name; 
      const updatedEngine = engine || car.engine;
      const updatedMake = sn || car.sn;

      pool.query('UPDATE model SET name=$1, engine=$2, sn=$3 WHERE model_id = $4 RETURNING *', 
          [updatedName, updatedEngine, updatedMake, id], (err, data) => {
        
        if (err){
          return next(err);
        }
        const updatedCar = data.rows[0];
        console.log("updated row:", updatedCar);
        return res.send(updatedCar);
      });
    }    
  });
});


// DELETE to /pets/:id - Delete a ship
app.delete("/jdmcars/:id", (req, res, next) => {
  const id = Number.parseInt(req.params.id);
  if (!Number.isInteger(id)){
    return res.status(400).send("No car found with that ID");
  }

  pool.query('DELETE FROM model WHERE model_id = $1 RETURNING *', [id], (err, data) => {
    if (err){
      return next(err);
    }
    
    const deletedCar = data.rows[0];
    console.log(deletedCar);
    if (deletedCar){
      // respond with deleted row
      res.send(deletedCar);
    } else {
      res.status(404).send("No car found with that ID");
    }
  });
});

app.get('/boom', (_req, _res, next) => {
  next(new Error('BOOM!'));
});

app.get('/test', (req, res) => {
  res.send("Hello World!");
});

app.use((_req, res) => {
  res.sendStatus(404);
});

// eslint-disable-next-line max-params
app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err.stack);
  res.sendStatus(500);
});


app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log('Listening on port', port);
});

module.exports = app;