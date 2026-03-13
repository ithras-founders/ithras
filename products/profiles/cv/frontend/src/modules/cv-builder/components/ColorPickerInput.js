import React, { useState, useRef, useEffect } from 'react';
import htm from 'htm';
import { HexColorPicker, HslColorPicker } from 'react-colorful';

const html = htm.bind(React.createElement);

/** Check if value is a valid hex color (#RGB or #RRGGBB) */
const isValidHex = (v) => /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(v || '');

/** Hex to HSL: returns { h, s, l } with h 0-360, s/l 0-100 */
function hexToHsl(hex) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i) ||
    (hex.length === 4 && hex.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i)?.map((g, i) => i ? g + g : g));
  if (!m) return { h: 0, s: 0, l: 100 };
  let r = parseInt(m[1], 16) / 255;
  let g = parseInt(m[2], 16) / 255;
  let b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
      default: break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** HSL to Hex */
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const toHex = (n) => {
    const v = Math.round((n + m) * 255);
    return Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0');
  };
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

/** Ensure hex has # prefix and 6 chars */
function normalizeHex(v) {
  if (!v || !/^#?[A-Fa-f0-9]{3,6}$/.test(v)) return '#ffffff';
  let s = v.startsWith('#') ? v.slice(1) : v;
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  return '#' + s.toLowerCase();
}

const ColorPickerInput = ({ value = '', onChange, placeholder = 'e.g. #f5f5f5 or transparent' }) => {
  const [open, setOpen] = useState(false);
  const [pickerStyle, setPickerStyle] = useState('grid'); // 'grid' | 'circle'
  const [textMode, setTextMode] = useState(() => !isValidHex(value));
  const [textValue, setTextValue] = useState(value || '');
  const [hexInputValue, setHexInputValue] = useState(() => (value && isValidHex(value) ? normalizeHex(value) : ''));
  const [hexInputFocused, setHexInputFocused] = useState(false);
  const containerRef = useRef(null);
  const swatchRef = useRef(null);

  const isHex = isValidHex(value);
  const pickerColor = isHex ? normalizeHex(value) : '#ffffff';

  // Sync hexInputValue from value when not focused
  useEffect(() => {
    if (!hexInputFocused && value && isValidHex(value)) {
      setHexInputValue(normalizeHex(value));
    }
  }, [value, hexInputFocused]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleHexInputChange = (e) => {
    const v = e.target.value;
    setHexInputValue(v);
    // Only propagate when valid hex
    if (isValidHex(v)) onChange(normalizeHex(v));
  };

  const handleHexInputBlur = () => {
    setHexInputFocused(false);
    if (isValidHex(hexInputValue)) {
      onChange(normalizeHex(hexInputValue));
    } else {
      setHexInputValue(value && isValidHex(value) ? normalizeHex(value) : '');
    }
  };

  const handleHexChange = (hex) => {
    onChange(hex);
    setHexInputValue(hex);
    setTextMode(false);
  };

  const handleHslChange = (hsl) => {
    const hex = hslToHex(hsl.h, hsl.s, hsl.l);
    onChange(hex);
    setHexInputValue(hex);
    setTextMode(false);
  };

  const handleTextChange = (e) => {
    const v = e.target.value;
    setTextValue(v);
    onChange(v || undefined);
    if (isValidHex(v)) setTextMode(false);
  };

  const handleTextBlur = () => {
    if (!textValue.trim()) onChange(undefined);
    else setTextValue(value || '');
  };

  if (textMode) {
    return html`
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value=${textValue}
          onChange=${handleTextChange}
          onBlur=${handleTextBlur}
          onFocus=${() => setTextMode(true)}
          className="flex-1 px-3 py-2 border rounded"
          placeholder=${placeholder}
        />
        <button
          type="button"
          onClick=${() => { setTextMode(false); setTextValue(''); onChange('#f5f5f5'); }}
          className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800 border rounded"
        >
          Use picker
        </button>
      </div>
    `;
  }

  const popoverStyle = (() => {
    if (!open || !swatchRef.current || typeof window === 'undefined') return { top: 0, left: 0 };
    const rect = swatchRef.current.getBoundingClientRect();
    const popoverWidth = Math.min(280, window.innerWidth - 24);
    const margin = 8;
    const spaceRight = window.innerWidth - rect.right;
    const spaceLeft = rect.left;
    let left = rect.left;
    if (spaceRight < popoverWidth + margin) {
      left = Math.max(margin, window.innerWidth - popoverWidth - margin);
    } else if (spaceLeft < margin) {
      left = margin;
    }
    return { top: rect.bottom + 4, left, width: popoverWidth };
  })();

  return html`
    <div className="relative flex gap-2 items-center" ref=${containerRef}>
      <div
        ref=${swatchRef}
        className="w-10 h-10 min-w-[40px] min-h-[40px] rounded border border-gray-300 flex-shrink-0 cursor-pointer touch-manipulation"
        style=${{ backgroundColor: isHex ? pickerColor : (value || 'transparent') }}
        onClick=${() => setOpen(!open)}
        title="Click to open color picker"
      />
      <div className="flex-1 flex gap-1 items-center min-w-0">
        <input
          type="text"
          value=${hexInputValue}
          onChange=${handleHexInputChange}
          onFocus=${() => setHexInputFocused(true)}
          onBlur=${handleHexInputBlur}
          placeholder="#ffffff"
          className="flex-1 min-w-0 px-2 py-1.5 border border-slate-200 rounded text-sm font-mono"
        />
        <button
          type="button"
          onClick=${() => { setTextValue(value || ''); setTextMode(true); }}
          className="text-xs text-slate-500 hover:text-slate-700 px-2 py-2 touch-manipulation"
          title="Enter custom value (e.g. transparent)"
        >
          Custom
        </button>
      </div>
      ${open ? html`
        <div
          className="fixed z-[200] p-3 bg-white border border-gray-200 rounded-lg shadow-xl min-w-[260px] max-w-[100vw]"
          style=${{ ...popoverStyle, position: 'fixed' }}
        >
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick=${() => setPickerStyle('grid')}
              className=${'px-3 py-2 text-xs rounded touch-manipulation min-h-[36px] ' + (pickerStyle === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100')}
            >
              Grid
            </button>
            <button
              type="button"
              onClick=${() => setPickerStyle('circle')}
              className=${'px-3 py-2 text-xs rounded touch-manipulation min-h-[36px] ' + (pickerStyle === 'circle' ? 'bg-blue-600 text-white' : 'bg-gray-100')}
            >
              Circle
            </button>
          </div>
          <div className="mb-2 react-colorful-wrapper" style=${{ minHeight: '180px', touchAction: 'none' }}>
            ${pickerStyle === 'grid'
              ? html`<${HslColorPicker} color=${hexToHsl(pickerColor)} onChange=${handleHslChange} style=${{ width: '100%', minWidth: '220px', height: '180px' }} className="react-colorful" />`
              : html`<${HexColorPicker} color=${pickerColor} onChange=${handleHexChange} style=${{ width: '100%', minWidth: '220px', height: '180px' }} className="react-colorful" />`
            }
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-xs text-slate-600">Lightness:</label>
            <input
              type="range"
              min="0"
              max="100"
              value=${hexToHsl(pickerColor).l}
              onChange=${(e) => {
                const hsl = hexToHsl(pickerColor);
                hsl.l = parseInt(e.target.value, 10);
                handleHslChange(hsl);
              }}
              className="flex-1 min-h-[28px] touch-manipulation"
            />
          </div>
        </div>
      ` : ''}
    </div>
  `;
};

export default ColorPickerInput;
