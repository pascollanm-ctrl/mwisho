// Small inline navigation glue so user can interact before main.js is added.
(function() {
  const nav = document.getElementById('nav');
  const sections = document.querySelectorAll('.section');
  const pageTitle = document.getElementById('pageTitle');
  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-target]');
    if (!btn) return;
    nav.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.dataset.target;
    sections.forEach(s => s.style.display = s.id === target ? '' : 'none');
    pageTitle.textContent = btn.textContent.trim();
  });

  // demo login behaviour (so the UI is accessible right away)
  const loginModal = document.getElementById('loginModal');
  const loginForm = document.getElementById('loginForm');
  const demoBtn = document.getElementById('demoLogin');
  const logoutBtn = document.getElementById('logoutBtn');
  const openRegistration = document.getElementById('openRegistration');

  function finishLogin(username) {
    loginModal.style.display = 'none';
    localStorage.setItem('hms_session', JSON.stringify({
      user: username,
      role: username === 'admin' ? 'Admin' : 'Staff'
    }));
    // update UI role label
    document.querySelector('.sidebar div:nth-child(2) div').textContent = username;
  }

  loginForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fd = new FormData(loginForm);
    const u = fd.get('username').trim();
    const p = fd.get('password').trim();
    // hardcoded credentials
    if ((u === 'admin' && p === 'admin123') || (u === 'staff' && p === 'staff123')) {
      finishLogin(u);
    } else {
      alert('Invalid credentials for demo. Use admin/admin123 or staff/staff123');
    }
  });

  demoBtn.addEventListener('click', () => finishLogin('staff'));
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('hms_session');
    loginModal.style.display = '';
    // reset UI to dashboard
    document.querySelector('#nav button[data-target="dashboard"]').click();
  });

  // quick open registration
  openRegistration.addEventListener('click', () => {
    document.querySelector('#nav button[data-target="registration"]').click();
  });

  // check session on load
  window.addEventListener('load', () => {
    const s = localStorage.getItem('hms_session');
    if (s) {
      loginModal.style.display = 'none';
      const u = JSON.parse(s).user;
      document.querySelector('.sidebar div:nth-child(2) div').textContent = u;
    } else {
      loginModal.style.display = '';
    }
  });

  // theme toggle (very simple)
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.addEventListener('change', (e) => {
    if (e.target.checked) document.documentElement.style.filter = 'invert(0.98) hue-rotate(180deg)';
    else document.documentElement.style.filter = '';
  });
})();
