const jwt = require('jsonwebtoken')
const userModel = require('../model/userModel')
const Validator = require("../validation/validation");

const authentication = async function (req, res, next) {
  try {
    let token = req.headers["authorization"];

    if (!token)
      return res.status(403).send({ status: false, msg: "Token is required" });

    let token1 = token.split(" ").pop()


    jwt.verify(token1, "group-5-productManangement", { ignoreExpiration: true, }, function (err, decoded) {
      if (err) { return res.status(400).send({ status: false, meessage: "token invalid" }) }
      else {
        if (Date.now() > decoded.exp * 1000) {
          return res.status(401).send({ status: false, msg: "Session Expired", });
        }
       
        req.userId = decoded.userId;
        next();
      }
    });
  }
  catch (err) {
    return res.status(500).send({ err: err.message })
  }
}

const authorization = async function (req , res , next){
  try{
   
    let userId = req.userId
    let userIdfromParam = req.params.userId
    if (!Validator.isValidObjectId(userIdfromParam)) {
      return res
        .status(400)
        .send({ status: false, message: " Enter a valid userId" });
    }

    const userByUserId = await userModel.findById(userIdfromParam)

    if (!userByUserId) {
      return res.status(404).send({ status: false, message: " User not found" })
  }

    if(userId!=userIdfromParam)
    return res.status(403).send({ status: false, message: "Unauthorized access" })

    next()
  }
  catch(err){
    return res.status(500).send({ err: err.message })
  }
  }

module.exports = {authentication , authorization}