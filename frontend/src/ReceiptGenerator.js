import jsPDF from "jspdf";
import "jspdf-autotable";

export const generateCustomerReceipt = (order, restaurant) => {
    const doc = new jsPDF({ unit: "mm", format: [80, 180] }); // Taller for tax breakdown
    const taxRate = restaurant?.taxRate || 5; // Default to 5% if not set
    
    let startY = 15;
    if (restaurant?.logo) {
        try {
            doc.addImage(restaurant.logo, 'PNG', 25, 5, 30, 20); 
            startY = 30;
        } catch (e) { console.error("Logo error"); }
    }

    // --- HEADER ---
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(restaurant?.username?.toUpperCase() || "TAX INVOICE", 40, startY, { align: "center" });
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(restaurant?.address || "Official Tax Invoice", 40, startY + 4, { align: "center" });
    if(restaurant?.gstin) doc.text(`GSTIN: ${restaurant.gstin}`, 40, startY + 8, { align: "center" });
    doc.line(5, startY + 10, 75, startY + 10);

    // --- INFO ---
    doc.setFontSize(8);
    doc.text(`INV NO: #${order._id.slice(-6).toUpperCase()}`, 5, startY + 16);
    doc.text(`TABLE: ${order.tableNumber}`, 5, startY + 20);
    doc.text(`DATE: ${new Date(order.createdAt).toLocaleString()}`, 5, startY + 24);

    // --- ITEMS TABLE ---
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
        styles: { fontSize: 7, cellPadding: 1 },
        headStyles: { fontStyle: 'bold', borderBottom: 0.1 },
        margin: { left: 5, right: 5 }
    });

    // --- TAX CALCULATION SECTION ---
    const subtotal = order.totalAmount; // Assuming totalAmount from cart is base price
    const taxAmount = (subtotal * taxRate) / 100;
    const grandTotal = subtotal + taxAmount;

    let finalY = doc.lastAutoTable.finalY + 6;
    doc.line(5, finalY, 75, finalY);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    
    // Subtotal Row
    doc.text("Subtotal:", 5, finalY + 5);
    doc.text(`Rs.${subtotal.toFixed(2)}`, 75, finalY + 5, { align: "right" });

    // Tax Row (Split into CGST/SGST if 5% total)
    doc.text(`GST (${taxRate}%):`, 5, finalY + 9);
    doc.text(`Rs.${taxAmount.toFixed(2)}`, 75, finalY + 9, { align: "right" });

    // Grand Total Row
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL AMOUNT:", 5, finalY + 16);
    doc.text(`Rs.${grandTotal.toFixed(2)}`, 75, finalY + 16, { align: "right" });

    // Footer
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.text(`Payment: ${order.paymentMethod.toUpperCase()}`, 40, finalY + 24, { align: "center" });
    
    doc.save(`Invoice_${order._id.slice(-6)}.pdf`);
};