import jsPDF from "jspdf";
import "jspdf-autotable";

export const generateCustomerReceipt = (order, restaurant) => {
    const doc = new jsPDF({ unit: "mm", format: [80, 180] }); 
    const taxRate = restaurant?.taxRate || 5; 
    
    // --- CENTERED LOGO ---
    const logoUrl = "/logo192.png"; 
    try {
        doc.addImage(logoUrl, 'PNG', 22, 5, 35, 25); 
    } catch (e) {
        console.error("Logo not found");
    }

    let startY = 35;

    // --- RESTAURANT HEADER ---
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(restaurant?.restaurantName?.toUpperCase() || "BITEBOX PARTNER", 40, startY, { align: "center" });
    
    // --- CENTERED URL ---
    const publicMenuUrl = `bitebox.in/menu/${restaurant?.username || 'order'}`;
    doc.setFontSize(7);
    doc.setTextColor(100); 
    doc.text(publicMenuUrl, 40, startY + 8, { align: "center" });
    doc.setTextColor(0); 
    
    doc.line(5, startY + 12, 75, startY + 12);

    // --- ORDER ITEMS TABLE ---
    const tableRows = order.items.map(item => [
        item.name,
        item.quantity,
        `Rs.${(item.price * item.quantity).toFixed(2)}`
    ]);

    doc.autoTable({
        startY: startY + 18,
        head: [['Item', 'Qty', 'Total']],
        body: tableRows,
        theme: 'plain',
        styles: { fontSize: 7, cellPadding: 1 },
        columnStyles: { 0: { cellWidth: 45 }, 2: { halign: 'right' } },
        margin: { left: 5, right: 5 }
    });

    // --- TOTALS ---
    const subtotal = order.totalAmount;
    const grandTotal = subtotal + (subtotal * taxRate / 100);
    let finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("GRAND TOTAL:", 5, finalY);
    doc.text(`Rs.${grandTotal.toFixed(2)}`, 75, finalY, { align: "right" });

    doc.save(`BiteBox_Order_${order._id.slice(-6)}.pdf`);
};