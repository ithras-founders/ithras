import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

/**
 * Component for configuring left bucket content source
 */
const LeftBucketConfig = ({ entry, onUpdate }) => {
  if (!entry) return null;

  const handleChange = (field, value) => {
    if (onUpdate) {
      onUpdate({ [field]: value });
    }
  };

  return html`
    <div className="border-t pt-4 mt-4">
      <h4 className="text-sm font-semibold mb-2">Left Bucket Content</h4>
      <div>
        <label className="block text-sm font-medium mb-1">Content Source</label>
        <select
          value=${entry.leftBucketContentSource || 'fixed'}
          onChange=${e => {
            const source = e.target.value;
            handleChange('leftBucketContentSource', source);
            // Clear other fields when switching source
            if (source === 'fixed') {
              handleChange('leftBucketText', '');
            } else if (source === 'auto_variable') {
              handleChange('leftBucketVariable', null);
            } else if (source === 'field_derived') {
              handleChange('leftBucketFieldId', null);
            }
          }}
          className="w-full px-2 py-1 border rounded text-sm"
        >
          <option value="fixed">Fixed Text</option>
          <option value="auto_variable">Auto Variable</option>
          <option value="field_derived">Field Derived</option>
          <option value="candidate_entered">Candidate Entered</option>
        </select>
      </div>

      ${entry.leftBucketContentSource === 'fixed' ? html`
        <div className="mt-2">
          <label className="block text-sm font-medium mb-1">Fixed Text</label>
          <input
            type="text"
            value=${entry.leftBucketText || ''}
            onChange=${e => handleChange('leftBucketText', e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm"
            placeholder="Enter fixed text"
          />
        </div>
      ` : entry.leftBucketContentSource === 'auto_variable' ? html`
        <div className="mt-2">
          <label className="block text-sm font-medium mb-1">Variable</label>
          <select
            value=${entry.leftBucketVariable || ''}
            onChange=${e => handleChange('leftBucketVariable', e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm"
          >
            <option value="">Select variable</option>
            <option value="candidate.name">Candidate Name</option>
            <option value="candidate.email">Email</option>
            <option value="candidate.roll_number">Roll Number</option>
            <option value="college.name">College Name</option>
            <option value="program.name">Program Name</option>
            <option value="candidate.profile_photo">Profile Photo</option>
          </select>
        </div>
      ` : entry.leftBucketContentSource === 'field_derived' ? html`
        <div className="mt-2">
          <label className="block text-sm font-medium mb-1">Source Field</label>
          <select
            value=${entry.leftBucketFieldId || ''}
            onChange=${e => handleChange('leftBucketFieldId', e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm"
          >
            <option value="">Select field</option>
            ${(entry.fields || []).map(field => html`
              <option key=${field.id} value=${field.id}>${field.label}</option>
            `)}
          </select>
          <p className="text-xs text-gray-500 mt-1">Field value will be used as label</p>
        </div>
      ` : html`
        <div className="mt-2">
          <p className="text-xs text-gray-500">Candidate will enter the label when filling the CV</p>
        </div>
      `}
    </div>
  `;
};

export default LeftBucketConfig;
