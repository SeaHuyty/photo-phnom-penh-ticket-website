import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ProtectedRoute = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch(`${BASE_URL}/admin/check-auth`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,  // Make sure token is in localStorage
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setIsAuthenticated(true); // Admin is authenticated
                } else {
                    setIsAuthenticated(false); // Admin is not authenticated
                }
            } catch (error) {
                console.error("Authentication check failed", error);
                setIsAuthenticated(false); // Handle error by marking as not authenticated
            }
        };

        checkAuth();
    }, []);

    // Show a loading state while checking auth status
    if (isAuthenticated === null) {
        return <p>Loading...</p>;
    }

    // Redirect to login if not authenticated, otherwise show the protected children
    return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;