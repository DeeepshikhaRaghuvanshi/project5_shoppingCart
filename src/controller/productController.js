const productModel = require("../model/productModel");
const { uploadFile } = require("../aws/aws");
const Validator = require("../validation/validation");

//-----------------------------POST/product--------------------------------------
const createProduct = async function (req, res) {
  try {
  let data = req.body;
  let files = req.files;
  let {
    title,
    description,
    price,
    currencyId,
    currencyFormat,
    availableSizes,
  } = data;

  if (!Validator.isValidBody(data)) {
    return res.status(400).send({
      status: false,
      message: "Product data is required for registration",
    });
  }

  if (!files || files.length == 0) {
    return res
      .status(400)
      .send({ status: false, message: "No profile image found" });
  }

  if (!Validator.isValidImageType(files[0].mimetype)) {
    return res.status(400).send({
      status: false,
      message: "Only images can be uploaded (jpeg/jpg/png)",
    });
  }

  let fileUrl = await uploadFile(files[0]);
  data.productImage = fileUrl;

  let bodyArr = {
    title,
    description,
    price,
    currencyId,
    currencyFormat,
    availableSizes,
  };
  for (let key in bodyArr) {
    if (!Validator.isValidInputValue(bodyArr[key])) {
      return res.status(400).send({
        status: false,
        message: `Field ${key} required for registration`,
      });
    }
  }

  let uniqueTitle = await productModel
    .findOne({ title: title })
    .collation({ locale: "en", strength: 2 });
  if (uniqueTitle) {
    return res.status(400).send({
      status: false,
      message: "Title already present",
    });
  }

  if (!Validator.isValidPrice(price)) {
    return res.status(400).send({
      status: false,
      message:
        "Price should be minimum 3-5 digits and for decimal value- after decimal please take 2 digits",
    });
  }

  if (currencyId != "INR") {
    return res.status(400).send({
      status: false,
      message: "CurrencyId should be INR",
    });
  }

  if (currencyFormat != "₹") {
    return res.status(400).send({
      status: false,
      message: "CurrencyFormat should be ₹ ",
    });
  }

  let enumSize = ["S", "XS", "M", "X", "L", "XXL", "XL"];
  for (let i = 0; i < availableSizes.length; i++) {
    if (!enumSize.includes(availableSizes[i])) {
      return res.status(400).send({
        status: false,
        message: "availableSizes should be-[S, XS,M,X, L,XXL, XL]",
      });
    }
  }

  let savedData = await productModel.create(data);

  return res.status(201).send({
    status: true,
    message: "product created successfully",
    data: savedData,
  });
  } catch (err) {
    return res.status(500).send({ status: false, error: err.message });
  }
};

const getProduct = async function (req, res) {
  try {
    let filter = req.query;
    let query = { isDeleted: false };
    if (filter) {
      const { name, description, isFreeShipping, style, size, installments } =
        filter;

      let nameIncludes = new RegExp(`${filter.name}`, "gi");

      if (name) {
        query.title = nameIncludes;
      }
      if (description) {
        query.description = description.trim();
      }
      if (isFreeShipping) {
        query.isFreeShipping = isFreeShipping;
      }
      if (style) {
        query.style = style.trim();
      }
      if (installments) {
        query.installments = installments;
      }
      if (size) {
        const sizeArr = size
          .trim()
          .split(",")
          .map((x) => x.trim());
        query.availableSizes = { $all: sizeArr };
      }
    }

    const query1 = await constructQuery(filter); // line-164
    let data = await productModel
      .find({ ...query, ...query1 })
      .collation({ locale: "en", strength: 2 })
      .sort({ price: filter.priceSort });

    if (data.length == 0) {
      return res.status(400).send({ status: false, message: "NO data found" });
    }

    return res.status(200).send({
      status: true,
      message: "Success",
      count: data.length,
      data: data,
    });
  } catch (err) {
    return res.status(500).send({ status: false, error: err.message });
  }
};

const constructQuery = async (filter) => {
  if (filter.priceGreaterThan && filter.priceLessThan) {
    return {
      $and: [
        { price: { $gt: filter.priceGreaterThan, $lt: filter.priceLessThan } },
      ],
    };
  } else if (filter.priceGreaterThan) {
    return { price: { $gt: filter.priceGreaterThan } };
  } else if (filter.priceLessThan) {
    return { price: { $lt: filter.priceLessThan } };
  }
};

const getProductsById = async function (req, res) {
  try {
    const productId = req.params.productId;

    if (!Validator.isValidObjectId(productId)) {
      return res
        .status(400)
        .send({ status: false, message: " Enter a valid productId" });
    }

    const productById = await productModel
      .findOne({ _id: productId, isDeleted: false })
      .collation({ locale: "en", strength: 2 });

    if (!productById) {
      return res.status(404).send({
        status: false,
        message: "No product found by this Product id",
      });
    }
    return res
      .status(200)
      .send({ status: true, message: "success", data: productById });
  } catch (err) {
    return res.status(500).send({ status: false, error: err.message });
  }
};

const updateProduct = async function (req, res) {
  try {
    let productId = req.params.productId;

    if (!Validator.isValidObjectId(productId)) {
      return res
        .status(400)
        .send({ status: false, message: " Enter a valid productId" });
    }

    const productByproductId = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!productByproductId) {
      return res
        .status(404)
        .send({ status: false, message: " Product not found" });
    }
    let data = req.body;
    let {
      title,
      price,
      currencyId,
      currencyFormat,
      availableSizes,
      productImage,
    } = data;

    let files = req.files;
    if (files && files.length > 0) {
      if (!Validator.isValidImageType(files[0].mimetype)) {
        return res.status(400).send({
          status: false,
          message: "Only images can be uploaded (jpeg/jpg/png)",
        });
      }
      let fileUrl = await uploadFile(files[0]);
      productImage = fileUrl;
    }

    if (title) {
      let uniqueTitle = await productModel
        .findOne({ title: title })
        .collation({ locale: "en", strength: 2 });
      if (uniqueTitle) {
        return res.status(400).send({
          status: false,
          message: "Title already present",
        });
      }
    }

    if (price) {
      if (!Validator.isValidPrice(price)) {
        return res.status(400).send({
          status: false,
          message:
            "Price should be minimum 3-5 digits and for decimal value- after decimal please take 2 digits",
        });
      }
    }
    if (currencyId) {
      if (currencyId != "INR") {
        return res.status(400).send({
          status: false,
          message: "CurrencyId should be INR",
        });
      }
    }

    if (currencyFormat) {
      if (currencyFormat != "₹") {
        return res.status(400).send({
          status: false,
          message: "CurrencyFormat should be ₹ ",
        });
      }
    }

    if (availableSizes) {
      let enumSize = ["S", "XS", "M", "X", "L", "XXL", "XL"];
      for (let i = 0; i < availableSizes.length; i++) {
        if (!enumSize.includes(availableSizes[i])) {
          return res.status(400).send({
            status: false,
            message: "availableSizes should be-[S, XS,M,X, L,XXL, XL]",
          });
        }
      }
    }

    let updatedData = await productModel.findOneAndUpdate(
      { _id: productId },
      data,
      {
        new: true,
      }
    );
    return res.status(200).send({
      status: true,
      message: "product details updated",
      data: updatedData,
    });
  } catch (err) {
    return res.status(500).send({ status: false, error: err.message });
  }
};

const deleteProduct = async function (req, res) {
  let productId = req.params.productId;
  if (!Validator.isValidObjectId(productId)) {
    return res
      .status(400)
      .send({ status: false, message: " Enter a valid productId" });
  }

  const productById = await productModel.findOneAndUpdate(
    { _id: productId, isDeleted: false },
    { isDeleted: true, deletedAt: new Date() }
  );
  return productById
    ? res
        .status(200)
        .send({ status: true, message: "product deleted successfully" })
    : res
        .status(400)
        .send({
          status: false,
          message: "No product found by this Product id",
        });
};

module.exports = {
  createProduct,
  updateProduct,
  getProduct,
  getProductsById,
  deleteProduct,
};
