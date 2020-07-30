const fs = require('fs');
const gw2 = require('./api/gw2');

class Crawler{
    //TODO;
    //Add an update lists function to check when the list was last updated and get the new data.
    
    constructor(itemList = [], filepath = './data/items.json'){
        
        this.filepath = filepath;
        ///Do i really need these lists as class variables?
        this.idList = [];
        this.itemList = itemList;
        this.priceList = [];
        ///---
        this.loadedList = [];
    
        console.log('Checking for cached data...')
        if(this.dataExists() === true){
            console.log('Exists!');
            this.loadedList = require("."+filepath);
        }else{
            console.log('Not there.');
            this.fetchAllData();
        }
         
    }

    //To check if an items.json file already exists.
    dataExists = function(){
        console.log(fs.existsSync(this.filepath));
        return fs.existsSync(this.filepath);
    }

    fetchAllData = async function(){
        await this.fetchItemIds();
        await this.fetchItemData();
        await this.fetchItemPrices()
        let completeList = this.combineLists();
        await this.saveList(completeList)
        .then(()=>{
            this.loadedList = require("."+this.filepath);
        }).catch((err)=>{
            console.log(err.message);
        });
        
    };

    //Write a given list to file.
    saveList = async function(list){
        let writepath = this.filepath;
        await fs.writeFile (writepath, JSON.stringify(list), function(err) {
            if (err) throw err;
            console.log('File written successfully!');
            }
        );
    };

    combineLists = function(){
        //take the itemData list and itemPrices list and aggregate them into a single list by key=id.
        let mergedArr = this.itemList.map(item => ({
            ...item,
            ...this.priceList.find(({ id }) => id === item.id),
        }));
        return mergedArr;
    }

    updatePrices = async function(){
        //fetch all item prices and update each price where different in the aggregated list.
        await this.fetchItemPrices();
    }

    //Fetch all trading post items from gw2 api, assign the list to this.idList
    fetchItemIds = async function(){
        await gw2.get('/commerce/prices') 
        .then((res) => {
            this.idList = res.data;
            console.log('Item ids collected successfully!')
            //return response.data;
            //this.fetchItemData();
        }).catch(function (error) {
            console.log(error);
        });
    }

    //Using ids obtained from fetchItemIds, fetch specific item data from gw2 api in chunks of 200 items at a time (limit).
    fetchItemData = async function(){
        let idChunk = [];
        let count = 0;
        for(var id in this.idList){
            if(idChunk.length < 200){
                idChunk.push(this.idList[id]);
            }else{
                let idChunkString = idChunk.toString();
                idChunkString = idChunkString.replace("[","");
                idChunkString = idChunkString.replace("]","");
                idChunkString = idChunkString.replace(" ","");
                await gw2.get("/items?ids="+idChunkString)
                .then((response) => {
                    this.itemList = this.itemList.concat(response.data);
                    //newItems.push(response.data);
                    count += 200;
                    console.log("Retrieved "+count+" items, "+(this.idList.length - count)+" more to go...");
                    idChunk = [];
                })
                .catch(function (error) {
                    console.log(error);
                });                       
            };
        }  
        console.log("Data crawl completed successfully, ...");   
    }           
    
    //Using ids obtained from fetchItemIds, fetch item prices from the gw2 api in chunks of 200 items at a time (limit).
    fetchItemPrices = async function(){
        let idChunk = [];
        let count = 0;
        for(var id in this.idList){
            if(idChunk.length < 200){
                idChunk.push(this.idList[id]);
            }else{
                let idChunkString = idChunk.toString();
                idChunkString = idChunkString.replace("[","");
                idChunkString = idChunkString.replace("]","");
                idChunkString = idChunkString.replace(" ","");
                await gw2.get("/commerce/prices?ids="+idChunkString)
                .then((presponse) => {
                    this.priceList = this.priceList.concat(presponse.data);
                    //newItems.push(response.data);
                    count += 200;
                    console.log("Retrieved "+count+" items, "+(this.idList.length - count)+" more to go...");
                    idChunk = [];
                })
                .catch(function (error) {
                    console.log(error);
                });                       
            };
        }  
        console.log("Price crawl completed successfully.");   
    }     
    
    //-- Displaying data
    getList(limit=50){
        let items = this.loadedList;
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

};

module.exports = Crawler;



