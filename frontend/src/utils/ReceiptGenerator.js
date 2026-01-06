import jsPDF from "jspdf";

export const generateCustomerReceipt = async (order, restaurant) => {
    // 1. Get dynamic name or fallback
    const dynamicName = restaurant?.restaurantName || restaurant?.username || "BITEBOX KITCHEN";

    // 2. CALCULATE DYNAMIC HEIGHT
    // Base height (header + footer) + (Items * 8mm per item)
    const baseHeight = 170; 
    const itemHeight = order.items.length * 8; 
    const docHeight = baseHeight + itemHeight;

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, docHeight] // Dynamic height prevents cutting off content
    });

    const centerX = 40;
    const rightAlignX = 75;
    const leftAlignX = 5;
    let y = 10; // Start Y position

    // Helper to load QR Code
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

    // --- 1. HEADER ---
    doc.setFontSize(14); 
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    
    // Auto-split long restaurant names
    const titleLines = doc.splitTextToSize(dynamicName.toUpperCase(), 70);
    doc.text(titleLines, centerX, y, { align: "center" });
    y += (titleLines.length * 5); 

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("PREMIUM DINING EXPERIENCE", centerX, y, { align: "center" });

    y += 6;
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.setLineDashPattern([1, 1], 0); 
    doc.line(leftAlignX, y, rightAlignX, y);
    
    // --- 2. ORDER DETAILS (PARCEL LOGIC) ---
    y += 6;
    doc.setTextColor(0);
    doc.setFontSize(10); // Slightly larger for visibility
    doc.setFont("helvetica", "bold");
    
    // ✅ CHECK FOR PARCEL OR TABLE
    if (order.tableNum === "Parcel" || order.tableNum === "Takeaway") {
        doc.text("📦 TAKEAWAY ORDER", leftAlignX, y); 
    } else {
        doc.text(`TABLE: ${order.tableNum}`, leftAlignX, y);
    }

    doc.setFontSize(9);
    doc.text(new Date().toLocaleDateString(), rightAlignX, y, { align: "right" });
    
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`ID: #${order._id.slice(-6).toUpperCase()}`, leftAlignX, y);
    doc.text(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), rightAlignX, y, { align: "right" });

    y += 5;
    doc.line(leftAlignX, y, rightAlignX, y);

    // --- 3. ITEMS TABLE HEADER ---
    y += 6;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("ITEM", leftAlignX, y);
    doc.text("QTY", 50, y, { align: "center" }); 
    doc.text("PRICE", rightAlignX, y, { align: "right" });
    
    y += 3;
    doc.setFont("helvetica", "normal");
    
    // --- ITEMS LOOP ---
    order.items.forEach((item) => {
        y += 6;
        const name = item.name.length > 18 ? item.name.substring(0, 16) + ".." : item.name;
        doc.text(name, leftAlignX, y);
        doc.text(`${item.quantity}`, 50, y, { align: "center" });
        doc.text(`${(item.price * item.quantity).toFixed(2)}`, rightAlignX, y, { align: "right" });
    });

    // --- 4. TOTALS ---
    y += 6;
    doc.setLineDashPattern([1, 1], 0); 
    doc.line(leftAlignX, y, rightAlignX, y);
    
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Total Qty:", leftAlignX, y);
    doc.text(`${order.items.reduce((acc, curr) => acc + curr.quantity, 0)}`, rightAlignX, y, { align: "right" });

    y += 5;
    doc.text("Taxes:", leftAlignX, y);
    doc.text("0.00", rightAlignX, y, { align: "right" });

    y += 7;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL:", leftAlignX, y);
    doc.setTextColor(0); 
    doc.text(`Rs. ${order.totalAmount}`, rightAlignX, y, { align: "right" });

    // --- 5. PAYMENT STATUS (ENHANCED BOX) ---
    y += 10;
    const isOnline = order.paymentMethod?.toLowerCase() === "online";
    
    doc.setLineDashPattern([], 0); // Solid line for box

    if (isOnline) {
        // GREEN BOX for Online Payment
        doc.setFillColor(235, 255, 235); // Light Green
        doc.setDrawColor(0, 150, 0);     // Dark Green Border
        doc.roundedRect(leftAlignX, y, 70, 12, 2, 2, "FD"); 
        
        doc.setTextColor(0, 120, 0); 
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("PAID ONLINE ✅", centerX, y + 8, { align: "center" });
    } else {
        // WHITE BOX for Cash Payment
        doc.setDrawColor(0); 
        doc.setFillColor(255, 255, 255); 
        doc.roundedRect(leftAlignX, y, 70, 12, 2, 2, "FD");
        
        doc.setTextColor(0);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("PAY CASH AT COUNTER 💵", centerX, y + 8, { align: "center" });
    }

    // --- 6. FOOTER ---
    y += 20;
    doc.setTextColor(0);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("HOW WAS YOUR EXPERIENCE?", centerX, y, { align: "center" });
    
    y += 5;
    doc.setFontSize(14);
    doc.setTextColor(150); 
    doc.text("* * * * *", centerX, y, { align: "center" }); // 5 Stars

    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text("Thank you for visiting!", centerX, y, { align: "center" });

    // --- 7. QR CODE ---
    if (qrImage) {
        y += 5;
        doc.addImage(qrImage, "PNG", centerX - 12, y, 24, 24);
        y += 28; 
    } else {
        y += 10;
    }

    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100); 
    doc.text("Powered by BiteBox AI", centerX, y, { align: "center" });

    // --- 8. SAVE FILE ---
    const tableLabel = order.tableNum === "Parcel" ? "Parcel" : `Table_${order.tableNum}`;
    const fileName = `${dynamicName.replace(/\s+/g, '_')}_${tableLabel}.pdf`;
    doc.save(fileName);
};