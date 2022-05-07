const escapeHtml = require('escape-html');const express = require('Express');
const fs = require('fs');
const marked = require('marked');
const path = require('path');

const app = express();
const mustacheExpress = require('mustache-express');

//
// express config
//

app.use(express.static('static'));

app.engine('m', mustacheExpress());
app.set('view engine', 'm');

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

    for (let i = 0; i < rows; i++) {
        let row = [];
        for (let j = 0; j < cols; j++) {
            row.push({image_id: `tile_${i}_${j}`});
        }
        data.rows.push({cols: row});
    }

    let imgs = [
        {id:1, owner: 0},
        {id:2, owner: 0},
        {id:3, owner: 1},
    ]
    data.image_data = JSON.stringify(imgs);
    data.image_width = width;

    res.render('image', data);
});


app.listen(3000);
console.log('Express started on port 3000');
