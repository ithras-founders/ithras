import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getTemplateVersions } from '/core/frontend/src/modules/shared/services/api.js';

const html = htm.bind(React.createElement);

const TemplateVersions = ({ templateId }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVersions();
  }, [templateId]);

  const fetchVersions = async () => {
    if (!templateId) {
      setVersions([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const versionsData = await getTemplateVersions(templateId);
      setVersions(versionsData);
    } catch (error) {
      console.error('Failed to fetch versions:', error);
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return html`<div className="p-4 text-center">Loading versions...</div>`;
  }

  return html`
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Version History</h3>
      ${versions.length === 0 ? html`
        <div className="text-center text-gray-500 py-8">No versions found</div>
      ` : html`
        <div className="space-y-2">
          ${versions.map(version => html`
            <div key=${version.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">Version ${version.version}</div>
                  <div className="text-sm text-gray-600">
                    Status: <span className="font-medium">${version.status}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Created: ${new Date(version.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  ${version.status === 'PUBLISHED' ? html`
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                      Active
                    </span>
                  ` : ''}
                  ${version.status === 'DRAFT' ? html`
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-medium">
                      Draft
                    </span>
                  ` : ''}
                  ${version.status === 'RETIRED' ? html`
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm font-medium">
                      Retired
                    </span>
                  ` : ''}
                </div>
              </div>
              ${version.config && Object.keys(version.config).length > 0 ? html`
                <div className="mt-2 text-sm text-gray-600">
                  Sections: ${version.config.sections?.length || 0}
                </div>
              ` : ''}
            </div>
          `)}
        </div>
      `}
    </div>
  `;
};

export default TemplateVersions;
