const mongoose = require('mongoose');
require('dotenv').config()

mongoose.connect(`${process.env.MONGO_URI}/bakery-app`).then(()=> {
    console.log('Connected to DB');
}).catch((e)=> {
    console.log(e);
});