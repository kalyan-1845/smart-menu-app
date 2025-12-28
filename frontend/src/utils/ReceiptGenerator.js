export function generateReceipt(order) {
  const {
    id,
    restaurantName,
    tableNo,
    items,
    subtotal,
    tax = 0,
    total,
    paymentMethod,
    createdAt,
  } = order;

  const lines = [];

  lines.push("🍽️ " + restaurantName);
  lines.push("——————————————");
  lines.push(`Order ID : ${id}`);
  lines.push(`Table    : ${tableNo}`);
  lines.push(`Date     : ${new Date(createdAt).toLocaleString()}`);
  lines.push("");
  lines.push("Items");
  lines.push("——————————————");

  items.forEach((item) => {
    lines.push(
      `${item.name}  x${item.qty}   ₹${item.price * item.qty}`
    );
  });

  lines.push("——————————————");
  lines.push(`Subtotal : ₹${subtotal}`);
  lines.push(`Tax      : ₹${tax}`);
  lines.push(`Total    : ₹${total}`);
  lines.push("");
  lines.push(`Paid via : ${paymentMethod.toUpperCase()}`);
  lines.push("");
  lines.push("🙏 Thank you for dining with us!");
  lines.push("Powered by BiteBox");

  return lines.join("\n");
}
