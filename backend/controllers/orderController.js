import { FaHistory, FaChartBar, FaTable } from "react-icons/fa";

// ... inside your AdminPanel component state
const [historyData, setHistoryData] = useState([]);
const [analytics, setAnalytics] = useState([]);

const fetchHistory = async () => {
    const res = await axios.get("https://smart-menu-backend-5ge7.onrender.com/api/orders/history", config);
    setHistoryData(res.data.history);
    setAnalytics(res.data.analytics);
};

// --- RENDER SECTION ---
<div className="history-tab">
    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FaChartBar className="text-orange-500" /> Service Analytics
    </h2>
    
    {/* Analytics Table */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {analytics.map((item) => (
            <div key={item._id} className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                <p className="text-gray-400 text-sm">Table {item._id}</p>
                <p className="text-2xl font-black text-white">{item.totalCalls} Requests</p>
            </div>
        ))}
    </div>

    {/* Order History List */}
    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FaHistory className="text-blue-500" /> Past Orders
    </h2>
    <div className="space-y-4">
        {historyData.map((order) => (
            <div key={order._id} className="bg-gray-900 p-6 rounded-2xl border border-gray-800 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-white">Table {order.tableNumber}</h3>
                    <p className="text-gray-500 text-xs">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <p className="text-xl font-black text-green-500">₹{order.totalAmount}</p>
                    <span className="text-[10px] bg-gray-800 px-2 py-1 rounded uppercase font-bold text-gray-400">
                        {order.paymentMethod}
                    </span>
                </div>
            </div>
        ))}
    </div>
</div>