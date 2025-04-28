import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
            } catch (e) {
                // If parsing fails (e.g., userData was just "admin"), wrap it into an object
                setUser({ role: userData });
            }
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await axios.post('/api/users/login', { Username: username, Password: password });
            const { token, user } = response.data;

            // If 'user' is a string (like "admin"), wrap it as an object
            const userObject = typeof user === 'string' ? { role: user } : user;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userObject));

            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(userObject);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.error || 'Login failed'
            };
        }
    };

    const register = async (username, email, password) => {
        try {
            const response = await axios.post('/api/users/register', {
                Username: username,
                Email: email,
                Password: password
            });

            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.error || 'Registration failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    const isAdmin = () => {
        return user?.role === 'admin';
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            register,
            logout,
            isAdmin,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
};
