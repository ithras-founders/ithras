import React from 'react';
import htm from 'htm';
import RegistrationStep1 from './RegistrationStep1.js';
import RegistrationStep2 from './RegistrationStep2.js';
import RegistrationStep3 from './RegistrationStep3.js';

const html = htm.bind(React.createElement);

const RegistrationFlow = ({ user, onStep1Success, onComplete, onShowLogin }) => {
  const path = (window.location.pathname || '').replace(/\/+$/, '') || '/';
  const isEducation = path === '/register/education';
  const isExperience = path === '/register/experience';

  const navigateTo = (loc) => {
    window.history.pushState(null, '', loc);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleStep1Success = (res) => {
    onStep1Success(res);
    navigateTo('/register/education');
  };

  const handleStep2Continue = () => {
    navigateTo('/register/experience');
  };

  const handleStep2Back = () => {
    navigateTo('/register');
  };

  const handleStep3Complete = () => {
    onComplete();
  };

  const handleStep3Back = () => {
    navigateTo('/register/education');
  };

  if (!user) {
    if (isEducation || isExperience) {
      navigateTo('/register');
      return html`<div className="p-8">Redirecting...</div>`;
    }
    return html`
      <${RegistrationStep1}
        onSuccess=${handleStep1Success}
        onShowLogin=${onShowLogin}
      />
    `;
  }

  if (path === '/register') {
    navigateTo('/register/education');
    return html`<div className="p-8">Redirecting...</div>`;
  }

  if (isEducation) {
    return html`
      <${RegistrationStep2}
        onContinue=${handleStep2Continue}
        onBack=${() => navigateTo('/register')}
      />
    `;
  }

  if (isExperience) {
    return html`
      <${RegistrationStep3}
        onComplete=${handleStep3Complete}
        onBack=${handleStep3Back}
      />
    `;
  }

  navigateTo('/register/education');
  return html`<div className="p-8">Redirecting...</div>`;
};

export default RegistrationFlow;
