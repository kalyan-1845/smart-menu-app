import mongoose from 'mongoose';

const expenseSchema = mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, enum: ['Raw Materials', 'Salaries', 'Rent', 'Utilities', 'Marketing', 'Other'], default: 'Other' },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;