const orderModel = require("../model/orderModel")
const cartModel = require("../model/cartModel")
const Validator = require("../validation/validation")


const orderCreate = async function (req, res) {
    try {
        let user_id = req.params.userId
        let data = req.body
        if (!Validator.isValidBody(data)) {
            return res.status(400).send({
              status: false,
              message: "Cart data is required for order",
            });
          }
        let cartId = data.cartId
        if (!Validator.isValidInputValue(cartId)) {
            return res
              .status(400)
              .send({ status: false, message: " CartId is required" });
          }
          if (!Validator.isValidObjectId(cartId)) {
            return res
              .status(400)
              .send({ status: false, message: " Enter a valid cartId" });
          }
        let cartData = await cartModel.findOne({ _id: cartId, userId: user_id }).select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0 })
        if (!cartData) {
            return res.status(400).send({ status: false, message: "NO cart exist for this user" })
        }
        // console.log(cartData.items.length)
        if (cartData.items.length === 0) {
            return res.status(400).send({ status: false, message: "Your cart is empty" })
        }

        let cartDetails = JSON.parse(JSON.stringify(cartData))
        //console.log(cartData)
        // let cartDetails = req.body

        let itemsArr = cartDetails.items
        let totalQuantity = 0
        for (let i = 0; i < itemsArr.length; i++) {
            totalQuantity += itemsArr[i].quantity
        }
        cartDetails.totalQuantity = totalQuantity
        if (data.status) {
            if (data.status != "pending" && data.status != "completed" && data.status != "cancelled") {
                return res.status(400).send({ status: false, message: "status should be-'pending','completed','cancelled'" })
            }
            cartDetails.status = data.status
        }
        if(data.cancellable === false){
            cartDetails.cancellable = data.cancellable
        }
        let orderDetails = await orderModel.create(cartDetails)
        await cartModel.findOneAndUpdate({ userId: user_id }, { items: [], totalPrice: 0, totalItems: 0 })
        return res.status(201).send({ status: true, message: "order created successfully", data: orderDetails })

    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}


//--------------------------------------------put order--------------------------------------------------------------

const orderUpdate = async function(req,res){
    try{
        const userIdFromParams = req.params.userId;
        const requestBody = req.body;

        if (!Validator.isValidBody(requestBody)) {
            return res
                .status(400)
                .send({ status: false, message: "Order data is required " });
        }
        const { orderId, status } = requestBody;

        if (!Validator.isValidObjectId(orderId)) {
            return res
                .status(400)
                .send({ status: false, message: "invalid orderId " });
        }

        const orderDetailsByOrderId = await orderModel.findOne({
            _id: orderId,
            isDeleted: false
        });

        if (!orderDetailsByOrderId) {
            return res
                .status(404)
                .send({ status: false, message: `no order found by ${orderId} ` });
        }

        if (!["pending", "completed", "cancelled"].includes(status)) {
            return res.status(400).send({
                status: false,
                message: "status should be from [pending, completed, cancelled]",
            });
        }

        if (orderDetailsByOrderId.status === "completed") {
            return res.status(400).send({
                status: false,
                message: "Order completed, now its status can not be updated",
            });
        }

        if (status === "cancelled" && orderDetailsByOrderId.cancellable === false) {
            return res
                .status(400)
                .send({ status: false, message: "This order can not be cancelled" });
        }

        if (status === "pending") {
            return res
                .status(400)
                .send({ status: false, message: "order status is already pending" });
        }

        const updateStatus = await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { status: status } }, { new: true });

        res.status(200).send({
            status: true,
            message: "order status updated",
            data: updateStatus,
        });

    }
    catch(err){
        return res.status(500).send({status : false , error : err.message})
    }
}

module.exports = { orderCreate, orderUpdate }