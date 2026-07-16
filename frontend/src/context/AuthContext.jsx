import { createContext, useContext, useState } from 'react';

// Three React tools:

// createContext — creates a "global container" that any component can access
// useContext — lets a component read from that container
// useState — stores a value that, when changed, re-renders the component

const AuthContext = createContext();

// global container called AuthContext , hold your logged-in user's data, accessible from any component

export function AuthProvider({ children }){
    const[user, setUser] = useState(
        JSON.parse(localStorage.getItem('user')) || null
    );
    // the user is read from localStorage, null means not logged in

    const login = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

// Function that runs when login is successful. Three things:

// Saves token to localStorage (so client.js interceptor can find it)
// Saves user object to localStorage (so page refresh restores the session)
// Updates user state (so the app re-renders and shows "logged in" UI immediately)

// JSON.stringify() converts the JS object to a string — localStorage can only store strings.

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };
// Removes token and user from localStorage, sets user back to null. App re-renders and shows "logged out" UI

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
        {children}
        </AuthContext.Provider>
    );
// This makes user, login, and logout available to every component inside AuthProvider. value is what gets shared — any component can read user or call login/logout.
}
export const useAuth = () => useContext(AuthContext);

// A custom hook — a shortcut. Instead of writing useContext(AuthContext) in every component, you just write useAuth(). Returns whatever is in value — so { user, login, logout }.