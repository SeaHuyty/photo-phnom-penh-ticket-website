import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault(); // Prevent form reload
        try {
            const response = await fetch(`${BASE_URL}/admin/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) throw new Error("Login failed");
    
            const data = await response.json();
            localStorage.setItem("adminToken", data.token);
            navigate("/admin"); // Redirect on success
        } catch (error) {
            console.error("Login error:", error);
        }
    };

    return (
        <div className="h-[65vh] w-full">
            <h2 className="text-2xl text-bold text-white text-center">Admin Login</h2>
            <div className="mt-12 flex flex-col justify-center items-center">
                <form onSubmit={handleLogin} className="p-5 rounded-lg bg-white w-[70%]">
                    <div className="flex flex-col items-center mt-5 w-[100%]">
                        <label>Username</label>
                        <input 
                            placeholder="Enter username"
                            type="username" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            className="bg-[#e4e4e4] p-2 rounded-lg w-[50%]"
                            />
                    </div>
                    <div className="flex flex-col items-center mt-5 w-[100%]">
                        <label className="">Password</label>
                        <input 
                            placeholder="Enter password"
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="bg-[#e4e4e4] p-2 rounded-lg w-[50%]"
                        />
                    </div>
                    <div className="flex flex-col items-center w-[100%]">
                        <button className="text-white mt-5 rounded-lg bg-[#BC2649] px-6 py-2 hover:bg-[#BC2649]/80 cursor-pointer transform duration-200 hover:scale-103" type="submit">Login</button>
                    </div>
                    {error && <p>{error}</p>}
                </form>
            </div>
        </div>
    );
};

export default Login;
