const escapeHtml = require('escape-html');
const express = require('express');
const fs = require('fs');
const marked = require('marked');
const path = require('path');
const https = require('https');
const http = require('http');
const axios = require('axios').default;

const mustacheExpress = require('mustache-express');
const morgan = require('morgan')

const forge = require('node-forge')
const forge_sha1 = forge.md.sha1;

const JSONdb = require('simple-json-db');


// DATABASES

console.log("Setting up the database...")
const TilesDB = new JSONdb('image1.json', {jsonSpaces: 2, syncOnWrite: false}); 
const MiscDB = new JSONdb('misc.json', {jsonSpaces: 2});
const ActiveOrdersDB = new JSONdb('orders.json', {jsonSpaces: 2});
const PastOrdersDB = new JSONdb('orders_history.json', {jsonSpaces: 2});

if (!MiscDB.has('orderId'))
    MiscDB.set('orderId', 0);

function reserve_tiles(tile_ids, owner) {
    let all_tiles = TilesDB.JSON();
    tile_ids.forEach(tile_id => {
        if (all_tiles[tile_id].status == 'free') {
            all_tiles[tile_id].status = 'reserved';
            all_tiles[tile_id].owner = owner;
        }
    });
    TilesDB.JSON(all_tiles);
}
function chown_tiles(tile_ids, new_owner) {
    let all_tiles = TilesDB.JSON();
    tile_ids.forEach(tile_id => {
        if (all_tiles[tile_id].owner == new_owner) {
            all_tiles[tile_id].status = 'bought';
        }
    });
    TilesDB.JSON(all_tiles);
    TilesDB.sync();
}
function free_tiles(tile_ids, owner) {
    let all_tiles = TilesDB.JSON();
    tile_ids.forEach(tile_id => {
        if (all_tiles[tile_id].status == 'reserved' && (owner == undefined || all_tiles[tile_id].owner == owner)) {
            all_tiles[tile_id].status = 'free';
            all_tiles[tile_id].owner = '';
        }
    });
    TilesDB.JSON(all_tiles);
}

function place_order(order_ref, order) {
    ActiveOrdersDB.set(order_ref, order)
    reserve_tiles(order.cart, order.owner)
}
function confirm_order(order_ref, order) {
    ActiveOrdersDB.delete(order_ref);
    PastOrdersDB.set(order_ref, order);
    chown_tiles(order.cart, order.owner);
}
function reset_order(order_ref, order) {
    ActiveOrdersDB.delete(order_ref);
    free_tiles(order.cart, order.owner);
}


// CONFIG

const DOMAIN = process.env.DOMAIN || "pieceofpixel.store";
const FONDY_TOKEN = process.env.FONDY_TOKEN;
const WFP_TOKEN = process.env.WFP_TOKEN;
const WFP_MERCHANT = process.env.WFP_MERCHANT;
const SKIP_WFP_SIGN_CHECK = process.env.SKIP_WFP_SIGN_CHECK || false;

if (!WFP_TOKEN) throw Error("No WFP_TOKEN!");
if (!WFP_MERCHANT) throw Error("No WFP_MERCHANT!");

const TILE_PRICE = Number(process.env.TILE_PRICE) || 20;

//
// express config
//
const app = express();

app.use(morgan('combined'));
app.use(express.static('static'));

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.engine('m', mustacheExpress());
app.set('view engine', 'm');

// FUNCTIONS

function next_order_id() {
    let new_order_id = MiscDB.get('orderId') + 1;
    MiscDB.set('orderId', new_order_id);
    return new_order_id;
}

// WAYFORPAY payments

function generate_wfp_request_signature(data) {
    let hmac = forge.hmac.create();
    hmac.start('md5', WFP_TOKEN);

    hmac.update(data.merchantAccount + ';');
    hmac.update(data.merchantDomainName + ';');
    hmac.update(data.orderReference + ';');
    hmac.update(data.orderDate + ';');
    hmac.update(data.amount + ';');
    hmac.update(data.currency + ';');
    hmac.update(data.productName + ';');
    hmac.update(data.productCount + ';');
    hmac.update(data.productPrice);
    
    let sign = hmac.digest().toHex();

    return sign;
}

function check_signature_from_wfp(data) {
    let hmac = forge.hmac.create();
    hmac.start('md5', WFP_TOKEN);

    hmac.update(data.merchantAccount + ';');
    hmac.update(data.orderReference + ';');
    hmac.update(data.amount + ';');
    hmac.update(data.currency + ';');
    hmac.update(data.authCode + ';');
    hmac.update(data.cardPan + ';');
    hmac.update(data.transactionStatus + ';');
    hmac.update(data.reasonCode + '');
    
    let sign = hmac.digest().toHex();

    return sign;
}

function generate_wfp_result_signature(data) {
    let hmac = forge.hmac.create();
    hmac.start('md5', WFP_TOKEN);

    hmac.update(data.orderReference + ';');
    hmac.update(data.status + ';');
    hmac.update(data.time + '');
    
    let sign = hmac.digest().toHex();

    return sign;
}


//
// ROUTES
//

app.all('/', function(req, res) {
    res.render('index');
})

app.all('/image', function(req, res){

    let rows = TilesDB.get('rows'); 
    let cols = TilesDB.get('cols');

    let width = `${Math.floor(100.0/cols)}%`;

    let data = {};
    data.rows = [];

    let imgs = {};
    for (let i = 1; i <= rows; i++) {
        let row = [];
        for (let j = 1; j <= cols; j++) {
            let tile_id = `tile_${i}_${j}`;
            row.push({image_id: tile_id});
            imgs[tile_id] = TilesDB.get(tile_id);
        }
        data.rows.push({cols: row});
    }

    data.image_data = JSON.stringify(imgs);
    data.image_width = width;

    res.render('image', data);
});


app.all('/checkout', async function(req, res) {
    console.log('checkout: ', req.body);

    let order_cart;
    try {
        order_cart = JSON.parse(req.query.order_cart);
        if (!Array.isArray(order_cart) || order_cart.some((elem) => {return typeof elem !== 'string'})) {
            throw "";
        }
    } catch(e) {
        // parse failed
        console.error("order_cart parse failed:", e)
        res.redirect('/paymentfailed');
        return;
    }
    // let Ntiles = req.query.ntiles ;
    let money = Number(req.query.money);
    let new_order_id = next_order_id();

    let wfp_data = {
        merchantAccount: WFP_MERCHANT, 
        merchantDomainName: DOMAIN,
        merchantTransactionType: "SALE",
        language: "AUTO",
        returnUrl: `https://${DOMAIN}/thankyou`,
        serviceUrl: `https://${DOMAIN}/wfp`,
        orderReference: `A${new_order_id}`,
        orderDate: Date.now(),
        amount: `${money}.00`,
        currency: "UAH",
        "productName": "Pile of pixels",
        "productPrice": `${TILE_PRICE}.00`,
        "productCount": order_cart.length,
    }
    wfp_data.merchantSignature = generate_wfp_request_signature(wfp_data);
    
    const response = await axios({
        url: 'https://secure.wayforpay.com/pay?behavior=offline',
        method: 'post',
        data: JSON.stringify(wfp_data),
        headers: {'Content-Type': 'application/json'}
    });
    const wfp_response_data = await response.data;
    
    let owner;
    if (req.query.owner_name) 
        owner = req.query.owner_name.replace(/[^ЙЦУКЕНГШЩЗХЇФІВАПРОЛДЖЄЯЧСМИТЬБЮґҐйцукенгшщзхїфівапролджєячсмитьбю\.a-zA-Z0-9_\ ]/, '').trim();
    else 
        owner = "Анонім";

    console.log("Got response from WFP: ", wfp_response_data);
    if (wfp_response_data.url) {
        place_order("A"+new_order_id, {
            cart: order_cart,
            cost: money,
            owner: owner
        });
        res.redirect(wfp_response_data.url);
    } else {
        res.redirect('/paymentfailed');
    }
});

app.all('/thankyou', function(req,res) {
    console.log("payment successful: ", req.body);
    res.render('thankyou');
})
app.all('/paymentfailed', function(req,res) {
    console.log("payment failed: ", req.body);
    res.render('paymentfailed');
})

// PAYMENT RESULT

function make_wfp_response(order_ref, status='accept', time=Date.now()) {
    let data = {
        orderReference: order_ref,
        status: status,
        time: time
    }
    data.signature = generate_wfp_result_signature(data);
    return data;
}

app.post('/wfp', function(req,res) {
    let keys=Object.keys(req.body);
    if (!keys) {
        res.sendStatus(400);
	    return;
    }
<<<<<<< HEAD
    let wfp_data;
    try {
        wfp_data = JSON.parse(keys[0]);
=======
    try {
        let wfp_data = JSON.parse(keys[0]);
>>>>>>> 1937e89f684636f20030da73e1ef6f09aa21b516
        console.log("WFP: ", wfp_data);
    } catch (e) {
        console.log("Failed to parse wfp_data");
        res.sendStatus(400);
	    return;
    }

    console.log("> sign: ", wfp_data.merchantSignature);
   
    if (!SKIP_WFP_SIGN_CHECK) {
        if (!wfp_data.merchantSignature) {
            console.error("No signature. Dismissing.");
            res.sendStatus(400);
            return;
        }
        
        let signature = check_signature_from_wfp(wfp_data);
        if (signature != wfp_data.merchantSignature) {
            console.error("Invalid signature. Dismissing.");
            res.sendStatus(400);
            return;
        }
    }

    let order = ActiveOrdersDB.get(wfp_data.orderReference);
    if (!order) {
        console.error("Order not found"); 
        res.sendStatus(400);
        return;
    } 
    if (wfp_data.reasonCode != 1100) {
        console.error("something gone wrong with payment. resetting order.");
        reset_order(wfp_data.orderReference, order);
        res.json(make_wfp_response(wfp_data.orderReference));
        return;
    }

    console.log("order confirmed!");
    confirm_order(wfp_data.orderReference, order);
    res.json(make_wfp_response(wfp_data.orderReference));
});

app.all('/fondy', function(req,res) {
    console.log("FONDY: ", req.body);
    res.sendStatus(200);
});


// MAIN



PORT = process.env.PORT || 3000


let privateKey;
let certificate;

var server = http.createServer(app);
if (!process.env.DEBUG) {
    privateKey = fs.readFileSync('privkey.pem');
    certificate = fs.readFileSync('fullchain.pem');
    var credentials = {key: privateKey, cert: certificate};
    server = https.createServer(credentials, app);
}


server.listen(PORT, function() {
    console.log(`Express started on port ${PORT}`);
})

