const mongoose = require('mongoose')


const connect = () => {
    const options = {
        useNewUrlParser: true,
        reconnectTries: 10,
        reconnectInterval: 500, 
        connectTimeoutMS: 10000,
        useUnifiedTopology: true 
    };
    
    const {
        MONGO_USERNAME,
        MONGO_PASSWORD,
        MONGO_HOSTNAME,
        MONGO_PORT,
        MONGO_DB
      } = process.env;
      
       //const url = `mongodb://${MONGO_USERNAME}:${encodeURIComponent(MONGO_PASSWORD)}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?authSource=admin&replicaSet=rs`;
    //const url = `mongodb://${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?replicaSet=rs`
    const url = `mongodb://mongo-rs0-1,mongo-rs0-2,mongo-rs0-3/${MONGO_DB}?replicaSet=rs0&readPreference=primary`
      
    return mongoose.connect(url, options)
}

  module.exports = {
      connect: connect
  }