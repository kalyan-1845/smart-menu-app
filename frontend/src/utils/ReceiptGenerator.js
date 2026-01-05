import jsPDF from "jspdf";

export const generateCustomerReceipt = async (order, restaurant) => {
    // 1. Get dynamic name
    const dynamicName = restaurant?.restaurantName || restaurant?.username || "BITEBOX KITCHEN";

    // 2. CALCULATE DYNAMIC HEIGHT
    // Base height (header + footer) + (Items * 10mm per item)
    const baseHeight = 160; 
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
    let y = 10; // Start higher up

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
    doc.setFontSize(14); // Slightly smaller for better fit
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    
    // Auto-split long restaurant names into multiple lines if needed
    const titleLines = doc.splitTextToSize(dynamicName.toUpperCase(), 70);
    doc.text(titleLines, centerX, y, { align: "center" });
    y += (titleLines.length * 5); // Adjust Y based on lines

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("PREMIUM DINING EXPERIENCE", centerX, y, { align: "center" });

    y += 6;
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.setLineDashPattern([1, 1], 0); 
    doc.line(leftAlignX, y, rightAlignX, y);
    
    // --- 2. ORDER DETAILS ---
    y += 6;
    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    
    // Use a grid layout for Table/Date
    doc.text(`TABLE: ${order.tableNum}`, leftAlignX, y);
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
    doc.text("QTY", 50, y, { align: "center" }); // Fixed X for Qty
    doc.text("PRICE", rightAlignX, y, { align: "right" });
    
    y += 3;
    doc.setFont("helvetica", "normal");
    
    // --- ITEMS LOOP ---
    order.items.forEach((item) => {
        y += 6;
        
        // Clean text handling for long names
        const name = item.name.length > 20 ? item.name.substring(0, 18) + ".." : item.name;
        
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
    doc.text("0.00", rightAlignX, y, { align: "right" }); // Explicitly showing 0.00 looks more professional

    y += 7;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL:", leftAlignX, y);
    doc.setTextColor(0); 
    doc.text(`Rs. ${order.totalAmount}`, rightAlignX, y, { align: "right" });

    // --- 5. PAYMENT STATUS (FIXED BOX) ---
    y += 8;
    const isOnline = order.paymentMethod?.toLowerCase() === "online";
    
    // Reset Line Dash for solid box
    doc.setLineDashPattern([], 0); 

    if (isOnline) {
        doc.setFillColor(240, 253, 244); // Light Green bg
        doc.setDrawColor(34, 197, 94);   // Green border
        doc.roundedRect(leftAlignX, y, 70, 10, 2, 2, "FD"); // FD = Fill and Draw
        
        doc.setTextColor(21, 128, 61); // Dark Green Text
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        // Shortened text to ensure it fits
        doc.text("PAID ONLINE", centerX, y + 6.5, { align: "center" });
    } else {
        doc.setDrawColor(0); // Black border
        doc.setFillColor(255, 255, 255); // White bg
        doc.roundedRect(leftAlignX, y, 70, 10, 2, 2, "FD");
        
        doc.setTextColor(0);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("PAY CASH AT COUNTER", centerX, y + 6.5, { align: "center" });
    }

    // --- 6. FEEDBACK (FIXED STARS) ---
    y += 18;
    doc.setTextColor(0);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("HOW WAS YOUR EXPERIENCE?", centerX, y, { align: "center" });
    
    y += 5;
    doc.setFontSize(16);
    doc.setTextColor(150); 
    // FIXED: Removed unicode stars (☆) because PDF doesn't support them by default.
    // Using standard ASCII characters creates a cleaner look that won't break.
    doc.text("* * * * *", centerX, y, { align: "center" });

    // --- 7. THANK YOU ---
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text("Thank you for visiting!", centerX, y, { align: "center" });

    // --- 8. QR CODE & BRANDING ---
    if (qrImage) {
        y += 5;
        // Centered QR code
        doc.addImage(qrImage, "PNG", centerX - 12, y, 24, 24);
        y += 28; // Move Y past the image
    } else {
        y += 10;
    }

    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100); 
    doc.text("Powered by BiteBox AI", centerX, y, { align: "center" });

    // --- 9. FINAL SAVE ---
    const fileName = `${dynamicName.replace(/\s+/g, '_')}_Table_${order.tableNum}.pdf`;
    doc.save(fileName);
};