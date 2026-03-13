import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App.js';

// Mock product registry to avoid module loading
vi.mock('./productRegistry.js', () => ({
  productRegistry: {},
}));

describe('App', () => {
  it('renders Login when user is null', () => {
    render(React.createElement(App));
    expect(screen.getAllByText(/Ithras/i).length).toBeGreaterThan(0);
  });
});
