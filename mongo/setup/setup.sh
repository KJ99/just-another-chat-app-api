#!/bin/bash

echo *****************************************
echo setup.sh version 2
echo Starting a replica set
echo *****************************************

result=-1

sleep 10 | echo waiting...
echo connecting
mongo mongodb://mongo-rs0-1:27017 replicaSet.js

