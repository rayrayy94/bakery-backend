const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    orderId: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: Boolean,
        default: false
    },
    sellerId: {
        type: String,
        required: true
    },
    orderStatus: {
        type: String,
        default: 'pending'
    },
});

const Wallet = new mongoose.model('wallet', walletSchema);

module.exports = Wallet;