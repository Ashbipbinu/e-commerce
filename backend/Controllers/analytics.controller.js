import Order from "../Model/order.model.js";
import Product from "../Model/product.model.js";
import User from "../Model/user.model.js";

export const getAnalytics = async (req, res) => {
  try {
    const analyticsData = await getAnalyticsData();

    //get data from today to 7 days ago
    const endDate = new Date();
    const startDate = new Date(endDate.getDate() - 7 * 24 * 60 * 60 * 1000);

    const dailySalesData = await getDailySalesData(startDate, endDate);

    return res.status(201).json({ analyticsData, dailySalesData });
  } catch (error) {
    res.stauts(500).json({ message: error.message });
  }
};

const getAnalyticsData = async () => {
  const totalUsers = await User.countDocuments();
  const totalProducts = await Product.countDocuments();

  const salesData = await Order.aggregate([
    {
      $group: {
        _id: null, //groups all documents together
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: "$totalAmount" },
      },
    },
  ]);

  const { totalSales, totalRevenue } = salesData[0] || {
    totalSales: 0,
    totalRevenue: 0,
  };

  return {
    user: totalUsers,
    products: totalProducts,
    totalSales,
    totalRevenue,
  };
};

const getDailySalesData = async (startDate, endDate) => {
  const dailySalesData = await Order.aggregate(
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        sales: { $sum: 1 },
        revenue: { $sum: "totalAmount" },
      },
    },
    { $sort: { _id: 1 } }
  );
  const dateRangeArr = getDateRange(startDate, endDate);

  return dateRangeArr.map(date => {
    const foundData =  dailySalesData.find(item => item._id === date);

    return {
        date,
        sales: foundData?.sales || 0,
        revenue: FormData?.revenue || 0,
    }
  })
};

function getDateRange(startDate, endDate) {
  const dateRange = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dateRange.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
}
