const mongoose = require('mongoose')


const connect = () => {
    const options = {
        useNewUrlParser: true,
        reconnectTries: 10,
        reconnectInterval: 500, 
        connectTimeoutMS: 10000,
    };
    
    const {
        MONGO_USERNAME,
        MONGO_PASSWORD,
        MONGO_HOSTNAME,
        MONGO_PORT,
        MONGO_DB
      } = process.env;
      
      const url = `mongodb://${MONGO_USERNAME}:${encodeURIComponent(MONGO_PASSWORD)}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;
      
    return mongoose.connect(url, options)
}

  module.exports = {
      connect: connect
  }