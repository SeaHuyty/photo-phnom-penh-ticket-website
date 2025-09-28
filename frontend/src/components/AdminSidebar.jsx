import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const AdminSidebar = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        {
            label: "Scan QR Code",
            path: "/admin/scan",
            icon: "📱"
        },
        {
            label: "User Management",
            path: "/admin/users",
            icon: "👥"
        }
    ];

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/login');
    };

    return (
        <div className="admin-full-layout">
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <h2>Admin Panel</h2>
                </div>
                
                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <button
                            key={item.path}
                            className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <span className="sidebar-icon">{item.icon}</span>
                            <span className="sidebar-label">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <span className="sidebar-icon">🚪</span>
                        <span className="sidebar-label">Logout</span>
                    </button>
                </div>
            </aside>
            
            <main className="admin-content">
                {children}
            </main>
        </div>
    );
};

export default AdminSidebar;