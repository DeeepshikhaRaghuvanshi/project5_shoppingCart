const cartModel = require("../model/cartModel");
const userModel = require("../model/userModel");
const productModel = require("../model/productModel");
const Validator = require("../validation/validation");

//------------------------------------------------create cart----------------------------------------------------------------
const createCart = async function (req, res) {
  try {
    const userId = req.params.userId;

    const data = req.body;
    if (!Validator.isValidBody(data)) {
      return res.status(400).send({
        status: false,
        message: "Product data is required for cart",
      });
    }

    const { productId, cartId } = data;
    if (!Validator.isValidObjectId(productId)) {
      return res
        .status(400)
        .send({ status: false, message: " Enter a valid productId" });
    }

    let productData = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!productData) {
      return res
        .status(400)
        .send({ status: false, message: "Product doesn't exist" });
    }

    if (cartId) {
      if (!Validator.isValidObjectId(cartId)) {
        return res
          .status(400)
          .send({ status: false, message: " Enter a valid cartId" });
      }

      let cart = await cartModel.findOne({ _id: cartId });
      if (!cart)
        return res
          .status(400)
          .send({ status: false, message: "cart does not exist with this id" });

      let cartData = await cartModel.findOne({ userId: userId });

      if (cartId !== cartData._id.toString()) {
        return res
          .status(400)
          .send({ status: false, message: "This cartId is not for this user" });
      }

      let arr = cartData.items;
      let product1 = {
        productId: productId,
        quantity: 1,
      };
      compareId = arr.findIndex((obj) => obj.productId == productId);

      if (compareId == -1) {
        arr.push(product1);
      } else {
        arr[compareId].quantity += 1;
        console.log(arr.length)
        cartData.totalItems = arr.length;
        cartData.totalPrice = 0;
        for (let i = 0; i < arr.length; i++) {
          let product = await productModel.findOne({ _id: arr[i].productId });
          cartData.totalPrice += arr[i].quantity * product.price;
        }
      }
      await cartData.save();

      return res.status(201).send({
        status: true,
        message: "product added to the cart successfully",
        data: cartData,
      });
    } else {
      let cartData = await cartModel.findOne({ userId: userId });

      if (cartData) {
        let arr = cartData.items;
        let product1 = {
          productId: productId,
          quantity: 1,
        };
        compareId = arr.findIndex((obj) => obj.productId == productId);
        console.log(compareId);
        if (compareId == -1) {
          arr.push(product1);
        } else {
          arr[compareId].quantity += 1;
        }
        cartData.totalItems = arr.length;
        cartData.totalPrice = 0;
        for (let i = 0; i < arr.length; i++) {
          let product = await productModel.findOne({ _id: arr[i].productId });
          cartData.totalPrice += arr[i].quantity * product.price;
        }
        await cartData.save();

        return res.status(200).send({
          status: true,
          message: "product added to the cart successfully",
          data: cartData,
        });
      } else {
        let items = [];
        let product1 = {
          productId: productId,
          quantity: 1,
        };
        items.push(product1);
        let product = await productModel.findOne({ _id: productId });
        let cartBody = {
          userId: userId,
          items: items,
          totalPrice: product.price,
          totalItems: 1,
        };

        let cartSavedData = await cartModel.create(cartBody);
        console.log(cartSavedData);
        return res.status(201).send({
          status: true,
          message: "Cart created successfully",
          data: cartSavedData,
        });
      }

      //     //nhi hai  create kro
    }
  } catch (err) {
    return res.status(500).send({ status: false, error: err.message });
  }
};

//------------------------------------------------------------update cart----------------------------------------------------------

const updateCart = async function (req, res) {
  try {
    let userId = req.params.userId;

    let { cartId, productId, removeProduct } = req.body;

    if (!productId)
      return res
        .status(400)
        .send({ status: false, message: " Please provide productId" });

    if (!Validator.isValidObjectId(productId)) {
      return res
        .status(400)
        .send({ status: false, message: " Enter a valid productId" });
    }

    let product = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    });
    if (!product)
      return res
        .status(400)
        .send({ status: false, msg: "Product does not exist" });

    let cart = await cartModel.findOne({ userId: userId });
    if (!cart)
      return res
        .status(400)
        .send({ status: false, msg: "cart does not exist" });

    if (!removeProduct)
      return res
        .status(400)
        .send({
          status: false,
          message: " Please enter removeProduct details",
        });

    if (cartId) {
      if (!Validator.isValidObjectId(cartId)) {
        return res
          .status(400)
          .send({ status: false, message: " Enter a valid cartId" });
      }
      if (cartId !== cart._id.toString())
        return res
          .status(400)
          .send({
            status: false,
            msg: "This cart does not belong to the user",
          });
    }

    let arr = cart.items;
    compareId = arr.findIndex((obj) => obj.productId == productId);
    if (compareId == -1) {
      return res
        .status(400)
        .send({
          status: false,
          msg: "The product is not available in this cart",
        });
    }
    let quantity1 = arr[compareId].quantity;
    if (removeProduct == 0) {
      arr.splice(compareId - 1, 1);
      cart.totalItems =arr.length
      cart.totalPrice -= product.price * quantity1;
      await cart.save();
      return res.status(200).send({ status: true, data: cart });
    } else if (removeProduct == 1) {
      if (arr[compareId].quantity == 1) {
        arr.splice(compareId - 1, 1);
        cart.totalItems = arr.length;
        cart.totalPrice -= product.price;
        await cart.save();
        return res.status(200).send({ status: true, data: cart });
      } else if (arr[compareId].quantity > 1) arr[compareId].quantity -= 1;
      cart.totalItems = arr.length;
      cart.totalPrice -= product.price;
      await cart.save();
      return res.status(200).send({ status: true, data: cart });
    }
  } catch (err) {
    return res.status(500).send({ status: false, error: err.message });
  }
};

//--------------------------------------------------------get cart-------------------------------------------------------------------

const getCart = async function (req, res) {
  try {
    let userId = req.params.userId;

    let cartDetails = await cartModel
      .findOne({ userId: userId })
      .populate("items.productId");

    if (!cartDetails)
      return res.status(404).send({ status: false, message: "Cart not found" });

    return res
      .status(200)
      .send({
        status: true,
        message: "Cart details with Product details",
        data: cartDetails,
      });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

//----------------------------------------------------delete cart-----------------------------------------------------------

const delCart = async (req, res) => {
  try {
    let userId = req.params.userId;

    let deleteCart = await cartModel.findOneAndUpdate(
      { userId: userId },
      { items: [], totalPrice: 0, totalItems: 0 },
      { new: true }
    );
    return deleteCart
      ? res.status(204).send({
          status: false,
          message: "Cart Successfully Deleted",
          data: deleteCart,
        })
      : res
          .status(404)
          .send({
            status: false,
            message: "There is no cart under this user id",
          });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

module.exports = { createCart, getCart, updateCart, delCart };