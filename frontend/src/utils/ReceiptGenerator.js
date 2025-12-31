import jsPDF from "jspdf";

export const generateCustomerReceipt = (order, restaurant) => {
    // 1. Setup PDF (80mm Width for Thermal Receipt Style)
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 200] 
    });

    const centerX = 40; 
    let y = 10; 

    // --- HEADER ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(restaurant?.username?.toUpperCase() || "RESTAURANT", centerX, y, { align: "center" });
    y += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Thank you for dining with us!", centerX, y, { align: "center" });
    y += 8;
    
    doc.text("--------------------------------", centerX, y, { align: "center" });
    y += 5;

    // --- INFO ---
    doc.setFontSize(10);
    doc.text(`Order: #${order._id.slice(-4).toUpperCase()}`, 5, y);
    y += 5;
    doc.text(`Table: ${order.tableNum}`, 5, y);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 75, y, { align: "right" });
    y += 5;
    
    doc.text("--------------------------------", centerX, y, { align: "center" });
    y += 5;

    // --- ITEMS ---
    order.items.forEach((item) => {
        const itemName = item.name.substring(0, 18); // Truncate long names
        const itemLine = `${item.quantity} x ${itemName}`;
        const priceLine = `${item.price * item.quantity}`;
        
        doc.text(itemLine, 5, y);
        doc.text(priceLine, 75, y, { align: "right" });
        y += 5;
    });

    doc.text("--------------------------------", centerX, y, { align: "center" });
    y += 5;

    // --- TOTAL ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", 5, y);
    doc.text(`Rs.${order.totalAmount}`, 75, y, { align: "right" });
    y += 10;

    // --- STATUS ---
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    const statusText = order.paymentMethod === "Online" ? "(PAID ONLINE)" : "(PAY CASH AT COUNTER)";
    doc.text(statusText, centerX, y, { align: "center" });

    // Save File
    doc.save(`Bill_${order._id.slice(-4)}.pdf`);
};