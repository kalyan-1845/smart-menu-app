import React, { useState } from "react";
import { FaStore, FaUtensils, FaQrcode, FaCheck, FaArrowRight, FaArrowLeft, FaMagic } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_BASE = "http://localhost:8080/api";

const SetupWizard = ({ ownerId, token, onComplete }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [data, setData] = useState({
        cuisineType: "",
        address: "",
        categories: ["Starters", "Main Course", "Beverages"], // Defaults
        menuActive: true
    });

    const steps = [
        { num: 1, title: "Identity", icon: FaStore },
        { num: 2, title: "Cuisine", icon: FaUtensils },
        { num: 3, title: "Launch", icon: FaQrcode },
    ];

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const toggleCategory = (cat) => {
        if (data.categories.includes(cat)) {
            setData({ ...data, categories: data.categories.filter(c => c !== cat) });
        } else {
            setData({ ...data, categories: [...data.categories, cat] });
        }
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            // 1. Update Owner Profile
            await axios.put(`${API_BASE}/superadmin/client/${ownerId}`, {
                cuisineType: data.cuisineType,
                address: data.address,
                isSetupComplete: true // You might need to add this field to your Schema later
            }, { headers: { Authorization: `Bearer ${token}` } });

            // 2. Add Default Categories (Optional: You can create dummy dishes here)
            // For now, we just simulate success
            
            toast.success("Setup Complete! Welcome to Kovixa.");
            if (onComplete) onComplete();
        } catch (error) {
            console.error(error);
            toast.error("Setup failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.card}>
                
                {/* PROGRESS HEADER */}
                <div style={styles.header}>
                    <div style={styles.logoBadge}><FaMagic /></div>
                    <div>
                        <h2 style={styles.title}>Welcome to Kovixa</h2>
                        <p style={styles.sub}>Let's set up your digital restaurant in 3 steps.</p>
                    </div>
                </div>

                <div style={styles.progressTrack}>
                    {steps.map((s, i) => (
                        <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <div style={{
                                ...styles.stepDot,
                                background: step >= s.num ? '#f97316' : '#333',
                                color: step >= s.num ? 'white' : '#666',
                                border: step === s.num ? '1px solid white' : 'none'
                            }}>
                                {step > s.num ? <FaCheck size={10}/> : s.num}
                            </div>
                            {i < steps.length - 1 && (
                                <div style={{
                                    ...styles.line,
                                    background: step > s.num ? '#f97316' : '#333'
                                }} />
                            )}
                        </div>
                    ))}
                </div>

                {/* CONTENT AREA */}
                <div style={styles.content}>
                    
                    {/* STEP 1: IDENTITY */}
                    {step === 1 && (
                        <div className="slide-in">
                            <h3 style={styles.stepTitle}>Restaurant Details</h3>
                            <label style={styles.label}>Cuisine Type</label>
                            <input 
                                style={styles.input} 
                                placeholder="e.g. South Indian, Multi-Cuisine, Cafe"
                                value={data.cuisineType}
                                onChange={e => setData({...data, cuisineType: e.target.value})}
                            />
                            <label style={styles.label}>City / Location</label>
                            <input 
                                style={styles.input} 
                                placeholder="e.g. Hyderabad, Banjara Hills"
                                value={data.address}
                                onChange={e => setData({...data, address: e.target.value})}
                            />
                        </div>
                    )}

                    {/* STEP 2: CATEGORIES */}
                    {step === 2 && (
                        <div className="slide-in">
                            <h3 style={styles.stepTitle}>Select Menu Categories</h3>
                            <p style={styles.desc}>Tap to select what you serve. You can change this later.</p>
                            <div style={styles.tagGrid}>
                                {["Starters", "Biryani", "Chinese", "Tandoori", "Burgers", "Pizza", "Desserts", "Beverages", "Thali"].map(cat => (
                                    <button 
                                        key={cat}
                                        onClick={() => toggleCategory(cat)}
                                        style={{
                                            ...styles.tag,
                                            background: data.categories.includes(cat) ? '#f97316' : '#1e293b',
                                            color: data.categories.includes(cat) ? 'white' : '#94a3b8',
                                            borderColor: data.categories.includes(cat) ? '#f97316' : '#334155'
                                        }}
                                    >
                                        {cat} {data.categories.includes(cat) && <FaCheck size={10} style={{marginLeft:5}}/>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: PREVIEW */}
                    {step === 3 && (
                        <div className="slide-in" style={{textAlign:'center'}}>
                            <div style={styles.qrPlaceholder}>
                                <FaQrcode size={80} color="white" />
                                <div style={styles.scanText}>SCAN TO ORDER</div>
                            </div>
                            <h3 style={styles.stepTitle}>You are Ready!</h3>
                            <p style={styles.desc}>Your digital menu link has been generated. Click finish to access your dashboard and start adding dishes.</p>
                        </div>
                    )}

                </div>

                {/* FOOTER ACTIONS */}
                <div style={styles.footer}>
                    {step > 1 ? (
                        <button onClick={handleBack} style={styles.backBtn}><FaArrowLeft /> Back</button>
                    ) : <div></div>}

                    {step < 3 ? (
                        <button onClick={handleNext} style={styles.nextBtn}>Next Step <FaArrowRight /></button>
                    ) : (
                        <button onClick={handleFinish} disabled={loading} style={styles.finishBtn}>
                            {loading ? "Launching..." : "LAUNCH DASHBOARD 🚀"}
                        </button>
                    )}
                </div>

            </div>
            <style>{`
                .slide-in { animation: slideIn 0.4s ease-out; }
                @keyframes slideIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
            `}</style>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed', inset: 0,
        background: 'rgba(2, 6, 23, 0.95)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: 20
    },
    card: {
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '24px',
        width: '100%', maxWidth: '500px',
        padding: '30px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column',
        minHeight: '550px'
    },
    header: { display: 'flex', gap: 15, marginBottom: 30, alignItems: 'center' },
    logoBadge: {
        width: 45, height: 45, background: 'linear-gradient(135deg, #f97316, #ea580c)',
        borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20
    },
    title: { margin: 0, color: 'white', fontSize: 22, fontWeight: '800' },
    sub: { margin: 0, color: '#94a3b8', fontSize: 13 },
    
    progressTrack: { display: 'flex', alignItems: 'center', marginBottom: 40, padding: '0 10px' },
    stepDot: { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', transition: '0.3s' },
    line: { flex: 1, height: 2, margin: '0 10px', borderRadius: 2, transition: '0.3s' },

    content: { flex: 1 },
    stepTitle: { color: 'white', fontSize: 18, marginBottom: 20 },
    label: { display: 'block', color: '#cbd5e1', fontSize: 12, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' },
    input: { width: '100%', background: '#1e293b', border: '1px solid #334155', padding: 14, borderRadius: 12, color: 'white', fontSize: 15, marginBottom: 20, outline: 'none' },
    desc: { color: '#94a3b8', fontSize: 14, marginBottom: 20, lineHeight: 1.5 },
    
    tagGrid: { display: 'flex', flexWrap: 'wrap', gap: 10 },
    tag: { padding: '10px 18px', borderRadius: 20, border: '1px solid', fontSize: 13, fontWeight: '600', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center' },

    qrPlaceholder: { background: 'linear-gradient(135deg, #3b82f6, #2563eb)', width: 150, height: 150, borderRadius: 20, margin: '0 auto 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)' },
    scanText: { color: 'white', fontSize: 10, fontWeight: 'bold', marginTop: 10, letterSpacing: 2 },

    footer: { display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1e293b', paddingTop: 20, marginTop: 20 },
    backBtn: { background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 },
    nextBtn: { background: '#334155', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },
    finishBtn: { background: '#f97316', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 15px rgba(249, 115, 22, 0.4)' }
};

export default SetupWizard;