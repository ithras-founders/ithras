import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

/**
 * Reusable modal for collecting basic details.
 * mode: 'template' | 'cv'
 * - template: name (required), institution (select if institutions provided), program, department
 * - cv: displayName (required)
 * institutions: optional array for template mode institution dropdown
 */
const BasicDetailsModal = ({ mode, initialValues = {}, institutions = [], onConfirm, onCancel }) => {
  const [values, setValues] = React.useState({
    name: initialValues.name ?? '',
    institution: initialValues.institution ?? '',
    program: initialValues.program ?? '',
    department: initialValues.department ?? '',
    displayName: initialValues.displayName ?? '',
  });

  const handleChange = (field, v) => {
    setValues(prev => ({ ...prev, [field]: v }));
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    if (mode === 'template' && !values.name?.trim()) return;
    if (mode === 'cv' && !values.displayName?.trim()) return;
    onConfirm(values);
  };

  const isTemplate = mode === 'template';

  return html`
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick=${onCancel}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
        onClick=${e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">
          ${isTemplate ? 'Template Details' : 'New CV Details'}
        </h2>
        <form onSubmit=${handleSubmit}>
          ${isTemplate ? html`
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Template Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value=${values.name}
                  onChange=${e => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="e.g., Summer Internship CV Template"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Institution (optional)</label>
                ${institutions.length > 0 ? html`
                  <select
                    value=${values.institution}
                    onChange=${e => handleChange('institution', e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="">Global – allocate to colleges later</option>
                    ${institutions.map(inst => html`
                      <option key=${inst.id} value=${inst.id}>${inst.name}</option>
                    `)}
                  </select>
                ` : html`
                  <input
                    type="text"
                    value=${values.institution}
                    onChange=${e => handleChange('institution', e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="Leave empty for global template"
                  />
                `}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Program ID (optional)</label>
                <input
                  type="text"
                  value=${values.program}
                  onChange=${e => handleChange('program', e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Program ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department (optional)</label>
                <input
                  type="text"
                  value=${values.department}
                  onChange=${e => handleChange('department', e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Department"
                />
              </div>
            </div>
          ` : html`
            <div>
              <label className="block text-sm font-medium mb-1">Display Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value=${values.displayName}
                onChange=${e => handleChange('displayName', e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="e.g., Summer Internship CV"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Used to identify this CV in the list</p>
            </div>
          `}
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick=${onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled=${isTemplate ? !values.name?.trim() : !values.displayName?.trim()}
            >
              ${isTemplate ? 'Create Template' : 'Create CV'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
};

export default BasicDetailsModal;
