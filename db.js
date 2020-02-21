const mongoose = require('mongoose')


const connect = () => {
    const options = {
        useNewUrlParser: true,
        reconnectTries: 10,
        reconnectInterval: 500, 
        connectTimeoutMS: 10000,
        // useUnifiedTopology: true 
    };
    
    const {
        MONGO_USERNAME,
        MONGO_PASSWORD,
        MONGO_HOSTNAME,
        MONGO_PORT,
        MONGO_DB
      } = process.env;
      
    //   const url = `mongodb://${MONGO_USERNAME}:${encodeURIComponent(MONGO_PASSWORD)}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?authSource=admin&replicaSet=rs`;
    const url = `mongodb://${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?replicaSet=rs`
      
    return mongoose.connect(url, options)
}

  module.exports = {
      connect: connect
  }