const escapeHtml = require('escape-html');
const express = require('Express');
const fs = require('fs');
const marked = require('marked');
const path = require('path');
const https = require('https');
const fetch = require('node-fetch');

const app = express();
const mustacheExpress = require('mustache-express');
const morgan = require('morgan')

const forge = require('node-forge')
const forge_sha1 = forge.md.sha1;


function sha1(s) {
    let md = forge_sha1.create();
    md.update(s);
    return md.digest().toHex();
}

const DOMAIN = process.env.DOMAIN || "pieceofpixel.store";
const FONDY_TOKEN = process.env.FONDY_TOKEN;
const WFP_TOKEN = process.env.WFP_TOKEN;

const TILE_PRICE = Number(process.env.TILE_PRICE) || 20;

//
// express config
//

app.use(morgan('combined'));
app.use(express.static('static'));

app.engine('m', mustacheExpress());
app.set('view engine', 'm');

// FUNCTIONS

function next_order_id() {
    try {
        fs.writeFileSync('order_id.txt', cached_order_id+1);        
    } catch (error) { }
    cached_order_id = cached_order_id + 1;
    return cached_order_id;
}

// FONDY payment
fondy_token = FONDY_TOKEN;

fondy_data = {}
fondy_data.token = fondy_token;
fondy_data.amount = 2000;
fondy_data.currency = "UAH";
fondy_data.merchant_id = 1504148;
fondy_data.order_desc = "Внесок у благодійний збір грошей";
fondy_data.order_id = "ID0";
fondy_data.response_url = `https://${DOMAIN}/thankyou`;
fondy_data.server_callback_url = `https://${DOMAIN}/fondy`;

cached_order_id = 1
try {
    cached_order_id = fs.readFileSync('order_id.txt').trim();
} catch(e) { }

function fondy_signature(order_id) {
    data = fondy_data;
    data.order_id = order_id;
    console.log(data);
    return sha1(data.values().join("|"));
}

function generate_fondy_url(req, order_id) {
    
    let signature = fondy_signature(order_id);
    let url = "https://pay.fondy.eu/api/checkout/redirect";
    for (k in fondy_data.keys()) {
        url += `${k}=${fondy_data[k]}&`;
    }
    url += `signature=${signature}&`;
    url += `merchant_data=${order_data}`;
    url = encodeURI(url);
}

// WAYFORPAY payments

function generate_wfp_signature(data) {
    var hmac = forge.hmac.create();
    hmac.start('md5', WFP_TOKEN);

    const sorted = Object.keys(obj).sort();
    let first = true;
    for(let k of sorted) {
        if (!first) {
            hmac.update(';');
        } else {
            first = false;
        }
        hmac.update(data[k]);
    }
    
    return hmac.digest().toHex();
}


//
// ROUTES
//

app.get('/', function(req, res) {
    res.render('index');
})

app.get('/image', function(req, res){

    let rows = 20; 
    let cols = 20;

    let width = `${Math.floor(100.0/cols)}%`;

    let data = { title: 'Markdown Example' };
    data.rows = [];

    let imgs = {};
    for (let i = 0; i < rows; i++) {
        let row = [];
        for (let j = 0; j < cols; j++) {
            let tile_id = `tile_${i}_${j}`;
            row.push({image_id: tile_id});
            let bought = Math.random() > 0.8;
            imgs[tile_id] = {
                bought: bought,
                owner: bought ? "mkrooted" : ""
            }
        }
        data.rows.push({cols: row});
    }

    data.image_data = JSON.stringify(imgs);
    data.image_width = width;

    res.render('image', data);
});


app.get('/checkout', function(req, res) {
    console.log('checkout: ', req.body);

    let order_data = req.query.order_data;
    let Ntiles = req.query.ntiles;
    let money = req.query.money;
    let new_order_id = next_order_id();

    let wfp_data = {
        merchantAccount: "pieceofpixel_store",
        merchantDomainName: DOMAIN,
        merchantTransactionType: "SALE",
        language: "AUTO",
        returnUrl: `https://${DOMAIN}/thankyou`,
        serviceUrl: `https://${DOMAIN}/wfp`,
        orderReference: `A${new_order_id}`,
        orderDate: Date.now(),
        amount: `${money}.00`,
        currency: "UAH",
        "productName[]": "Pile of pixels",
        "productPrice[]": `${TILE_PRICE}.00`,
        "productCount[]": Ntiles,
    }
    wfp_data.merchantSignature = generate_wfp_signature(wfp_data);
    
    const response = await fetch('https://secure.wayforpay.com/pay?behavior=offline', {
        method: 'post',
        body: JSON.stringify(wfp_data),
        headers: {'Content-Type': 'application/json'}
    });
    const wfp_response_data = await response.json();
    
    if (wfp_response_data.url) {
        res.redirect(wfp_response_data.url);
    } else {
        res.render('playmentfailed');
    }
});

app.get('/thankyou', function(req,res) {
    console.log("payment successful: ", req.body);
    res.render('thankyou');
})
app.get('/paymentfailed', function(req,res) {
    console.log("payment failed: ", req.body);
    res.render('paymentfailed');
})

// FONDY BEGIN

app.all('/fondy', function(req,res) {
    console.log("FONDY: ", req.body);
    res.sendStatus(200);
});

// FONDY END

PORT = process.env.PORT || 3000
app.listen(PORT);
console.log(`Express started on port ${PORT}`);
