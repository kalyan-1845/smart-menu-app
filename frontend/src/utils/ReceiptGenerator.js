import jsPDF from "jspdf";

export const generateCustomerReceipt = (order, restaurant) => {
    // 1. Setup 80mm Thermal Receipt Size (Standard size)
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 240] // Slightly longer to fit long orders
    });

    const centerX = 40; 
    let y = 10; 

    // --- LOGO / HEADER ---
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(restaurant?.restaurantName || "BiteBox", centerX, y, { align: "center" });
    y += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Official Digital Receipt", centerX, y, { align: "center" });
    y += 5;
    
    doc.text("------------------------------------------", centerX, y, { align: "center" });
    y += 5;

    // --- ORDER DETAILS ---
    doc.setFontSize(10);
    doc.text(`Order: #${order._id.slice(-6).toUpperCase()}`, 5, y);
    y += 5;
    
    // 🚨 FIX: Changed from tableNum to tableNumber
    doc.text(`Table: ${order.tableNumber || "Takeaway"}`, 5, y);
    y += 5;
    
    const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
    doc.text(`Date: ${dateStr}`, 5, y);
    y += 5;
    
    doc.text("------------------------------------------", centerX, y, { align: "center" });
    y += 5;

    // --- ITEMS LIST ---
    doc.setFont("helvetica", "bold");
    doc.text("Item", 5, y);
    doc.text("Price", 75, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 5;

    order.items.forEach((item) => {
        const name = `${item.quantity} x ${item.name}`;
        const price = `Rs.${item.price * item.quantity}`;
        
        // Handle long names (Wrap text or cut it)
        if (name.length > 22) {
            doc.text(name.substring(0, 22) + "...", 5, y);
        } else {
            doc.text(name, 5, y);
        }
        
        doc.text(price, 75, y, { align: "right" });
        y += 5;
    });

    doc.text("------------------------------------------", centerX, y, { align: "center" });
    y += 5;

    // --- TOTAL ---
    y += 2;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", 5, y);
    doc.text(`Rs. ${order.totalAmount}`, 75, y, { align: "right" });
    y += 8;

    // --- PAYMENT STATUS ---
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const statusText = order.paymentMethod === "Cash" ? "Pay Cash at Counter" : "Paid Online";
    doc.text(`Status: ${statusText}`, centerX, y, { align: "center" });
    y += 10;

    // --- FOOTER ---
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("Thank you for dining with us!", centerX, y, { align: "center" });
    y += 4;
    doc.text("Powered by BiteBox", centerX, y, { align: "center" });

    // Download
    doc.save(`Bill_${order._id.slice(-4)}.pdf`);
};