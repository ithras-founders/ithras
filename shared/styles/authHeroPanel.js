/**
 * Shared split-layout hero panel style for auth / registration screens.
 */
export const AUTH_HERO_PANEL_STYLE = {
  background: `
    radial-gradient(ellipse 100% 80% at 20% 20%, rgba(255,255,255,0.12), transparent 50%),
    radial-gradient(ellipse 80% 60% at 100% 80%, rgba(0,0,0,0.2), transparent 45%),
    linear-gradient(155deg, var(--app-accent) 0%, #312e81 48%, #1e1b4b 100%)`,
};

export const AUTH_HERO_COLUMN_CLASS =
  'hidden lg:flex lg:w-[42%] xl:w-2/5 relative overflow-hidden items-center justify-center p-16';
