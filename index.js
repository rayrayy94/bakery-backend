const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

let app = express();

require('./DB/Conn');
const Cake = require('./Model/Cake');
const Order = require('./Model/Orders');
const Auth = require('./Model/Auth');
const Wallet = require('./Model/Wallet');
const stripe = require("stripe")('sk_test_51OYZnQC6MQ7KanJe4vtEV1eOZRGDhpnzE3dYX2j7jXY6kuYyKPXX57lMBk4poGlsicNo5kTgMhVQ090iwADNIM2D008t9Hvspx');


app.use(cors());
app.use(express.json());
app.use(express.static("public"));


const PORT = 8080;

// upload a cake
app.post('/cake', (req, res) => {
    try{
        let addCake = new Cake(req.body);
        addCake.save().then(()=> {
            res.status(200).send(addCake);
        }).catch((e)=> {
            res.status(404).send(e);
        })
    }
    catch(e){
        res.status(500).send(e);
    }
});

// get data for all the cakes in database
app.get('/cake', async (req, res) => {
    try{
        let findCake = await Cake.find();
        res.status(200).send(findCake);
    }
    catch{
        res.status(500).send('Server Crashed');
    }
});



// toggle between 2 types of cakes and their listings
app.get('/togglecake/:cakeType', async (req, res) => {
    try{
        const cakeType = req.params.cakeType;
        let findCake = await Cake.find({cakeType: cakeType, availabilityStatus: true});
        res.status(200).send(findCake);
    }
    catch{
        res.status(500).send('Server Crashed');
    }
});

// get a specific cake by its ID
app.get('/cake/:id', async (req, res) => {
    try{
        let id = req.params.id
        let findCake = await Cake.findById(id);
        res.status(200).send(findCake);
    }
    catch{
        res.status(500).send('Server Crashed');
    }
});


// delete a cake by its ID
app.delete('/cake/:id', async (req, res) => {
    try{
        let id = req.params.id;
        let deleteCake = await Cake.deleteOne({_id: id});
        res.status(200).send(deleteCake);
    }
    catch{
        res.status(500).send('Server Crashed');
    }
});


// update cake info
app.patch('/cake/:id', async (req, res) => {
    try{
        let id = req.params.id;
        let updateCake = await Cake.findByIdAndUpdate(id, req.body, {new: true});
        res.status(200).send(updateCake);
    }
    catch{
        res.status(500).send('Server Crashed');
    }
});










// WALLET 
app.post('/orders', (req, res) => {
    try{
        let orderInfo = new Order(req.body);
        orderInfo.save().then(()=> {
            res.status(200).send(orderInfo);
        }).catch((e)=> {
            res.status(404).send(e)
        });
    }
    catch{
        res.status(500).send('Server Crashed');
    }
});

app.get('/orders', async (req,res) => {
    try{
        let orders = await Order.find();
        res.status(200).send(orders); 
    }
    catch{
        res.status(500).send('Server Crashed');
    }
});



app.patch('/orders/:id', async (req, res)=> {
    try{
        const id = req.params.id;
        const updateOrder = await Order.findByIdAndUpdate(id, req.body, {new: true});
        const updateWallet = await Wallet.findOneAndUpdate({orderId: id}, req.body, {new: true});
        res.status(200).send({
            order: updateOrder,
            wallet: updateWallet
        });
    }
    catch{
        res.status(500).send('Server Crashed');
    }
});



app.get('/totalEarnings/:sellerId', async (req, res)=> {
    try{
        const sellerId = req.params.sellerId;
        const sumResult = await Wallet.aggregate([
            {
                $match: {sellerId: sellerId, paymentStatus: true, orderStatus: 'completed'}
            },
            {
                $group: {
                    _id: '$sellerId',
                    totalAmount: { $sum: '$amount'}
                }
            }
        ]);

        if( sumResult.length > 0 ){
            res.json({ totalAmount: sumResult[0].totalAmount });
        }else{
            res.json({ totalAmount: 0 })
        }

    }
    catch{
        res.status(500).send('Server Crashed');
    }
});


app.get('/expectedEarnings/:sellerId', async (req, res)=> {
    try{
        const sellerId = req.params.sellerId;
        const sumResult = await Wallet.aggregate([
            {
                $match: {sellerId: sellerId, orderStatus: 'accepted'}
            },
            {
                $group: {
                    _id: '$sellerId',
                    totalAmount: { $sum: '$amount'}
                }
            }
        ]);

        if( sumResult.length > 0 ){
            res.json({ totalAmount: sumResult[0].totalAmount });
        }else{
            res.json({ totalAmount: 0 })
        }

    }
    catch{
        res.status(500).send('Server Crashed');
    }
});


app.get('/orderAnalytics/:id', async (req, res)=> {
    try{
        const sellerId = req.params.id;
        const orders = await Order.find({sellerId: sellerId, 
        $or: [
            {orderStatus: { $ne: 'cancelled', $ne: 'rejected' }}
        ]
        });
        if(orders.length > 0){
            res.status(200).send(orders);
        }else{
            res.status(404).send('No Orders Found!');
        }
    }
    catch{
        res.status(500).send('Server Crashed');
    }
});


app.get('/orderCount/:id', async(req, res)=> {
    try{
        const id = req.params.id;
        const pendingOrders = await Order.find({sellerId: id, orderStatus: 'pending'});
        const acceptedOrders = await Order.find({sellerId: id, orderStatus: 'accepted'});
        const rejectedOrders = await Order.find({sellerId: id, orderStatus: 'rejected'});
        const cancelledOrders = await Order.find({sellerId: id, orderStatus: 'cancelled'});
        const completedOrders = await Order.find({sellerId: id, orderStatus: 'completed'});

        res.status(200).send({
            data: [
                pendingOrders.length,
                acceptedOrders.length,
                rejectedOrders.length,
                cancelledOrders.length,
                completedOrders.length,
            ],
            labels: ['Pending', 'Accepted', 'Rejected', 'Cancelled', 'Completed']
        });

    }
    catch{
        res.status(500).send('Server Crashed');
    }
})














// Get all listings for specific seller
app.get('/mycakes/:sellerid', async (req, res)=> {
    try{
        const sellerId = req.params.sellerid;
        let findCakes = await Cake.find({sellerId: sellerId});
        res.status(200).send({
            listing: findCakes,
            count: findCakes.length
        });
    }
    catch{
        res.status(500).send('Server Crashed');
    }
})



// return orders for specific sellerID
app.get('/sellerorders/:sellerId/:orderStatus', async(req, res)=> {
    try{
        const sellerId = req.params.sellerId;
        const orderStatus = req.params.orderStatus;
        let findSellerOrders = await Order.find({sellerId: sellerId, orderStatus: orderStatus, 
        $or: [
            {paymentType: { $ne: 'card'}},
            {paymentType: 'card', paymentStatus: 'true'}
        ]
        });
        res.status(200).send(findSellerOrders);
    }
    catch{
        res.status(500).send('Server Crashed');
    }
})



// return orders for specific customerID
app.get('/customerorders/:customerId/:orderStatus', async(req, res)=> {
    try{
        const customerId = req.params.customerId;
        const orderStatus = req.params.orderStatus;
        let findCustomerOrders = await Order.find({customerId: customerId, orderStatus: orderStatus, 
        $or: [
            {paymentType: { $ne: 'card'}},
            {paymentType: 'card', paymentStatus: 'true'}
        ]
        });
        res.status(200).send(findCustomerOrders)
    }
    catch{
        res.status(500).send('Server Crashed');
    }
})



// return sellers only
app.get('/sellerAccountType', async (req, res)=> {
    try{
        let findAccountType = await Auth.find({accountType: 'seller'});
        let accountPromiseArr = findAccountType.map(async (item)=> {
            let seller = await Cake.find({sellerId: item._id});
            if(seller.length > 1){
                return item;
            }
            
        })
        let finalArr = (await Promise.all(accountPromiseArr)).slice(0,3);
        res.status(200).send(finalArr);
    }
    catch{
        res.status(500).send('Server Crashed');
    }
})







// Auth Sign Up Start

// compare emails in database vs user email when signing up
// if email is match during signup, send message saying 'email in use'
// else continue with signup process

// why cant user userEmail when destructing ?

app.post('/signup', async (req, res) => {
    try{
        let {email} = req.body;

        let findEmail = await Auth.findOne({email: email});

        if(findEmail){
            res.status(404).send({
                message: "Email Already In Use!"
            });
        }
        else{
            let addUser = new Auth(req.body);
            addUser.save().then(()=> {
                res.status(200).send({
                    message: 'Signup Successful'
                });
            }).catch((e)=> {
                res.status(404).send(e);
            });
        }
    }
    catch{
        res.status(500).send('Server Crashed')
    }
});

app.post('/login', async (req, res)=> {
    try{
        let {userEmail, userPassword} = req.body;

        let findUser = await Auth.findOne({email: userEmail});
        
        if(findUser){
            let matchPassword = await bcrypt.compare(userPassword, findUser.password);
            if(matchPassword){
                const {_id, firstName, lastName, email, accountType, phoneNumber, userImage} = findUser;
                res.status(200).send({
                    message: 'Login Successful',
                    data: {_id, firstName, lastName, email, accountType, phoneNumber, userImage}
                });
            }
            else{
                res.status(404).send({
                    message: 'Incorrect Password'
                });
            }
        }
        else{
            res.status(404).send({
                message: 'Incorrect Email'
            })
        }
    }
    catch{
        res.status(500).send('Server Crashed');
    }
})


app.get('/login/:id', async (req, res)=> {
    try{
        let id = req.params.id;
        let findUser = await Auth.find({_id: id});
        res.status(200).send(findUser);
    }
    catch{
        res.status(500).send('Server Crashed')
    }
})




// Auth Sign Up End 











// Stripe Payment Code
const calculateOrderAmount = (items) => {
    // Replace this constant with a calculation of the order's amount
    // Calculate the order total on the server to prevent
    // people from directly manipulating the amount on the client
    return 1400;
  };
  
  app.post("/create-payment-intent", async (req, res) => {
    const { items } = req.body;
  
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: calculateOrderAmount(items),
      currency: "usd",
      // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
      automatic_payment_methods: {
        enabled: true,
      },
    });
  
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  });





  app.post('/wallet', (req, res)=> {
    try{
        let walletData = new Wallet(req.body);
        walletData.save().then(()=> {
            res.status(200).send(walletData);
        }).catch((e)=> {
            res.status(404).send(e);
        })
    }
    catch{
        res.status(500).send('server crashed');
    }
  });

  app.patch('/wallet/:orderId', async (req, res)=> {
    try{
        const id = req.params.orderId;
        const updateWallet = await Wallet.findOneAndUpdate({orderId: id}, req.body, {new: true});
        res.status(200).send(updateWallet);
    }
    catch{
        res.status(500).send('Server Crashed');
    }
});





















// NODEMAILER CONTACT 
app.post('/contact', (req, res)=> {
    const {fullName, email, subject, message} = req.body;

    var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'rehanarshad2415@gmail.com',
        pass: 'egvh iajk huzq vmxm'
    }
    });

    var mailOptions = {
    from: email,
    name: fullName,
    to: 'rehanarshad2415@gmail.com',
    subject: subject,
    text: message
    };

    transporter.sendMail(mailOptions, function(error, info){
    if (error) {
        console.log(error);
    } else {
        console.log('Email sent: ' + info.response);
    }
    });
});






















app.listen(PORT, ()=> {
    console.log(`API running on port ${PORT}`);
});

