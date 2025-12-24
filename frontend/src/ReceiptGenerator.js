import jsPDF from "jspdf";
import "jspdf-autotable";

/**
 * v2.8 Standard Receipt Generator
 * Optimized for 80mm Thermal Printers
 */
export const generateCustomerReceipt = (order, restaurant) => {
    // 80mm width is standard for thermal printers. height is 180mm to allow for long orders.
    const doc = new jsPDF({ unit: "mm", format: [80, 180] }); 
    const taxRate = restaurant?.taxRate || 5; // Default 5% GST
    
    let startY = 15;

    // --- 1. LOGO SECTION ---
    if (restaurant?.logo) {
        try {
            // Centers logo on the 80mm slip
            doc.addImage(restaurant.logo, 'PNG', 25, 5, 30, 15); 
            startY = 25;
        } catch (e) { console.error("Logo failed to load"); }
    }

    // --- 2. RESTAURANT HEADER ---
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(restaurant?.username?.toUpperCase() || "RESTAURANT RECEIPT", 40, startY, { align: "center" });
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    // Address & Metadata
    doc.text(restaurant?.address || "Thank you for visiting!", 40, startY + 4, { align: "center" });
    if(restaurant?.gstin) {
        doc.setFont("helvetica", "bold");
        doc.text(`GSTIN: ${restaurant.gstin}`, 40, startY + 8, { align: "center" });
        startY += 4;
    }
    doc.line(5, startY + 10, 75, startY + 10); // Divider

    // --- 3. ORDER INFO ---
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`INV: #${order._id.slice(-6).toUpperCase()}`, 5, startY + 16);
    doc.setFont("helvetica", "normal");
    doc.text(`TABLE: ${order.tableNumber}`, 5, startY + 20);
    doc.text(`DATE: ${new Date(order.createdAt).toLocaleString()}`, 5, startY + 24);

    // --- 4. ITEMS TABLE ---
    const tableRows = order.items.map(item => [
        item.name,
        item.quantity,
        `Rs.${(item.price * item.quantity).toFixed(2)}`
    ]);

    doc.autoTable({
        startY: startY + 28,
        head: [['Item', 'Qty', 'Total']],
        body: tableRows,
        theme: 'plain',
        styles: { fontSize: 7, cellPadding: 1, font: "helvetica" },
        headStyles: { fontStyle: 'bold', borderBottom: 0.1 },
        columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 10 }, 2: { cellWidth: 15, halign: 'right' } },
        margin: { left: 5, right: 5 }
    });

    // --- 5. TAX & TOTAL CALCULATION ---
    const subtotal = order.totalAmount;
    const totalTax = (subtotal * taxRate) / 100;
    const cgst = totalTax / 2;
    const sgst = totalTax / 2;
    const grandTotal = subtotal + totalTax;

    let finalY = doc.lastAutoTable.finalY + 6;
    doc.line(5, finalY, 75, finalY);
    
    doc.setFontSize(8);
    
    // Subtotal
    doc.text("Subtotal:", 5, finalY + 5);
    doc.text(`Rs.${subtotal.toFixed(2)}`, 75, finalY + 5, { align: "right" });

    // GST Breakdown (Standard India Compliance)
    doc.setFontSize(7);
    doc.text(`CGST (${taxRate/2}%):`, 5, finalY + 9);
    doc.text(`Rs.${cgst.toFixed(2)}`, 75, finalY + 9, { align: "right" });
    doc.text(`SGST (${taxRate/2}%):`, 5, finalY + 13);
    doc.text(`Rs.${sgst.toFixed(2)}`, 75, finalY + 13, { align: "right" });

    // Grand Total
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("GRAND TOTAL:", 5, finalY + 20);
    doc.text(`Rs.${grandTotal.toFixed(2)}`, 75, finalY + 20, { align: "right" });

    // --- 6. FOOTER ---
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`Payment Mode: ${order.paymentMethod?.toUpperCase() || 'CASH'}`, 40, finalY + 28, { align: "center" });
    doc.setFont("helvetica", "italic");
    doc.text("*** Powering Small Businesses with Smart Menu ***", 40, finalY + 34, { align: "center" });

    // Save
    doc.save(`Receipt_${order._id.slice(-6)}.pdf`);
};