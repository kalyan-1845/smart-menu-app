import jsPDF from "jspdf";
import "jspdf-autotable";

export const generateMonthlyReport = (restaurantName, historyData, analytics) => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();

    // --- 1. DATA PROCESSING: TOP 5 DISHES ---
    const dishCounts = {};
    historyData.forEach(order => {
        order.items.forEach(item => {
            dishCounts[item.name] = (dishCounts[item.name] || 0) + item.quantity;
        });
    });

    // Sort and take top 5
    const topDishes = Object.entries(dishCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    // --- 2. HEADER & SUMMARY ---
    doc.setFontSize(22);
    doc.setTextColor(249, 153, 51); // Orange
    doc.text(restaurantName.toUpperCase(), 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Monthly Business Analytics Report | Generated: ${date}`, 14, 30);

    const totalSales = historyData.reduce((sum, o) => sum + o.totalAmount, 0);
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Revenue: INR ${totalSales.toLocaleString()}`, 14, 45);

    // --- 3. TOP SELLING DISHES SECTION ---
    doc.setFontSize(14);
    doc.text("Top 5 Best Selling Items", 14, 60);
    
    doc.autoTable({
        startY: 65,
        head: [['Rank', 'Dish Name', 'Total Quantity Sold']],
        body: topDishes.map(([name, qty], index) => [index + 1, name, qty]),
        theme: 'grid',
        headStyles: { fillColor: [249, 153, 51] }, // Brand Orange
        styles: { fontStyle: 'bold' }
    });

    // --- 4. SALES HISTORY TABLE ---
    const nextY = doc.lastAutoTable.finalY + 15;
    doc.text("Complete Transaction History", 14, nextY);

    doc.autoTable({
        startY: nextY + 5,
        head: [['Date', 'Table', 'Payment', 'Amount']],
        body: historyData.map(o => [
            new Date(o.createdAt).toLocaleDateString(),
            o.tableNumber,
            o.paymentMethod,
            `INR ${o.totalAmount}`
        ]),
        headStyles: { fillColor: [40, 40, 40] } // Dark Grey
    });

    // --- 5. ASSISTANCE ANALYTICS ---
    const finalY = doc.lastAutoTable.finalY + 15;
    if (analytics.length > 0) {
        doc.text("Table Assistance Frequency", 14, finalY);
        doc.autoTable({
            startY: finalY + 5,
            head: [['Table Number', 'Total Requests']],
            body: analytics.map(item => [`Table ${item.table}`, `${item.count} Calls`]),
            headStyles: { fillColor: [59, 130, 246] } // Blue
        });
    }

    doc.save(`${restaurantName}_Analytics_${new Date().getMonth() + 1}.pdf`);
};