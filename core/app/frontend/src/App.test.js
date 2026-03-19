import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App.js';

describe('App', () => {
  it('renders Login when user is null', () => {
    render(React.createElement(App));
    expect(screen.getByText(/thras/)).toBeTruthy();
  });
});
