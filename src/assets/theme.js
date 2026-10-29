(() => {
  try {
    const saved = localStorage.getItem('ssup-theme');
    document.documentElement.dataset.theme = saved === 'dark' ? 'dark' : 'light';
  } catch { document.documentElement.dataset.theme = 'light'; }
})();
