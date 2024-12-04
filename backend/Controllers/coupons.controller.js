import Coupon from "../Model/coupon.model.js";

export const getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      userId: req.user._id,
      isActive: true,
    });
    res.json(coupon || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const validateCode = async (req, res) => {
  try {
    const { code } = req.params;
    const coupon = await Coupon.findOne({
      code,
      _id: user._id,
      isActive: true,
    });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    if (coupon.expirationDate < new Date()) {
      coupon.isActive = false;
      await coupon.save();
      return res.status(401).json({ message: "Coupon expired" });
    }

    res.json({
      message: "Coupon is valid",
      code: coupon.code,
      discountedPercentage: coupon.percentage,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
