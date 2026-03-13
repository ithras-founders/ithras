import React, { useState, useRef } from 'react';
import htm from 'htm';
import { uploadProfilePhoto } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';
import { initials } from '../utils/cvMakerUtils.js';

const html = htm.bind(React.createElement);

const ProfilePhoto = ({ user, photoUrl, onPhotoChange, size = 96 }) => {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setUploading(true);
    try {
      const result = await uploadProfilePhoto(user.id, file);
      onPhotoChange(result.url);
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error('Failed to upload photo: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return html`
    <div
      className="relative cursor-pointer group"
      style=${{ width: size, height: size }}
      onClick=${() => !uploading && fileRef.current?.click()}
      title="Click to change profile photo"
    >
      ${photoUrl
        ? html`<img src=${photoUrl} alt="Profile" className="rounded-full object-cover w-full h-full border-4 border-white shadow-[var(--app-shadow-card)]" />`
        : html`<div
            className="rounded-full w-full h-full border-4 border-white shadow-[var(--app-shadow-card)] flex items-center justify-center text-white font-bold bg-[var(--app-accent)]"
            style=${{ fontSize: size * 0.33 }}
          >${initials(user?.name)}</div>`
      }
      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        ${uploading
          ? html`<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>`
          : html`<svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`
        }
      </div>
      <input ref=${fileRef} type="file" accept="image/*" className="hidden" onChange=${handleFileChange} />
    </div>
  `;
};

export default ProfilePhoto;
