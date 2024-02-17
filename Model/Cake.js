const mongoose = require('mongoose');

const cakeSchema = new mongoose.Schema({
    cakeName: {
        type: String,
        required: true
    },
    cakeImage: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    cakeType: {
        type: String,
        required: true
    },
    flavor: {
        type: String,
        required: true
    },
    sellerId : {
        type: String,
        required: true
    },
    availabilityStatus: {
        type: Boolean,
        default: true
    }
});

let Cake = new mongoose.model('cakes', cakeSchema);

module.exports = Cake;