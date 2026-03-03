import React, { createContext, useState, useEffect, useContext } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            // Check for existing token and restore session
            const token = localStorage.getItem('adminToken');
            const storedUser = localStorage.getItem('adminUser');

            if (token && storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (err) {
            console.error("Failed to restore session:", err);
            // Clear corrupt data
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
        } finally {
            setLoading(false);
        }
    }, []);

    const login = async (username, password) => {
        try {
            const response = await client.post('/auth/login', { username, password });
            const { token, role, ...userData } = response.data;

            // STRICT ROLE ENFORCEMENT
            if (role === 'Student') {
                throw new Error('Access Denied: Students cannot access Admin Portal');
            }

            // Store minimal needed data
            const userPayload = { ...userData, role };

            localStorage.setItem('adminToken', token);
            localStorage.setItem('adminUser', JSON.stringify(userPayload));
            setUser(userPayload);

            return { success: true };
        } catch (err) {
            console.error("Login failed", err);
            return {
                success: false,
                message: err.response?.data?.message || err.message || 'Login failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {loading ? (
                <div className="flex h-screen items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading Application...</p>
                    </div>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
