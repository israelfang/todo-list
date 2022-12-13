// TodoList App -> Web with EJS; Node.js with Express module; cloud MongoDB server (Atlas) with Mongoose driver

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
// preparing for strictQuery deprecation
mongoose.set('strictQuery', false);
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Connect to local mongoDB server
/* mongoose.connect("mongodb://127.0.0.1:27017/todolistDB").then(() => {
  console.log('DB connection successfully');
}).catch(err => console.log(err)); */

// Connect to cloud mongoDB server
mongoose.connect("mongodb+srv://admin-israel:bolovo123@cluster0.torzkqg.mongodb.net/todolistDB").then(() => {
  console.log('DB connection successfully');
}).catch(err => console.log(err));

// Schema for collection model
const itemsSchema = {
  name: String
};

// Creates (if there isnt one) a collection (the equivalent of a table in relational DB's) inside current DB (todolistDB).
// The collection will be renamed to "items" by MongoDB.
// Returns the collection model for creating new objects.
const Item = mongoose.model("Item", itemsSchema);

// Creates a document.
// .save() to insert into database
const item1 = new Item({
  name: "Welcome to your todo list!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {

  Item.find(function (err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) { // Insert objects in the items collection
        if (err) console.log(err);
        else console.log("Inserted default items succesfully.");
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });

});

// Dynamic routing
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName); 

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {

        // Create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save().then(function () {
          res.redirect("/" + customListName);
        });

      } else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    }
  })
});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  // creating document
  const item = new Item({
    name: itemName
  });


  if (listName === "Today") {
    // saving item to db
    item.save().then(function() {
      res.redirect("/");
    });

    
  } else {
    List.findOne({name: listName}, function(err, foundList) {

      foundList.items.push(item)

      foundList.save().then(function() {
        res.redirect("/" + listName);
      });
    });
  }
});

app.post("/delete", function (req, res) {

  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemID, function (err) {
      if (err) console.log(err)
      else res.redirect("/")
    })
  } else {
    // Finds a document (listName) from List collection and then removes ($pull syntax from mongoDB) an object with specified _id (checkedItemID) from items array
    List.findOneAndUpdate({name: listName}, { $pull: {items: {_id: checkedItemID}}}, function(err, foundList) {
      if (!err) res.redirect("/" + listName)
    });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
