import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const AutoVariables = ({ user, template }) => {
  const config = template.config || {};
  const autoVariables = config.autoVariables || [];

  if (autoVariables.length === 0) {
    return null;
  }

  const getVariableValue = (varName) => {
    switch (varName) {
      case 'name':
        return user.name || 'N/A';
      case 'email':
        return user.email || 'N/A';
      case 'roll_number':
        return user.roll_number || user.id || 'N/A';
      case 'college_name':
        return user.institution?.name || 'N/A';
      case 'program':
        return user.program || 'N/A';
      default:
        return 'N/A';
    }
  };

  return html`
    <div className="border rounded-lg p-4 mb-4 bg-blue-50">
      <h2 className="text-lg font-semibold mb-2">Auto-Populated Information</h2>
      <div className="grid grid-cols-2 gap-2 text-sm">
        ${autoVariables.map(varName => html`
          <div key=${varName}>
            <span className="font-medium">${varName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>
            <span className="ml-2">${getVariableValue(varName)}</span>
          </div>
        `)}
      </div>
      <p className="text-xs text-gray-600 mt-2">This information will be automatically included in your CV.</p>
    </div>
  `;
};

export default AutoVariables;
