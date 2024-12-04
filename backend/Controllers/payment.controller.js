import Coupon from "../Model/coupon.model.js";
import Order from "../Model/order.model.js";
import { stripe } from "../utils/stripe.js";

export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid or empty products array" });
    }

    let totalAmount = 0;
    const lineItems = products.map((product) => {
      const amount = Math.round(product.price * 100); // convert the dolla into cents
      totalAmount = amount * product.quantity;

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: [product.images],
          },
          unit_amount: amount,
        },
      };
    });

    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOnr({
        code: couponCode,
        userId: req.userId,
        isActive: true,
      });
      if (coupon) {
        totalAmount = Math.round(
          (totalAmount * coupon.discountPercentage) / 100
        );
      }
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "paypal", "amazon_pay"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      discounts: coupon
        ? [{ coupon: await createStripedCoupon(coupon.discountPercentage) }]
        : [],
      metadata: {
        userId: req.user._id.toString(),
        couponCode: couponCode || "",
        product: JSON.stringify(
          products.map((p) => ({
            id: p.id,
            quantity: p.quantity,
            price: p.price,
          }))
        ),
      },
    });
    if (totalAmount >= 20000) {
      await createNewCoupon(req.user._id);
    }
    res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const checkOutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      if (session.metadata.couponCode) {
        await Coupon.findOneAndUpdate({
          code: session.metadata.couponCode,
          userId: sesion.metadata.userId,
          inActive: false,
        });
      }

      //create new order
      const products = JSON.parse(session.metadata.product);
      const newOrder = new Order({
        user: session.metadata.userId,
        products : products.map(p => {
          return {
            product: p.id,
            quantity: p.quantity,
            price: p.price
          }
        }),
        totalAmount: session.amount.totalAmount / 100,
        stripeSessionId: sessionId,
      })

      await newOrder.save();
      res.status(200).json({
         message: "Payment successfull",
         orderId: newOrder._id
      })
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

async function createStripedCoupon(discountPercentage) {
  const coupon = await stripe.coupons.create({
    percent_off: discountPercentage,
    duration: "once",
  });
  return coupon.id;
}

async function createNewCoupon(userId) {
  const newCoupon = new Coupon({
    code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    discountPercentage: 10,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), //30 months
    userId,
  });
  await newCoupon.save();

  return newCoupon;
}
