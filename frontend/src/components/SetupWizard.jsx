import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { 
    FaCheckCircle, FaCircle, FaUtensils, 
    FaBell, FaRocket 
} from "react-icons/fa";

const SetupWizard = ({ dishesCount, pushEnabled }) => {
    // 1. Define the v2.8 steps (Removed UPI)
    const steps = [
        { 
            id: 1, 
            label: "Add your first 3 dishes", 
            done: dishesCount >= 3, 
            icon: <FaUtensils />, 
            hint: "Go to the 'Menu' tab to add your food items." 
        },
        { 
            id: 2, 
            label: "Enable Live Alerts", 
            done: pushEnabled, 
            icon: <FaBell />, 
            hint: "Enable notifications in Settings to hear order alerts." 
        }
    ];

    // 2. Calculate progress
    const completedCount = steps.filter(s => s.done).length;
    const progressPercent = Math.round((completedCount / steps.length) * 100);

    // 3. Trigger Confetti when 100% complete
    useEffect(() => {
        if (completedCount === steps.length) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FF9933', '#ffffff', '#00ff00']
            });
        }
    }, [completedCount, steps.length]);

    // 4. Success Banner
    if (completedCount === steps.length) {
        return (
            <div className="bg-green-500/10 border-2 border-green-500/20 p-8 rounded-[40px] mb-10 flex items-center justify-between shadow-2xl animate-in zoom-in duration-500">
                <div>
                    <h2 className="text-2xl font-black text-green-500 uppercase tracking-tighter">System Live! 🎉</h2>
                    <p className="text-sm text-gray-400 font-bold uppercase mt-1">Orders and notifications are fully operational.</p>
                </div>
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                    <FaCheckCircle className="text-white text-3xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#111] border border-gray-800 rounded-[45px] p-10 mb-10 shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#FF9933]/5 blur-[100px] rounded-full"></div>

            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <FaRocket className="text-[#FF9933]" /> Setup Progress
                    </h2>
                    <p className="text-gray-500 text-[10px] font-black tracking-[4px] mt-2">Complete these steps to go live</p>
                </div>
                <div className="text-right">
                    <span className="text-4xl font-black text-[#FF9933]">{progressPercent}%</span>
                    <p className="text-[10px] font-black text-gray-600 uppercase">Ready</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-900 h-2 rounded-full mb-10 overflow-hidden border border-gray-800">
                <div 
                    className="bg-[#FF9933] h-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(255,153,51,0.4)]" 
                    style={{ width: `${progressPercent}%` }}
                ></div>
            </div>

            {/* Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {steps.map((step) => (
                    <div 
                        key={step.id} 
                        className={`p-6 rounded-[30px] border transition-all duration-500 ${
                            step.done 
                            ? 'bg-green-500/5 border-green-500/10 opacity-60' 
                            : 'bg-white/5 border-white/5 hover:border-[#FF9933]/30'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`text-2xl ${step.done ? 'text-green-500' : 'text-gray-600'}`}>
                                {step.icon}
                            </div>
                            {step.done ? (
                                <FaCheckCircle className="text-green-500 text-xl" />
                            ) : (
                                <FaCircle className="text-gray-800 text-xl" />
                            )}
                        </div>
                        <p className={`font-black text-xs uppercase tracking-tight ${step.done ? 'text-gray-500' : 'text-white'}`}>
                            {step.label}
                        </p>
                        {!step.done && <p className="text-[9px] text-gray-500 mt-2 font-bold leading-relaxed">{step.hint}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SetupWizard;