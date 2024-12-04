export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    const existingCartProduct = user.cartItems.find(
      (item) => item.id === productId
    );
    if (existingCartProduct) {
      existingCartProduct.quantity += 1;
    } else {
      user.cartItems.push(productId);
    }
    await user.save();
    res.json(user.cartItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeAllProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;
    if (!productId) {
      user.cartItems = [];
    } else {
      user.cartItems.filter((items) => items.id !== productId);
    }
    await user.save();
    res.json(user.cartItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { quantity } = req.body;
    const user = req.user;
    const existingProduct = user.find((items) => items.id === productId);

    if (existingProduct) {
      if (quantity === 0) {
        user.cartItems = user.filter((items) => items.id !== productId);
        await user.save();
        return res.json(user.cartItems);
      }

      existingProduct.quantity = quantity;
      await user.save();
      return res.json(user.cartItems);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCartProducts = async (req, res) => {
  try {
    const products = await product.find({ _id: { $in: req.user.cartItems } });

    //need to add quanity to it
    const cartItems = products.map((product) => {
      const item = req.user.cartItems.find(
        (cartItem) => cartItem.id === product.id
      );
      return { ...product.toJSON(), quantity: item.quantity };
    });

    res.json(cartItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
