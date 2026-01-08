import cron from 'node-cron';
import nodemailer from 'nodemailer';
import Order from './models/Order.js';
import Expense from './models/Expense.js';
import Owner from './models/Owner.js';

// --- 📧 EMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.REPORT_EMAIL,
        pass: process.env.REPORT_PASSWORD
    }
});

// --- ⏰ SCHEDULE: RUNS EVERY NIGHT AT 11:59 PM ---
cron.schedule('59 23 * * *', async () => {
    console.log("📊 Generating Master Business Summaries...");

    try {
        const owners = await Owner.find({ email: { $exists: true } });

        for (const owner of owners) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // 1. Fetch Data
            const orders = await Order.find({
                restaurantId: owner._id,
                createdAt: { $gte: today }
            });

            const expenses = await Expense.find({
                owner: owner._id,
                createdAt: { $gte: today }
            });

            if (orders.length === 0 && expenses.length === 0) continue;

            // 2. Aggregate Financials
            const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
            const totalCosts = expenses.reduce((sum, e) => sum + e.amount, 0);
            const netProfit = totalRevenue - totalCosts;

            // 3. Analytics: Best Seller
            const dishCounts = {};
            orders.forEach(o => o.items.forEach(i => {
                dishCounts[i.name] = (dishCounts[i.name] || 0) + i.quantity;
            }));
            const bestSeller = Object.entries(dishCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || "N/A";

            // 4. Critical Feedback (Rating < 3)
            const urgentFeedback = orders
                .filter(o => o.feedback && o.feedback.rating < 3)
                .map(o => `<li>Table ${o.tableNumber}: "${o.feedback.comment}"</li>`)
                .join('');

            // --- 📱 SEND EMAIL ---
            const mailOptions = {
                from: `"Kovixa AI" <${process.env.REPORT_EMAIL}>`,
                to: owner.email,
                subject: `🌙 Nightly Report: ${owner.restaurantName}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px;">
                        <h2 style="color: #f97316; text-align: center;">${owner.restaurantName} Summary</h2>
                        <p style="text-align: center; color: #666;">${new Date().toLocaleDateString()}</p>
                        
                        <div style="display: flex; justify-content: space-around; background: #f9f9f9; padding: 15px; border-radius: 10px;">
                            <div style="text-align: center;">
                                <h3 style="margin:0;">₹${totalRevenue.toLocaleString()}</h3>
                                <small>REVENUE</small>
                            </div>
                            <div style="text-align: center; color: #ef4444;">
                                <h3 style="margin:0;">₹${totalCosts.toLocaleString()}</h3>
                                <small>EXPENSES</small>
                            </div>
                            <div style="text-align: center; color: #22c55e;">
                                <h3 style="margin:0;">₹${netProfit.toLocaleString()}</h3>
                                <small>NET PROFIT</small>
                            </div>
                        </div>

                        <div style="margin-top: 20px;">
                            <p>🔥 <b>Dish of the Day:</b> ${bestSeller}</p>
                            <p>📦 <b>Orders Processed:</b> ${orders.length}</p>
                        </div>

                        ${urgentFeedback ? `
                            <div style="background: #fff1f2; padding: 10px; border-left: 4px solid #ef4444; margin-top: 20px;">
                                <h4 style="margin:0; color: #991b1b;">⚠️ Urgent Feedback</h4>
                                <ul style="font-size: 12px; margin-top: 10px;">${urgentFeedback}</ul>
                            </div>
                        ` : ''}

                        <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;">
                        <p style="font-size: 10px; color: #aaa; text-align: center;">Smart Menu Cloud AI v2.6</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`✅ Sent report to ${owner.restaurantName}`);
        }
    } catch (err) {
        console.error("❌ Master Report Error:", err);
    }
}, {
    timezone: "Asia/Kolkata"
});