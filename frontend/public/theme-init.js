// Apply the saved appearance before the page paints. Storage is optional.
(() => {
  let theme;
  try {
    theme = localStorage.getItem('f2h:theme');
  } catch {
    // Private browsing can disable storage.
  }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();
