import jsPDF from "jspdf";
import "jspdf-autotable";

export const generateCustomerReceipt = (order, restaurant) => {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 240] 
    });

    const centerX = 40;
    let y = 12;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(restaurant?.restaurantName?.toUpperCase() || "BITEBOX KITCHEN", centerX, y, { align: "center" });
    
    y += 14;
    doc.setDrawColor(200, 200, 240);
    doc.line(5, y, 75, y);
    y += 7;

    doc.setFontSize(9);
    doc.text(`ORDER ID: #${order._id.slice(-4).toUpperCase()}`, 5, y);
    doc.text(`TABLE: ${order.tableNum}`, 75, y, { align: "right" });
    
    y += 12;
    order.items.forEach((item) => {
        y += 5;
        doc.text(item.name.substring(0, 20), 5, y);
        doc.text(`${item.quantity}`, 45, y, { align: "center" });
        doc.text(`Rs.${item.price * item.quantity}`, 75, y, { align: "right" });
    });

    y += 8;
    doc.line(5, y, 75, y);
    y += 8;

    doc.setFontSize(12);
    doc.text("GRAND TOTAL", 5, y);
    doc.text(`Rs.${order.totalAmount}`, 75, y, { align: "right" });

    y += 8;
    const isOnline = order.paymentMethod === "Online";
    doc.setFillColor(isOnline ? 220 : 255, isOnline ? 245 : 240, isOnline ? 220 : 220); 
    doc.roundedRect(10, y, 60, 10, 2, 2, "F");
    
    doc.setFontSize(9);
    doc.setTextColor(isOnline ? 30 : 200, isOnline ? 120 : 80, isOnline ? 30 : 0); 
    doc.text(isOnline ? "✔ PAID ONLINE" : "⚠ PAY CASH AT COUNTER", centerX, y + 6.5, { align: "center" });

    y += 18;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${window.location.origin}/menu/${restaurant?.username}`;
    doc.addImage(qrUrl, "PNG", centerX - 10, y, 20, 20);
    
    y += 30;
    doc.setTextColor(249, 115, 22);
    doc.text("POWERED BY BITEBOX", centerX, y, { align: "center" });

    doc.save(`Receipt_${order._id.slice(-4)}.pdf`);
};