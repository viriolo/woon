import React from 'react';

const Button = ({
  children,
  onClick,
  className = '',
  variant = 'primary',
  disabled = false,
  ...props
}) => {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    primary: 'bg-special-primary text-neutral-900 hover:bg-special-secondary focus:ring-special-primary',
    secondary: 'bg-neutral-700 text-neutral-100 hover:bg-neutral-600 focus:ring-neutral-500',
    outline: 'border border-neutral-600 text-neutral-300 hover:bg-neutral-800 focus:ring-neutral-500'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;