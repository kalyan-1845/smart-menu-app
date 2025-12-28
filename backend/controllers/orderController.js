let orders = [];

export const createOrder = (req, res) => {
  orders.push({ ...req.body, status: "pending" });
  res.json({ msg: "Order placed" });
};

export const getOrders = (req, res) => {
  res.json(orders);
};

export const updateOrder = (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (order) order.status = req.body.status;
  res.json({ msg: "Updated" });
};
