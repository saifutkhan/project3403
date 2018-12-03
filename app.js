const express = require('express');
const cors = require('cors');
const mongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser'); //read form data and form fields
const methodOverride = require('method-override'); //to support PUT and DELETE FROM browssers

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(methodOverride('_method'));

//const mongoServerURL = "mongodb://localhost:27017";
const mongoServerURL = "mongodb://user1:hctuser1@ds151523.mlab.com:51523/itemdb";

//default route / - display all items
app.get('/', (request, response, next) => {
	mongoClient.connect(mongoServerURL, (err, db) => {
		if (err)
			console.log("Cannot connect to Mongo:"+err.message);

		//connect to item
		const itemdb = db.db("itemdb");

		//read from itemdb items collection
		itemdb.collection("items").find({}).toArray((err, itemsArray) => {
			if (err)
				console.log(err.message);

			response.send(JSON.stringify(itemsArray));
		});

		//close the connection to the db
		db.close();
	});

});

//get one item by name - used in update and delete web pages
app.get('/items/:itemName', (request, response, next) => {

	const itemName = request.params.itemName;

	mongoClient.connect(mongoServerURL, (err, db) => {
		if (err)
			console.log("Cannot connect to Mongo:"+err.message);

		//connect to item
		const itemdb = db.db("itemdb");

		console.log(itemName);
		//build the query filter
		let query = {item_name:itemName};

		//read from itemdb items collection
		itemdb.collection("items").find(query).toArray((err, itemsArray) => {
			if (err)
				console.log(err.message);

			response.send(JSON.stringify(itemsArray));
		});

		//close the connection to the db
		db.close();
	});

});

//example of hardcoded route
app.get('/sensors', (request, response, next) => {
	mongoClient.connect(mongoServerURL, (err, db) => {
		if (err)
			console.log("Cannot connect to Mongo:"+err.message);

		//connect to item
		const itemdb = db.db("itemdb");

		//read from itemdb items collection
		itemdb.collection("items").find({category:"sensors"}).toArray((err, itemsArray) => {
			if (err)
				console.log(err.message);

			response.send(JSON.stringify(itemsArray));
		});

		//close the connection to the db
		db.close();
	});
});

//example to used to handle many routes using request parameter
//here the request parameter is :category
app.get('/:category', (request, response, next) => {
	mongoClient.connect(mongoServerURL, (err, db) => {
		if (err)
			console.log("Cannot connect to Mongo:"+err.message);

		//connect to item
		const itemdb = db.db("itemdb");
		let categoryValue = request.params.category;
		if (categoryValue == "robots")
			categoryValue = "robot";
		else if (categoryValue == "micros")
			categoryValue = "microcontroller";
		console.log(categoryValue);
		//build the query filter
		let query = {category:categoryValue};

		//read from itemdb items collection
		itemdb.collection("items").find(query).toArray((err, itemsArray) => {
			if (err)
				console.log(err.message);

			response.send(JSON.stringify(itemsArray));
		});

		//close the connection to the db
		db.close();
	});
});

//add a new item - using HTTP POST method
app.post('/items', (request, response, next) => {
	//access the form fields by the same names as in the HTML form
	const itemId = request.body.itemId;
	console.log(itemId);
	const itemName = request.body.itemName;
	const itemCategory = request.body.category;
	const itemDescription = request.body.description;
	let itemPrice = request.body.price;
	//convert price to number
	itemPrice = parseFloat(itemPrice);

	mongoClient.connect(mongoServerURL, (err, db) => {
		if (err)
			console.log("Cannot connect to Mongo:"+err.message);

		//connect to itemdb
		const itemdb = db.db("itemdb");
		
		const newItem = {item_id:itemId, item_name:itemName, category:itemCategory, description:itemDescription,
						price:itemPrice};
		//insert to itemdb items collection
		itemdb.collection("items").insertOne(newItem, (err, result) => {
			if (err) {
				console.log(err.message);
			}

			if (result.insertedCount == 1) {
				//one way - return response - let client handle it
				//response.end("Item " + itemName + " added successfully!");
				
				//another way - redirect to the all items page - showing item added
				response.redirect("/static/index.html");
			}
			else
				response.end("Item " + itemName + " could not be added!!");

			//response.send(JSON.stringify(newItem));
		});

		//close the connection to the db
		db.close();
	});	
});

//update item - uisng HTTP PUT method
app.put('/items', (request, response, next) => {
	console.log("in PUT");
	const itemName = request.param('itemName');
	const itemCategory = request.param('category');
	const itemDescription = request.param('description');
	let itemPrice = request.param('price');
	//convert price to number
	itemPrice = parseFloat(itemPrice);

	mongoClient.connect(mongoServerURL, (err, db) => {
		if (err)
			console.log("Cannot connect to Mongo:"+err.message);

		//connect to item
		const itemdb = db.db("itemdb");
		
		//we are updating by the item_name
		const updateFilter = {item_name:itemName};
		const updateValues = {$set:{category:itemCategory, description:itemDescription,
						price:itemPrice}};
		//insert from itemdb items collection
		itemdb.collection("items").updateOne(updateFilter, updateValues, (err, res) => {
			if (err) {
				console.log(err.message);
			}

			//console.log("matchcount " + res.matchedCount);
			//console.log("updatecount:" + res.modifiedCount);

			//one way 
			//const responseJSON = {updateCount:res.result.nModified};
			//response.send(JSON.stringify(responseJSON));

			//another way - redirect to all items page
			response.redirect("/static/index.html");
		});

		//close the connection to the db
		db.close();
	});	
});

//delete item by item name
app.delete('/items', (request, response, next) => {
	const itemName = request.param('itemName');

	mongoClient.connect(mongoServerURL, (err, db) => {
		if (err)
			console.log("Cannot connect to Mongo:"+err.message);

		//connect to item
		const itemdb = db.db("itemdb");
		
		//we are deleting by the item_name
		const deleteFilter = {item_name:itemName};

		//insert from itemdb items collection
		itemdb.collection("items").deleteOne(deleteFilter, (err, res) => {
			if (err) {
				console.log(err.message);
			}

			//const responseJSON = {deleteCount:res.result.n}; //n - how many docs deleted
			//response.send(JSON.stringify(responseJSON));

			if (res.deletedCount > 0) {
				response.redirect("/static/index.html");
			}
			else {
				response.send("<script>alert(\"deleted \" +itemName);</script>");
			}
		});

		//close the connection to the db
		db.close();
	});	
});


//set the route for static HTML files to /static
//actual folder containing HTML files will be public
app.use('/static', express.static('public'));

//start the web server
const port = process.env.PORT;
app.listen(port, ()=> {
	console.log("server listening on "+port);
});

