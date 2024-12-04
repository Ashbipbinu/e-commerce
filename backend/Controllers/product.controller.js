import cloudinary from "../dbConfig/cloudinary.js";
import { redis } from "../dbConfig/redisdb.js";
import Product from "../Model/product.model.js";

const updateFeaturedPropductFromRedis = async () => {
  try {
    const featuredProduct = await Product.find({ isFeatured: true });
    await redis.set("featured_product", JSON.stringify(featuredProduct));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featured_products");
    if (featuredProducts) {
      //JSON.parse() used here because redis saves data as sting
      return res.status(200).json(JSON.parse(featuredProducts));
    }

    //lean() will return plain js object than mongoose document, helps better performance
    featuredProducts = await Product.find({ isFeatured: true }).lean();
    if (!featuredProducts) {
      res.status(401).json({ message: "No featured products found" });
    }

    await redis.set("featured_products", JSON.stringify(featuredProducts));
  } catch (error) {
    res.status(500).json({
      message: "Error in getting featured product",
      error: error.message,
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category } = req.body;
    let cloudinaryRes = null;
    if (image) {
      cloudinaryRes = await cloudinary.uploader.upload(iamge, {
        folder: "products",
      });
    }
    const product = await Product.create({
      name,
      description,
      price,
      image: cloudinaryRes.secretUrl ? cloudinaryRes.secretUrl : "",
      category,
    });
    return res.status(201).json({ product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(401).json({ message: "No product found with this id" });
    }

    if (product.image) {
      const imageId = product.image.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`products/${imageId}`);
      } catch (error) {
        res
          .status(401)
          .json({ message: "Error while deleting image from cloudinary" });
      }
    }

    await Product.findByIdAndDelete(id);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message, message: "Couldnt delete the product" });
  }
};

export const getRecommendation = async (req, res) => {
  try {
    const product = await Product.aggregate([
      {
        $sample: { size: 3 },
      },
      { $project: { _id: 1, name: 1, description: 1, image: 1, price: 1 } },
    ]);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  const category = req.params;
  try {
    const products = await Product.find({ category });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const toggleFeatureProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params);
    if (product) {
      product.isFeatured = !product.isFeatured;
      const updatedProduct = await product.save();
      await updateFeaturedPropductFromRedis();
      return res.status(201).json(updatedProduct);
    }
    return res.status(401).json({ message: "Product not found" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
