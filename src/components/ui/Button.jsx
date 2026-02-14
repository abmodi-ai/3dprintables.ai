import React from 'react';

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }) => {
    const baseStyle = "font-bold rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 px-6 py-3 shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.2)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]";

    const variants = {
        primary: "bg-yellow-400 text-purple-900 hover:bg-yellow-300 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:transform-none",
        secondary: "bg-purple-600 text-white hover:bg-purple-500 disabled:bg-purple-300",
        danger: "bg-red-500 text-white hover:bg-red-400",
        outline: "bg-white border-4 border-purple-200 text-purple-600 hover:bg-purple-50",
        ghost: "bg-transparent text-gray-500 hover:bg-gray-100 shadow-none hover:shadow-none translate-y-0 active:translate-y-0"
    };

    return (
        <button type={type} disabled={disabled} onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
            {children}
        </button>
    );
};

export default Button;
