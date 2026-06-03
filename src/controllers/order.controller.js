import Order from "../models/order.model.js";

export const getOrderDetails = async (req, res)=>{
    const orders = await Order.find().populate("user", "fullName email").populate("service", "name slug");

    if (!orders) {
        return res.status(400).json({ 
            message: "Order Not Found", 
        });
    }

    return res.status(200).json({
        message: "Orders fetched successfully", 
        orders: orders
    });
}