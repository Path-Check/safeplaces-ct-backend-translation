const path = require('path');
const passport = require('./app/lib/passport');

const config = {
  port: process.env.PORT || '3000',
  appFolder: path.join(__dirname, 'app')
}

const server = require('@pathcheck/safeplaces-server')(config)

server.setPassport(passport)
server.setupAndCreate()

module.exports = server