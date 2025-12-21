import cron from 'node-cron';
import Order from '../models/Order.js';
import Expense from '../models/Expense.js';
import Owner from '../models/Owner.js';

// --- 📅 SCHEDULE: RUNS EVERY NIGHT AT 11:00 PM ---
cron.schedule('0 23 * * *', async () => {
    console.log("🚀 Generating Nightly Business Summaries...");

    try {
        const owners = await Owner.find(); // Get all registered restaurants

        for (const owner of owners) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // 1. Fetch Today's Orders
            const orders = await Order.find({
                owner: owner._id,
                createdAt: { $gte: today }
            });

            // 2. Fetch Today's Expenses
            const expenses = await Expense.find({
                owner: owner._id,
                createdAt: { $gte: today }
            });

            // 3. Aggregate Data
            const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
            const totalCosts = expenses.reduce((sum, e) => sum + e.amount, 0);
            const netProfit = totalRevenue - totalCosts;

            // 4. Find "Dish of the Day"
            const dishCounts = {};
            orders.forEach(o => o.items.forEach(i => {
                dishCounts[i.name] = (dishCounts[i.name] || 0) + i.quantity;
            }));
            const bestSeller = Object.entries(dishCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || "N/A";

            // 5. Urgent Feedback (Rating < 3)
            const urgentFeedback = orders
                .filter(o => o.feedback && o.feedback.rating < 3)
                .map(o => `Table ${o.tableNumber}: "${o.feedback.comment}"`)
                .join('\n');

            // --- 📱 FORMAT MESSAGE ---
            const reportMessage = `
🌟 *NIGHTLY BUSINESS REPORT* 🌟
----------------------------
🏪 *Restaurant:* ${owner.username}
📅 *Date:* ${new Date().toLocaleDateString()}

💰 *Total Revenue:* ₹${totalRevenue.toLocaleString()}
💸 *Daily Expenses:* ₹${totalCosts.toLocaleString()}
📈 *NET PROFIT:* ₹${netProfit.toLocaleString()}

🔥 *Dish of the Day:* ${bestSeller}
📦 *Orders Processed:* ${orders.length}

⚠️ *URGENT FEEDBACK:*
${urgentFeedback || "None! All customers are happy. 😊"}

----------------------------
_Smart Menu Cloud AI v2.6_
            `;

            // 🟢 NEXT STEP: SEND TO WHATSAPP/EMAIL
            sendReport(owner.email, reportMessage);
        }
    } catch (error) {
        console.error("Report Generation Failed:", error);
    }
});

// Mock function for sending (You can link Twilio for WhatsApp or Nodemailer for Email)
const sendReport = (email, message) => {
    console.log(`Sending Report to ${email}...\n`, message);
};