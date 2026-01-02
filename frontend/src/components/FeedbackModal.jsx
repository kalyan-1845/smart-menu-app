import React, { useState } from "react";
import { FaStar, FaTimes, FaPaperPlane } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-hot-toast";

const FeedbackModal = ({ dish, onClose }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState("");

    // ✅ SCOPING FIX: Defined inside the function to ensure accessibility on Netlify
    const styles = {
        overlay: { 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.9)', 
            zIndex: 3000, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '20px', 
            backdropFilter: 'blur(10px)' 
        },
        card: { 
            background: '#0a0a0a', 
            padding: '30px', 
            borderRadius: '30px', 
            width: '100%', 
            maxWidth: '400px', 
            textAlign: 'center', 
            border: '1px solid #222',
            position: 'relative' // Essential for absolute positioning of the close button
        },
        title: { fontSize: '20px', fontWeight: '900', marginBottom: '20px', color: '#fff' },
        stars: { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '25px' },
        input: { 
            width: '100%', 
            background: '#000', 
            border: '1px solid #222', 
            borderRadius: '15px', 
            padding: '15px', 
            color: 'white', 
            minHeight: '100px', 
            marginBottom: '20px', 
            outline: 'none',
            fontSize: '14px'
        },
        submitBtn: { 
            width: '100%', 
            background: '#f97316', 
            color: 'white', 
            border: 'none', 
            padding: '18px', 
            borderRadius: '15px', 
            fontWeight: '900', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '10px',
            cursor: 'pointer'
        },
        close: { 
            position: 'absolute', 
            top: '20px', 
            right: '20px', 
            background: 'none', 
            border: 'none', 
            color: '#555', 
            fontSize: '20px',
            cursor: 'pointer'
        }
    };

    const handleSubmit = async () => {
        if (rating === 0) return toast.error("Please select stars!");
        try {
            await axios.post(`https://smart-menu-backend-5ge7.onrender.com/api/dishes/rate/${dish._id}`, {
                rating,
                comment
            });
            toast.success("Thank you for the feedback!");
            onClose();
        } catch (e) { 
            toast.error("Submission failed"); 
            console.error("Feedback Submission Error:", e);
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.card}>
                <button onClick={onClose} style={styles.close} aria-label="Close modal">
                    <FaTimes />
                </button>
                <h2 style={styles.title}>Rate the {dish?.name}</h2>
                <div style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar 
                            key={star}
                            size={35}
                            color={(hover || rating) >= star ? "#f97316" : "#333"}
                            onMouseEnter={() => setHover(star)}
                            onMouseLeave={() => setHover(0)}
                            onClick={() => setRating(star)}
                            style={{ cursor: 'pointer', transition: '0.2s transform', transform: hover === star ? 'scale(1.1)' : 'scale(1)' }}
                        />
                    ))}
                </div>
                <textarea 
                    placeholder="Tell us what you liked..." 
                    style={styles.input} 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                />
                <button onClick={handleSubmit} style={styles.submitBtn}>
                    SUBMIT REVIEW <FaPaperPlane />
                </button>
            </div>
        </div>
    );
};

export default FeedbackModal;