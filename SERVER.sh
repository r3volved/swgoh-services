#!/bin/bash

#SET YOUR PORTS
cliport=3110
statport=3201
gpport=3202
langport=3203


#Clear screen
clear

#Clear pm2 of all services
echo "Cleaning pm2 ..."
(
  pm2 delete common >>/dev/null
  pm2 delete stats >>/dev/null
  pm2 delete gpower >>/dev/null
  pm2 delete language >>/dev/null  
) >>/dev/null 

#Start common data service
echo "Starting common data ..."
cd common
INIT=true DEBUG=true PORT=${cliport} pm2 start server.js --name="common"
cd ..

#Start stats service
echo "Starting stats service ..."
cd stats
PORT=${statport} pm2 start server.js --name="stats"
cd ..

#Start gp service
echo "Starting galactic power service ..."
cd power
PORT=${gpport} pm2 start server.js --name="gpower"
cd ..

#Start localization service
echo "Starting localization service ..."
cd localize
PORT=${langport} pm2 start server.js --name="language"
cd ..
