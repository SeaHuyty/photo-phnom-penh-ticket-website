import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const AdminSidebar = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        {
            label: "Scan QR Code",
            path: "/admin/scan"
        },
        {
            label: "Ticket Management",
            path: "/admin/users"
        },
        {
            label: "Attendance Check",
            path: "/admin/attendance"
        }
    ];

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/login');
    };

    return (
        <div className="flex min-h-[100vh] w-[100vw]">
            <aside className="admin-sidebar w-[280px] bg-[#BC2649] flex flex-col shadow-lg fixed h-[100vh] left-0 top-0">
                <div className="px-6 py-4 border-b border-white/20">
                    <h2 className="text-white font-semibold text-2xl text-center">Admin Panel</h2>
                </div>
                
                <nav className="flex-1 px-4 py-4 space-y-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.path}
                            className={`w-full flex items-center px-4 py-4 text-white cursor-pointer text-left text-1xl mb-2 relative hover:bg-white/10 transition-all duration-200 hover:pl-2 sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-6 border-t-1 border-white/20">
                    <button className="w-full flex items-center px-4 py-2 bg-none text-white border-2 border-white/20 rounded-lg cursor-pointer rounded-lg hover:bg-white/10 transition-all duration-200" onClick={handleLogout}>
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>
            
            <main className="admin-content flex-1 ml-[280px] bg-[#F9F9F9] min-h-[100vh] p-10">
                {children}
            </main>
        </div>
    );
};

export default AdminSidebar;