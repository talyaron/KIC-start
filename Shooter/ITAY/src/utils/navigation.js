// Simple placeholder screens with navigation

// Add back buttons to all progression screens
const screenIds = ['customize-screen', 'upgrades-screen', 'friends-screen', 'missions-screen'];

screenIds.forEach(screenId => {
    const screen = document.getElementById(screenId);
    if (screen && !screen.querySelector('.back-home-btn')) {
        const backBtn = document.createElement('button');
        backBtn.className = 'icon-btn back-home-btn';
        backBtn.style.cssText = 'position: absolute; top: 1.5rem; left: 1.5rem; z-index: 100; width: 50px; height: 50px;';
        backBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    `;
        backBtn.onclick = () => {
            document.querySelector('.nav-btn[data-screen="home"]').click();
        };
        screen.appendChild(backBtn);
    }
});

console.log('✅ Navigation helpers loaded');
