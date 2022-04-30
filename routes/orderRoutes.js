import express from "express";
import mongoose from "mongoose";
import expressAsyncHandler from "express-async-handler";
import { admin, protect } from "./../middleware/AuthMiddleware.js";
import Order from "./../models/OrderModel.js";
import Product from "../models/ProductModel.js";
const orderRouter = express.Router();

// CRUD
/**
 * Create: CREATE ORDER
 */
/* orderRouter.post(
  "/",
  protect,
  expressAsyncHandler(async (req, res) => {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      res.status(400);
      throw new Error("No order items");
      return;
    } else {
      const order = new Order({
        orderItems,
        user: req.user._id,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
      });

      const createOrder = await order.save();
      res.status(201).json(createOrder);
    }
  })
); */

orderRouter.post(
  "/",
  protect,
  expressAsyncHandler(async (req, res, next) => {
    const session = mongoose.startSession();
    (await session).withTransaction(async () => {
      const {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
      } = req.body;
      if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error("No order items");
      } else {
        try {
          const order = new Order({
            orderItems,
            user: req.user._id,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
          });
          for (const item of orderItems) {
            const product = await Product.findOne({_id: item.product});
            if (product.countInStock >= item.qty) {
              await Product.findOneAndUpdate(
                { _id: item.product }, 
                { $inc: 
                  { countInStock: -item.qty, totalSales: +item.qty }
                }, 
                {new: true});
            }
            else {
              res.status(400);
              throw new Error("One or more product order quantity exceed available quantity");
            }
          }
          const createOrder = await order.save();
          res.status(201).json(createOrder);
        }
        catch (error) {
          next(error);
        }
      }
    });
    (await session).endSession();
  })
);


/**
 * Read: ADMIN GET ALL ORDERS
 */
orderRouter.get(
  "/all",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.find({})
      .sort({ _id: -1 })
      .populate("user", "id name email");
    res.json(orders);
  })
);

/**
 * Read: USER LOGIN ORDERS
 */
orderRouter.get(
  "/",
  protect,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ _id: -1 });
    res.json(orders);
  })
);

/**
 * Read: GET ORDER BY ID
 */
orderRouter.get(
  "/:id",
  protect,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );
    if (order) {
      res.json(order);
    } else {
      res.status(404);
      throw new Error("Order Not Found");
    }
  })
);

/**
 * Update: ORDER IS PAID
 */
orderRouter.patch(
  "/:id/pay",
  protect,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address,
      };
      const updateOrder = await order.save();
      res.json(updateOrder);
    } else {
      res.status(404);
      throw new Error("Order Not Found");
    }
  })
);

/**
 * Update: ORDER IS DELIVERED
 */
orderRouter.patch(
  "/:id/delivered",
  protect,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();

      const updateOrder = await order.save();
      res.json(updateOrder);
    } else {
      res.status(404);
      throw new Error("Order Not Found");
    }
  })
);

/**
 * Delete: ...
 * 
 */

export default orderRouter;