import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import IthrasLogo, { IthrasIcon } from './IthrasLogo.js';

describe('IthrasLogo', () => {
  it('renders the wordmark text', () => {
    render(React.createElement(IthrasLogo));
    expect(screen.getByText('thras')).toBeTruthy();
  });

  it('renders dotless-i character', () => {
    render(React.createElement(IthrasLogo));
    expect(screen.getByText('ı')).toBeTruthy();
  });

  it('applies size class for sm', () => {
    const { container } = render(React.createElement(IthrasLogo, { size: 'sm' }));
    expect(container.querySelector('.text-lg')).toBeTruthy();
  });

  it('applies size class for lg', () => {
    const { container } = render(React.createElement(IthrasLogo, { size: 'lg' }));
    expect(container.querySelector('.text-4xl')).toBeTruthy();
  });

  it('applies light theme by default', () => {
    const { container } = render(React.createElement(IthrasLogo));
    expect(container.querySelector('.text-white')).toBeTruthy();
  });

  it('applies dark theme when specified', () => {
    const { container } = render(React.createElement(IthrasLogo, { theme: 'dark' }));
    const outer = container.firstChild;
    expect(outer.className).toContain('app-text-primary');
  });

  it('renders golden tittle with correct color', () => {
    const { container } = render(React.createElement(IthrasLogo));
    const tittle = container.querySelector('[style*="background"]');
    expect(tittle).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(React.createElement(IthrasLogo, { className: 'my-custom' }));
    expect(container.querySelector('.my-custom')).toBeTruthy();
  });
});

describe('IthrasIcon', () => {
  it('renders the dotless-i', () => {
    render(React.createElement(IthrasIcon));
    expect(screen.getByText('ı')).toBeTruthy();
  });

  it('applies specified size via inline style', () => {
    const { container } = render(React.createElement(IthrasIcon, { size: '48px' }));
    const outer = container.firstChild;
    expect(outer.style.width).toBe('48px');
    expect(outer.style.height).toBe('48px');
  });

  it('defaults to dark theme', () => {
    const { container } = render(React.createElement(IthrasIcon));
    const outer = container.firstChild;
    expect(outer.className).toContain('app-text-primary');
  });

  it('supports light theme', () => {
    const { container } = render(React.createElement(IthrasIcon, { theme: 'light' }));
    expect(container.querySelector('.text-white')).toBeTruthy();
  });
});
