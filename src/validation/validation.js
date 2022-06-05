const passwordValidator = require("password-validator");
const mongoose = require('mongoose')
const ObjectId=require("mongoose").Types.ObjectId

/* --------------------blank body---------------------------------------------------------- */
function isValidBody(data) {
  if (Object.keys(data).length == 0)
    return false
  else return true
}

/* ----------------------------------type/input value--------------------------------------- */
const isValidInputValue = function (data) {
  if (typeof (data) === 'undefined' || data === null) return false
  if (typeof (data) === 'string' && data.trim().length > 0) return true
  if (typeof (data) === 'object'|| Object.values(data) > 0 ) return true
  return false
}

/* ---------------------------------------ObjectId format-------------------------------------- */

const isValidObjectId = function (data) {
  let stringId = data.toString().toLowerCase();
  if (!ObjectId.isValid(stringId)) {
      return false;
  }

  var result = new ObjectId(stringId);
  if (result.toString() != stringId) {
      return false;
  }
  return true;
}

/* ------------------------------------string only------------------------------------------- */
const isValidOnlyCharacters = function (data) {
  return /^[A-Za-z ]+$/.test(data)
}

/* --------------------------------------email format---------------------------------------- */
function isValidEmail(data) {
  if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data))
    return false
  else return true
}

/* ----------------------------------------phone format-------------------------------------- */
function isValidPhone(data) {
  if (/^[6-9][0-9]{9}$/.test(data))
    return true
  else return false
}

/* ------------------------------------------password format--------------------------------- */
function isValidPassword(data) {
  const schema = new passwordValidator();
  schema.is().min(8).max(15).digits(1);
  if (!schema.validate(data))
    return false
  else return true
}

/* --------------------------------------file should be image---------------------------------- */

const isValidImageType = function (data) {
  const reg = /image\/png|image\/jpeg|image\/jpg/;
  return reg.test(data)
}

/* -----------------------------------Blank Address---------------------------------------- */
const isValidAddress = function (data) {
  if (typeof (data) === "undefined" ||data === null) return false;
  if (typeof (data) === "object" && Array.isArray(data) === false && Object.keys(data).length > 0) return true;
  return false;
};

/* ---------------------------------------pincode format------------------------------------------- */
const isValidPincode = function(data){
  if ((/^[1-9][0-9]{5}$/.test(data))) {
    return true
  }
  return false
}

/* -------------------------------------price format----------------------------------------------- */
const isValidPrice = function(data){
  if ((/^[1-9][0-9]{2,5}\.[0-9]{2}|^[1-9][0-9]{2,5}$/).test(data)) {
return true
  }
  return false
}


module.exports = { isValidBody, isValidInputValue, isValidObjectId, isValidImageType, isValidOnlyCharacters, isValidEmail, isValidPhone, isValidPassword, isValidAddress,isValidPincode, isValidPrice }