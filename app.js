const express = require('express');
const app = express();
const Crawler = require('./src/Crawler.js');
const crawler = new Crawler();
// let loadItems = require('./javascripts/items.js'); //Load the items module

app.set('view engine', 'ejs');

app.get('/', (req,res)=>{

        // var items = itemFuncs.loadItems
        var items = crawler.getList(100);

        //add results list to template);
        res.render('index', {title: "GW2 Flip Finder!", items});
});

app.get('/about', (req,res)=>{
    res.render('about');
});

app.use(express.static('public'));

app.listen(3000,()=>{
    console.log('Server started on port 3000.');
    
});