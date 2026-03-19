import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const Button = ({ variant = 'primary', type = 'button', children, onClick, className = '', disabled = false, ...props }) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-xl px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClass = variant === 'primary' ? 'bg-[#0C6DFD] hover:bg-[#0A5AD4] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900';
  return html`<button type=${type} disabled=${disabled} onClick=${onClick} className="${base} ${variantClass} ${className}" ...${props}>${children}</button>`;
};

export default Button;
