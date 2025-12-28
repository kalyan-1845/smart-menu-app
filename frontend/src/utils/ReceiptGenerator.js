import jsPDF from "jspdf";

export const generateCustomerReceipt = (order, restaurant) => {
    // 1. Setup 80mm Thermal Receipt Size
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 220] 
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
    doc.text(`Table: ${order.tableNum}`, 5, y);
    y += 5;
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 5, y);
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
        const price = `₹${item.price * item.quantity}`;
        
        // Handle long names
        if (name.length > 25) {
            doc.text(name.substring(0, 25) + "...", 5, y);
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
    const statusText = order.paymentMethod === "Cash" ? "Payment Due (Cash)" : "Paid Online";
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