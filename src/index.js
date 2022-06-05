const express = require('express')
const app = express()
//const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const route = require('./route/route')
const multer= require("multer");


app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use( multer().any())

mongoose.connect("mongodb+srv://Swetarun:lBf6gTedHw2tfPtQ@cluster0.ebg8a.mongodb.net/group5Database", {
    useNewUrlParser: true
})
.then( () => console.log("MongoDb is connected"))
.catch( err => console.log(err))

app.use('/', route)

app.all('*', function(req,res){
    throw new Error("Bad Request")
})

app.use(function(e,req,res,next){
    if(e.message=="Bad Request")
    return res.status(400).send({error : e.message})
})

app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});