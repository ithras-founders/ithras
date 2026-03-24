/**
 * Text input aligned with .app-input tokens.
 */
import React from 'react';

/**
 * @param {object} props
 */
const Input = ({ className = '', style, ...rest }) =>
  React.createElement('input', {
    className: `app-input ith-focus-ring w-full px-4 py-2.5 text-sm ${className}`.trim(),
    style: { ...style },
    ...rest,
  });

export default Input;
