"use client";

import { useState, useEffect } from 'react';

const ThemeToggle = () => {
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme');
            const isDark = savedTheme === 'dark';
            setTimeout(() => {
                setDarkMode(isDark);
            }, 0);
            if (isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, []);

    const toggleTheme = () => {
        if (typeof window !== 'undefined') {
            if (darkMode) {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            } else {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            }
            setDarkMode(!darkMode);
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 focus:outline-none"
        >
            {darkMode ? (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-800 dark:text-gray-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h1M3 12H2m15.325-4.275l-.707-.707M6.382 17.618l-.707-.707M18.364 18.364l-.707-.707M6.343 6.343l-.707-.707"
                    />
                </svg>
            ) : (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-800 dark:text-gray-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                </svg>
            )}
        </button>
    );
};

export default ThemeToggle;