import React from "react";
import { Link } from "react-router-dom";
import { 
    FaChartLine, FaMobileAlt, FaPrint, FaCheckCircle, FaWhatsapp 
} from "react-icons/fa";


const LandingPage = () => {
    // Replace with your actual WhatsApp Sales Number
    const WHATSAPP_LINK = "https://wa.me/919876543210?text=I%20want%20to%20start%20my%20SmartMenu%20trial";

    return (
        <div className="min-h-screen bg-[#080808] text-white font-sans selection:bg-[#FF9933] selection:text-black">
            
            {/* --- 1. NAVIGATION --- */}
            <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-[#FF9933] rounded-xl flex items-center justify-center text-black font-black text-xl">S</div>
                    <span className="text-xl font-black tracking-tighter uppercase">SmartMenu<span className="text-[#FF9933]">Cloud</span></span>
                </div>
                <div className="hidden md:flex gap-8 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <a href="#features" className="hover:text-white transition">Features</a>
                    <a href="#pricing" className="hover:text-white transition">Pricing</a>
                    <a href="#support" className="hover:text-white transition">Support</a>
                </div>
                {/* LOGIN BUTTON: Updated to point to dynamic login check */}
                <Link to="/login">
                    <button className="bg-white/5 border border-white/10 px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                        Partner Login
                    </button>
                </Link>
            </nav>

            {/* --- 2. HERO SECTION --- */}
            <header className="py-24 px-6 text-center max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-full mb-8">
                    <span className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></span>
                    <span className="text-[10px] font-black text-[#FF9933] uppercase tracking-[3px]">Beta 2.8 Now Live</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-[0.9]">
                    Run your restaurant <br />
                    <span className="text-[#FF9933]">without the chaos.</span>
                </h1>
                <p className="text-gray-400 text-lg md:text-xl font-medium mb-12 leading-relaxed">
                    Digital QR Menus, Real-time Kitchen Displays, and Automated Profit Analytics. 
                    Everything you need to scale from one table to a hundred.
                </p>
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                    {/* CHANGED: Link to WhatsApp instead of dead Register page */}
                    <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                        <button className="bg-[#FF9933] text-black px-10 py-5 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-orange-500/20 hover:scale-105 transition-transform flex items-center justify-center gap-2">
                            <FaWhatsapp size={18}/> Get Access Now
                        </button>
                    </a>
                    <a href="#features">
                        <button className="bg-white/5 border border-white/10 text-white px-10 py-5 rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-white/10 transition">
                            Explore Features
                        </button>
                    </a>
                </div>
            </header>

            {/* --- 3. FEATURES SECTION --- */}
            <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Owners */}
                    <div className="bg-[#111] p-10 rounded-[45px] border border-white/5 hover:border-[#FF9933]/30 transition-all group">
                        <FaChartLine className="text-4xl text-[#FF9933] mb-6 group-hover:scale-110 transition-transform" />
                        <h3 className="text-2xl font-black mb-4">For Owners</h3>
                        <ul className="space-y-3 text-gray-500 text-sm font-bold">
                            <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500" /> Real-time Profit/Loss</li>
                            <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500" /> GST Ready Invoices</li>
                            <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500" /> Staff Management</li>
                        </ul>
                    </div>

                    {/* Kitchen */}
                    <div className="bg-[#111] p-10 rounded-[45px] border border-white/5 hover:border-blue-500/30 transition-all group">
                        <FaPrint className="text-4xl text-blue-500 mb-6 group-hover:scale-110 transition-transform" />
                        <h3 className="text-2xl font-black mb-4">For Kitchens</h3>
                        <ul className="space-y-3 text-gray-500 text-sm font-bold">
                            <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500" /> Digital KOT Receipts</li>
                            <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500" /> Instant Stock Toggle</li>
                            <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500" /> Preparation Timer</li>
                        </ul>
                    </div>

                    {/* Diners */}
                    <div className="bg-[#111] p-10 rounded-[45px] border border-white/5 hover:border-purple-500/30 transition-all group">
                        <FaMobileAlt className="text-4xl text-purple-500 mb-6 group-hover:scale-110 transition-transform" />
                        <h3 className="text-2xl font-black mb-4">For Diners</h3>
                        <ul className="space-y-3 text-gray-500 text-sm font-bold">
                            <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500" /> Scan-to-Order QR</li>
                            <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500" /> Instant UPI Payments</li>
                            <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500" /> Live Order Tracking</li>
                        </ul>
                    </div>

                </div>
            </section>

            {/* --- 5. TRUST BANNER --- */}
            <section className="bg-[#FF9933] py-20 px-6 text-black text-center">
                <h2 className="text-4xl font-black mb-4 tracking-tighter uppercase">Ready to upgrade your shop?</h2>
                <p className="text-black font-bold text-lg mb-10 max-w-2xl mx-auto opacity-80">
                    Join the 4-month testing phase today. No credit card required. Cancel anytime.
                </p>
                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                    <button className="bg-black text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-2 mx-auto">
                        <FaWhatsapp size={18}/> Contact Sales to Join
                    </button>
                </a>
            </section>

            {/* --- 6. FOOTER --- */}
            <footer className="py-20 px-8 max-w-7xl mx-auto border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10" id="support">
                <div>
                    <span className="text-xl font-black tracking-tighter uppercase">SmartMenu<span className="text-[#FF9933]">Cloud</span></span>
                    <p className="text-gray-600 text-xs mt-2 font-bold uppercase tracking-widest">Built by Bhoompally Kalyan Reddy</p>
                </div>
                
                <div className="flex gap-6">
                    <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                        <button className="text-gray-400 hover:text-white transition text-2xl"><FaWhatsapp /></button>
                    </a>
                    <button className="bg-white/5 p-4 rounded-xl text-xs font-black uppercase tracking-widest border border-white/10 hover:bg-[#FF9933] hover:text-black transition-all">
                        Support Center
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;