//let items = require('../data/items.json');
const Crawler = require('../src/Crawler.js');
let items = new Crawler().getList();

// let loadItems = (limit=50) => {
  function loadItems(limit=50){
    //Calculate item margins and add to array as value
    var margin_array = items.map(function(el) {
        let m = el.sells.unit_price - el.buys.unit_price
        //deduct 15% tp fee
        let margin = Math.floor(m-m*0.15);
        var o = Object.assign({}, el);
        o.margin = margin;
        return o;
      })
    
      //Function to sort array by margin desc
      function compareMargin(a, b) {
        // Use toUpperCase() to ignore character casing
        
        const marginA = a.margin;
        const marginB = b.margin;
      
        let comparison = 0;
        if (marginA > marginB) {
          comparison = 1;
        } else if (marginA < marginB) {
          comparison = -1;
        }
        return comparison *-1;
      }
      //Sort items array by margins
      items = margin_array.sort(compareMargin);
      //filter out bad items
      var filteredItems = items.filter(function(el){
          return el.sells.quantity >= 500 && el.buys.quantity >= 500;
      });
      
      return filteredItems.slice(0,limit);
}

module.exports = loadItems();

