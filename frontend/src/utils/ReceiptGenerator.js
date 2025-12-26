import jsPDF from "jspdf";

export const generateCustomerReceipt = (order, restaurant) => {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 200] // Thermal receipt paper size
    });

    const centerX = 40; // Center of 80mm paper
    let y = 10; // Start Y position

    // --- HEADER ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(restaurant?.restaurantName || "BiteBox", centerX, y, { align: "center" });
    y += 5;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Original Receipt", centerX, y, { align: "center" });
    y += 5;
    
    doc.text("--------------------------------", centerX, y, { align: "center" });
    y += 5;

    // --- INFO ---
    doc.setFontSize(9);
    doc.text(`Order ID: #${order._id.slice(-4).toUpperCase()}`, 5, y);
    y += 5;
    doc.text(`Table: ${order.tableNum}`, 5, y);
    y += 5;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 5, y);
    y += 5;
    
    doc.text("--------------------------------", centerX, y, { align: "center" });
    y += 5;

    // --- ITEMS ---
    doc.setFontSize(9);
    order.items.forEach((item) => {
        const itemLine = `${item.quantity} x ${item.name}`;
        const priceLine = `Rs.${item.price * item.quantity}`;
        
        // Print item name on left, price on right
        doc.text(itemLine.substring(0, 20), 5, y); 
        doc.text(priceLine, 75, y, { align: "right" });
        y += 5;
    });

    doc.text("--------------------------------", centerX, y, { align: "center" });
    y += 5;

    // --- TOTAL ---
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", 5, y);
    doc.text(`Rs.${order.totalAmount}`, 75, y, { align: "right" });
    y += 7;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(order.paymentMethod === "Cash" ? "(Pending Payment)" : "(Paid Online)", centerX, y, { align: "center" });
    y += 10;

    // --- FOOTER ---
    doc.setFontSize(8);
    doc.text("Thank you for dining with us!", centerX, y, { align: "center" });

    // Save File
    doc.save(`Receipt_${order._id.slice(-4)}.pdf`);
};