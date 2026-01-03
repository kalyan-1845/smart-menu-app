import jsPDF from "jspdf";

export const generateCustomerReceipt = async (order, restaurant) => {
    // 1. Get the dynamic name: prioritize 'restaurantName', fallback to 'username'
    const dynamicName = restaurant?.restaurantName || restaurant?.username || "BITEBOX KITCHEN";

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 240] 
    });

    const centerX = 40;
    const rightAlignX = 75;
    const leftAlignX = 5;
    let y = 15;

    const loadImage = (url) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous"; 
            img.src = url;
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
        });
    };

    const landingPageUrl = "https://smartmenuss.netlify.app";
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(landingPageUrl)}`;
    const qrImage = await loadImage(qrUrl);

    // --- 1. HEADER (Now using dynamicName) ---
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    // Uppercase for that professional thermal receipt look
    doc.text(dynamicName.toUpperCase(), centerX, y, { align: "center" });
    
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("PREMIUM DINING EXPERIENCE", centerX, y, { align: "center" });

    y += 8;
    doc.setDrawColor(200);
    doc.setLineDashPattern([1, 1], 0); 
    doc.line(leftAlignX, y, rightAlignX, y);
    
    // --- 2. ORDER INFO ---
    y += 7;
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`TABLE: ${order.tableNum}`, leftAlignX, y);
    doc.text(new Date().toLocaleDateString(), rightAlignX, y, { align: "right" });
    
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`ORDER ID: #${order._id.slice(-6).toUpperCase()}`, leftAlignX, y);
    doc.text(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), rightAlignX, y, { align: "right" });

    y += 6;
    doc.line(leftAlignX, y, rightAlignX, y);

    // --- 3. ITEMS TABLE ---
    y += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("ITEM", leftAlignX, y);
    doc.text("QTY", 45, y, { align: "center" });
    doc.text("PRICE", rightAlignX, y, { align: "right" });
    
    y += 2;
    doc.setFont("helvetica", "normal");
    
    order.items.forEach((item) => {
        y += 6;
        const name = item.name.length > 22 ? item.name.substring(0, 20) + ".." : item.name;
        doc.text(name, leftAlignX, y);
        doc.text(`${item.quantity}`, 45, y, { align: "center" });
        doc.text(`${(item.price * item.quantity).toFixed(2)}`, rightAlignX, y, { align: "right" });
    });

    // --- 4. TOTALS ---
    y += 8;
    doc.setLineDashPattern([], 0); 
    doc.line(leftAlignX, y, rightAlignX, y);
    
    y += 7;
    doc.setFontSize(9);
    doc.text("Total Quantity:", leftAlignX, y);
    doc.text(`${order.items.reduce((acc, curr) => acc + curr.quantity, 0)}`, rightAlignX, y, { align: "right" });

    y += 5;
    doc.text("GST / Taxes:", leftAlignX, y);
    doc.text("Inclusive", rightAlignX, y, { align: "right" });

    y += 8;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("GRAND TOTAL:", leftAlignX, y);
    doc.setTextColor(249, 115, 22); 
    doc.text(`Rs.${order.totalAmount}`, rightAlignX, y, { align: "right" });

    // --- 5. PAYMENT STATUS ---
    y += 8;
    const isOnline = order.paymentMethod?.toLowerCase() === "online";
    if (isOnline) {
        doc.setFillColor(34, 197, 94); 
        doc.roundedRect(leftAlignX, y, 70, 9, 1, 1, "F");
        doc.setTextColor(255);
        doc.setFontSize(10);
        doc.text("✔ PAID ONLINE - THANK YOU", centerX, y + 6, { align: "center" });
    } else {
        doc.setDrawColor(239, 68, 68);
        doc.setLineWidth(0.5);
        doc.roundedRect(leftAlignX, y, 70, 9, 1, 1, "S");
        doc.setTextColor(239, 68, 68);
        doc.setFontSize(10);
        doc.text("⚠ PAY CASH AT COUNTER", centerX, y + 6, { align: "center" });
    }

    // --- 6. FEEDBACK ---
    y += 18;
    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("HOW WAS YOUR EXPERIENCE?", centerX, y, { align: "center" });
    
    y += 6;
    doc.setFontSize(14);
    doc.setTextColor(200); 
    doc.text("☆   ☆   ☆   ☆   ☆", centerX, y, { align: "center" });

    // --- 7. THANK YOU ---
    y += 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text("THANK YOU FOR VISITING! 🙏", centerX, y, { align: "center" });

    // --- 8. QR CODE & BRANDING ---
    if (qrImage) {
        y += 12;
        doc.addImage(qrImage, "PNG", centerX - 12.5, y, 25, 25);
    }

    y += 32;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(249, 115, 22); 
    doc.text("POWERED BY BITEBOX AI", centerX, y, { align: "center" });

    // --- 9. FINAL SAVE (Using dynamic name in filename) ---
    const fileName = `${dynamicName.replace(/\s+/g, '_')}_Table_${order.tableNum}.pdf`;
    doc.save(fileName);
};