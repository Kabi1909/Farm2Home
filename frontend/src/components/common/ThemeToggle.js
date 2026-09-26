import { useEffect, useRef, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light');
  const manual = useRef(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#121d18' : '#2f6b3b');
  }, [theme]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => {
      let saved;
      try {
        saved = localStorage.getItem('f2h:theme');
      } catch {
        // A manual choice still works for this tab when storage is unavailable.
        if (manual.current) return;
      }
      if (saved === 'light' || saved === 'dark') setTheme(saved);
      else if (!manual.current) setTheme(preference.matches ? 'dark' : 'light');
    };
    const storageChanged = (event) => {
      if (event.key === 'f2h:theme' || event.key === null) {
        manual.current = false;
        sync();
      }
    };
    preference.addEventListener('change', sync);
    window.addEventListener('storage', storageChanged);
    return () => {
      preference.removeEventListener('change', sync);
      window.removeEventListener('storage', storageChanged);
    };
  }, []);

  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className="icon-btn theme-toggle"
      aria-label="Dark mode"
      aria-pressed={dark}
      title={`Switch to ${dark ? 'light' : 'dark'} mode`}
      onClick={() => {
        const next = dark ? 'light' : 'dark';
        manual.current = true;
        setTheme(next);
        try {
          localStorage.setItem('f2h:theme', next);
        } catch {
          // Theme changes never depend on persistence succeeding.
        }
      }}
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
