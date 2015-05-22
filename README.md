# Garzoni Font Visualization
Garzoni font descriptive statistics web platform.

## Installation:

* Install Node.js: https://nodejs.org/
* Clone this repo:
```
git clone https://github.com/MGrin/Garzoni-Font-Visualization.git
```
* Install npm and bower dependencies:
```
cd Garzoni-Font-Visualization
npm install
bower install
```
* Launch the server:
```
npm start
```

## Project structure
```
Garzoni-Font-Visualization
  |-- Procfile # File used by foreman (Heroku) to start the server
  |-- README.md # This README
  |-- app.js # Main server file, contain all server initialization and all pathes. The only one server file for the moment
  |-- bower.json # Bower config file
  |-- package.json # NPM config file
  |-- node_modules/ # NPM modules directory. Automatically generated after npm install
  |-- server/ # Directory containing all resources the server is dealing with
  |     |-- data/ # Directory with the data file
  |           |-- garzoni.csv # the data file that is provided to client
  |
  |-- client/ # Directory containing all resources the client is dealing with
        |-- css/  # Directory with css files
        |-- jade/ # Directory with jade files (analog to HTML, but better. Node.js server transforms them automatically to html)
        |-- js/   # Directory with js
            |-- lib/ # Directory with bower modules. Automatically generated on bower install
            |-- dataHandler.js # Client-side script that works with the data provided by server (For the moment - only *.csv file)
            |-- visualize.js # Client-side script that deals with visualizing data and many other things
            |-- index.js # Main client-side js file