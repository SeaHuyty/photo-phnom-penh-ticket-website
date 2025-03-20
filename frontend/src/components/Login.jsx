import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault(); // Prevent form reload
    
        try {
            const response = await fetch("http://localhost:3000/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
    
            if (!response.ok) throw new Error("Login failed");
    
            const data = await response.json();
            localStorage.setItem("token", data.token);
            navigate("/admin"); // Redirect on success
        } catch (error) {
            console.error("Login error:", error);
        }
    };

    return (
        <div>
            <h2>Admin Login</h2>
            <form onSubmit={handleLogin}>
                <div>
                    <label>Username</label>
                    <input 
                        type="username" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                    />
                </div>
                <div>
                    <label>Password</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                    />
                </div>
                <button type="submit">Login</button>
                {error && <p>{error}</p>}
            </form>
        </div>
    );
};

export default Login;
