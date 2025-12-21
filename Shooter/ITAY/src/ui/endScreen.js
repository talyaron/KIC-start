// End Screen Module - Enhanced

export class EndScreen {
  constructor(onNavigate) {
    this.onNavigate = onNavigate;
    this.screenEl = document.getElementById('end-screen');
  }

  showResults(stats) {
    // Calculate totals
    let bestScore = 0;
    let bestPlayer = null;

    Object.entries(stats).forEach(([uid, playerStats]) => {
      if (playerStats.score > bestScore) {
        bestScore = playerStats.score;
        bestPlayer = playerStats.displayName;
      }
    });

    this.screenEl.innerHTML = `
      <div class="end-container">
        <div class="end-header">
          <h1 style="font-size: 4rem; margin-bottom: 1rem;">GAME OVER</h1>
          <p style="font-size: 1.5rem; color: var(--color-text-secondary);">
            ${bestPlayer ? `🏆 Champion: ${bestPlayer}` : 'Match Complete'}
          </p>
        </div>
        
        <table class="stats-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Score</th>
              <th style="color: #ff006e;">Red</th>
              <th style="color: #ffbe0b;">Yellow</th>
              <th style="color: #3a86ff;">Blue</th>
              <th>Total Kills</th>
              <th>Damage Taken</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody id="stats-body">
          </tbody>
        </table>
        
        <div class="end-actions">
          <button id="home-btn" class="menu-btn secondary-action">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
            Back to Home
          </button>
          <button id="play-again-btn" class="menu-btn primary-action">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="10 8 16 12 10 16 10 8" fill="white"></polygon>
            </svg>
            Play Again
          </button>
        </div>
      </div>
    `;

    // Populate stats
    const tbody = document.getElementById('stats-body');
    Object.entries(stats).forEach(([uid, playerStats]) => {
      const row = document.createElement('tr');
      const totalKills = (playerStats.kills?.red || 0) + (playerStats.kills?.yellow || 0) + (playerStats.kills?.blue || 0);
      const mins = Math.floor(playerStats.survivalTime / 60);
      const secs = playerStats.survivalTime % 60;
      const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

      row.innerHTML = `
        <td style="font-weight: 700;">${playerStats.displayName}</td>
        <td style="font-size: 1.2rem; font-weight: 700; color: var(--color-accent-primary);">${playerStats.score || 0}</td>
        <td>${playerStats.kills?.red || 0}</td>
        <td>${playerStats.kills?.yellow || 0}</td>
        <td>${playerStats.kills?.blue || 0}</td>
        <td style="font-weight: 600;">${totalKills}</td>
        <td>${playerStats.damageTaken || 0}</td>
        <td>${timeStr}</td>
      `;

      tbody.appendChild(row);
    });

    // Setup listeners
    document.getElementById('home-btn').addEventListener('click', () => {
      this.onNavigate('home');
    });

    document.getElementById('play-again-btn').addEventListener('click', () => {
      this.onNavigate('lobby');
    });
  }

  show() {
    this.screenEl.classList.add('active');
  }

  hide() {
    this.screenEl.classList.remove('active');
  }
}
