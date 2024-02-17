const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    cakeName: {
        type: String,
        required: true
    },
    cakeType: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    paymentType: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    cakeImage: {
        type: String,
        required: true
    },
    customerId: {
        type: String,
        required: true
    },
    sellerId: {
        type: String,
        required: true
    },
    orderStatus: {
        type: String,
        default: "pending"
    },
    paymentStatus: {
        type: Boolean,
        default: false
    },
});

const Order = new mongoose.model('orders', orderSchema);
module.exports = Order;
