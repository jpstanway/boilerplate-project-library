/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;
//Example connection: MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  app.route('/api/books')
    .get(function (req, res){
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, db) => {
        if (err) res.send('Failed to connect to database');

        db.collection('library').find().toArray().then((data) => {
          res.json(data);
          db.close();
        });
      });
    })
    
    .post(function (req, res){
      expect(req.body).to.be.an('object');
      
      var title = req.body.title;

      if (!title) {
        // send error message if no title given
        res.json('no title given');
      } else {
        //response will contain new book object including atleast _id and title
        MongoClient.connect(MONGODB_CONNECTION_STRING, (err, db) => {
          if (err) res.send('Failed to connect to database');

          db.collection('library').findOne({title: title}, (err, data) => {

            if (err) {
              res.send('Failed to search database for similar book');
            } else if (data) {
              res.json([data]);
            } else {
               // if no book exists insert new one
              db.collection('library').insert({
                _id: ObjectId(),
                title: title,
                commentcount: []
              }, (err, data) => {
                if (err) res.send('Failed to add to database');

                res.json(data.ops);
                db.close();
              });
            }
            
          });
        });
      }
    })
    
    .delete(function(req, res){
      //if successful response will be 'complete delete successful'
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, db) => {
        if (err) res.send('Failed to connect to database');

        db.collection('library').deleteMany({}, (err, data) => {
          if (err) res.send('Failed to delete all books');
          
          res.json('complete delete successful');
          db.close();
        });
      });
    });

  // check :id is a hexadecimal
  function hexTest(str) {
    const hex = /[0-9A-Fa-f]{6}/g;
    return hex.test(str);
  }

  app.route('/api/books/:id')
    .get(function (req, res){
      var bookid = req.params.id;

      // make sure id is in proper format
      if (bookid.length < 24 || !hexTest(bookid)) {
        res.json('no book exists');
      } else {
        //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
        MongoClient.connect(MONGODB_CONNECTION_STRING, (err, db) => {
          if (err) res.send('Failed to connect to database');

          db.collection('library').findOne({_id: ObjectId(bookid)}, (err, data) => {
            
            if (err) {
              res.json('Error finding book');
            } else if (data) {
              res.json(data);
            } else {
              res.json('no book exists');
            }

            db.close();
          });
        });
      }

    })
    
    .post(function(req, res){
      expect(req.params).to.be.an('object');
      expect(req.body).to.be.an('object');

      var bookid = req.params.id;
      var comment = req.body.comment;

      //json res format same as .get
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, db) => {
        if (err) res.send('Failed to connect to database');

        db.collection('library').findAndModify(
          { _id: ObjectId(bookid) },
          {},
          { $addToSet: { commentcount: comment }}, 
          { new: true },
          (err, data) => {
            if (err) res.send('Failed to insert comment');

            res.json(data.value);
            db.close();
        });
      });
    })
    
    .delete(function(req, res){
      var bookid = req.params.id;
      //if successful response will be 'delete successful'
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, db) => {
        if (err) res.send('Failed to connect to database');

        db.collection('library').findOneAndDelete({_id: ObjectId(bookid)}, (err, data) => {
          if (err) res.send('Failed to delete from database');

          res.json('delete successful');
          db.close();
        });
      });
    });
  
};
