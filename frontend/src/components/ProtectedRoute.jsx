import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/admin/check-auth', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,  // Make sure token is in localStorage
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log(data);
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