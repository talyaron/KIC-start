// Full Missions Screen Implementation

import { getUserProfile, claimMissionReward } from '../firebase/firestore.js';
import { CONFIG } from '../config.js';
import { showToast } from '../utils/helpers.js';

export class MissionsScreen {
  constructor() {
    this.screenEl = document.getElementById('missions-screen');
    this.currentUser = null;
  }

  async setUser(user) {
    if (!user) return;
    this.currentUser = await getUserProfile(user.uid);
  }

  render() {
    if (!this.currentUser) return;

    const { missions, currency } = this.currentUser;

    this.screenEl.innerHTML = `
            <div style="position: relative; padding-bottom: 2rem;">
                <!-- Back Button -->
                <button onclick="document.querySelector('.nav-btn[data-screen=home]').click()" class="icon-btn" style="position: absolute; top: 1.5rem; left: 1.5rem; z-index: 100; width: 50px; height: 50px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                </button>

                <div class="screen-header">
                    <h1 class="screen-title">MISSIONS</h1>
                    <p class="screen-subtitle">Complete objectives for rewards</p>
                    <div class="currency-display-small">💰 ${currency || 0}</div>
                </div>

                <div class="missions-section">
                    <h2 class="section-title">Daily Missions</h2>
                    <div class="missions-list">
                        ${CONFIG.MISSIONS.DAILY.map(m => this.renderMissionCard('daily', m, missions.daily?.[m.id])).join('')}
                    </div>
                </div>

                <div class="missions-section" style="margin-top: 2rem;">
                    <h2 class="section-title">Weekly Challenges</h2>
                    <div class="missions-list">
                        ${CONFIG.MISSIONS.WEEKLY.map(m => this.renderMissionCard('weekly', m, missions.weekly?.[m.id])).join('')}
                    </div>
                </div>
            </div>
        `;

    this.setupListeners();
  }

  renderMissionCard(type, mission, progress) {
    const current = progress?.progress || 0;
    const target = mission.target;
    const isCompleted = current >= target || progress?.completed;
    const isClaimed = progress?.claimed || false;
    const percent = Math.min(100, Math.floor((current / target) * 100));

    return `
            <div class="mission-card ${isClaimed ? 'claimed' : ''}">
                <div class="mission-info">
                    <h3>${mission.title}</h3>
                    <p>${mission.description}</p>
                    <div class="mission-progress-container">
                        <div class="progress-stats">
                            <span>${current} / ${target}</span>
                            <span>${percent}%</span>
                        </div>
                        <div class="progress-bar-medium">
                            <div class="progress-fill" style="width: ${percent}%"></div>
                        </div>
                    </div>
                </div>
                <div class="mission-reward">
                    <div class="reward-amount">💰 ${mission.reward}</div>
                    ${isClaimed ? `
                        <button class="claim-btn claimed" disabled>CLAIMED</button>
                    ` : isCompleted ? `
                        <button class="claim-btn active" data-type="${type}" data-id="${mission.id}" data-reward="${mission.reward}">CLAIM</button>
                    ` : `
                        <button class="claim-btn locked" disabled>LOCKED</button>
                    `}
                </div>
            </div>
        `;
  }

  setupListeners() {
    const btns = this.screenEl.querySelectorAll('.claim-btn.active');
    btns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const type = btn.dataset.type;
        const id = btn.dataset.id;
        const reward = parseInt(btn.dataset.reward);

        try {
          showToast('Claiming reward...', 'info');
          await claimMissionReward(this.currentUser.uid, type, id, reward);

          // Reload user data
          this.currentUser = await getUserProfile(this.currentUser.uid);
          this.render();
          showToast(`Success! Earned 💰 ${reward}`, 'success');
        } catch (error) {
          console.error('Claim error:', error);
          showToast('Failed to claim reward', 'error');
        }
      });
    });
  }

  show() {
    this.screenEl.classList.add('active');
    this.render();
  }

  hide() {
    this.screenEl.classList.remove('active');
  }
}
