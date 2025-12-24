import jsPDF from "jspdf";
import "jspdf-autotable";

export const generateCustomerReceipt = (order, restaurant) => {
    const doc = new jsPDF({ unit: "mm", format: [80, 180] }); 
    const taxRate = restaurant?.taxRate || 5; 
    
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
    doc.text(restaurant?.restaurantName?.toUpperCase() || "TAX INVOICE", 40, startY, { align: "center" });
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(restaurant?.address || "Official Tax Invoice", 40, startY + 4, { align: "center" });
    doc.line(5, startY + 10, 75, startY + 10);

    // --- INFO ---
    doc.setFontSize(8);
    doc.text(`INV: #${order._id.slice(-6).toUpperCase()}`, 5, startY + 16);
    doc.text(`TABLE: ${order.tableNumber}`, 5, startY + 20);
    doc.text(`DATE: ${new Date().toLocaleString()}`, 5, startY + 24);

    // --- ITEMS ---
    const tableRows = order.items.map(item => [item.name, item.quantity, `Rs.${(item.price * item.quantity).toFixed(2)}`]);
    doc.autoTable({
        startY: startY + 28,
        head: [['Item', 'Qty', 'Total']],
        body: tableRows,
        theme: 'plain',
        styles: { fontSize: 7 },
        headStyles: { fontStyle: 'bold' },
        margin: { left: 5, right: 5 }
    });

    const subtotal = order.totalAmount;
    const tax = (subtotal * taxRate) / 100;
    const total = subtotal + tax;

    let finalY = doc.lastAutoTable.finalY + 5;
    doc.setFontSize(8);
    doc.text(`Subtotal: Rs.${subtotal.toFixed(2)}`, 75, finalY, { align: "right" });
    doc.text(`GST (${taxRate}%): Rs.${tax.toFixed(2)}`, 75, finalY + 4, { align: "right" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`GRAND TOTAL: Rs.${total.toFixed(2)}`, 75, finalY + 10, { align: "right" });

    doc.save(`Receipt_Table_${order.tableNumber}.pdf`);
};