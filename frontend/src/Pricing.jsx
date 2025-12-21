import React from "react";
import { FaCheck, FaLock, FaClock } from "react-icons/fa";

const Pricing = () => {
    return (
        <section className="py-24 px-6 bg-[#080808]">
            <div className="max-w-5xl mx-auto text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">
                    Simple Pricing for <span className="text-[#FF9933]">Modern Shops.</span>
                </h2>
                <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-full mt-4">
                    <FaClock className="text-[#FF9933] text-xs" />
                    <span className="text-[10px] font-black text-[#FF9933] uppercase tracking-widest">
                        Beta Phase: Free for first 4 months
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                
                {/* 🆓 STARTER PLAN (The Beta Plan) */}
                <div className="bg-[#111] p-10 rounded-[45px] border border-white/5 relative overflow-hidden group">
                    <div className="mb-8">
                        <h3 className="text-xl font-black mb-2 uppercase">Starter Beta</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black">₹0</span>
                            <span className="text-gray-500 font-bold">/lifetime</span>
                        </div>
                    </div>
                    
                    <ul className="space-y-4 mb-12">
                        <li className="flex items-center gap-3 text-sm text-gray-400 font-bold"><FaCheck className="text-green-500" /> Digital QR Menu</li>
                        <li className="flex items-center gap-3 text-sm text-gray-400 font-bold"><FaCheck className="text-green-500" /> Manual Stock Control</li>
                        <li className="flex items-center gap-3 text-sm text-gray-400 font-bold"><FaCheck className="text-green-500" /> WhatsApp Orders</li>
                    </ul>

                    <button className="w-full bg-white/5 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10">
                        Current Plan
                    </button>
                </div>

                {/* 💎 PRO PLAN (Upcoming Post-Launch) */}
                <div className="bg-[#111] p-10 rounded-[45px] border-2 border-[#FF9933] relative overflow-hidden shadow-2xl shadow-orange-500/10">
                    <div className="absolute top-0 right-0 bg-[#FF9933] text-black text-[9px] font-black px-6 py-2 uppercase tracking-widest -rotate-45 translate-x-6 translate-y-4">
                        Coming Soon
                    </div>
                    
                    <div className="mb-8">
                        <h3 className="text-xl font-black mb-2 uppercase text-[#FF9933]">Enterprise Pro</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black">₹999</span>
                            <span className="text-gray-500 font-bold">/mo</span>
                        </div>
                        <p className="text-[9px] text-gray-500 mt-2 font-black uppercase tracking-widest italic">Starting after 4 months of Beta</p>
                    </div>
                    
                    <ul className="space-y-4 mb-12">
                        <li className="flex items-center gap-3 text-sm font-bold"><FaCheck className="text-[#FF9933]" /> Live Kitchen Display (KOT)</li>
                        <li className="flex items-center gap-3 text-sm font-bold"><FaCheck className="text-[#FF9933]" /> Automatic Inventory Sync</li>
                        <li className="flex items-center gap-3 text-sm font-bold"><FaCheck className="text-[#FF9933]" /> Profit & Loss Analytics</li>
                        <li className="flex items-center gap-3 text-sm font-bold"><FaCheck className="text-[#FF9933]" /> GST/Tax Invoice PDFs</li>
                        <li className="flex items-center gap-3 text-sm font-bold"><FaCheck className="text-[#FF9933]" /> Unlimited Staff Logins</li>
                    </ul>

                    <button className="w-full bg-[#FF9933] text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-400 transition transform hover:scale-105">
                        Reserve Early Access
                    </button>
                </div>

            </div>

            <p className="text-center text-gray-600 text-[10px] font-bold mt-12 uppercase tracking-[3px]">
                * Beta users get 50% discount on Pro after 4 months
            </p>
        </section>
    );
};

export default Pricing;