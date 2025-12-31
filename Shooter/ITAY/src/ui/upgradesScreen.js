// Full Upgrades Screen Implementation

import { getUserProfile, purchaseUpgrade } from '../firebase/firestore.js';
import { CONFIG } from '../config.js';
import { showToast } from '../utils/helpers.js';

export class UpgradesScreen {
  constructor() {
    this.screenEl = document.getElementById('upgrades-screen');
    this.currentUser = null;
  }

  async setUser(user) {
    if (!user) return;
    this.currentUser = await getUserProfile(user.uid);
  }

  calculateCost(baseCost, multiplier, level) {
    return Math.floor(baseCost * Math.pow(multiplier, level));
  }

  render() {
    if (!this.currentUser) return;

    const { upgrades, currency } = this.currentUser;

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
                    <h1 class="screen-title">SKILLS & UPGRADES</h1>
                    <p class="screen-subtitle">Enhance your combat effectiveness</p>
                    <div class="currency-display-small">💰 ${currency || 0}</div>
                </div>

                <div class="upgrades-grid">
                    ${this.renderUpgradeCard('FIRE_RATE', 'Fire Rate', '⚡', 'Reduces time between shots', upgrades.fireRateLevel || 0)}
                    ${this.renderUpgradeCard('DAMAGE', 'Bullet Damage', '🔥', 'Increases damage per bullet', upgrades.damageLevel || 0)}
                    ${this.renderUpgradeCard('HP', 'Max Health', '❤️', 'Increases your maximum HP', upgrades.hpLevel || 0)}
                    ${this.renderUpgradeCard('SPEED', 'Movement Speed', '👟', 'Increases movement speed', upgrades.speedLevel || 0)}
                </div>
            </div>
        `;

    this.setupListeners();
  }

  renderUpgradeCard(key, label, icon, desc, level) {
    const config = CONFIG.UPGRADES[key];
    const nextCost = this.calculateCost(config.baseCost, config.costMultiplier, level);
    const isMax = level >= config.maxLevel;
    const canAfford = this.currentUser.currency >= nextCost;

    return `
            <div class="upgrade-card ${isMax ? 'maxed' : ''}">
                <div class="upgrade-icon">${icon}</div>
                <div class="upgrade-info">
                    <h3>${label}</h3>
                    <p>${desc}</p>
                    <div class="level-indicator">
                        <span class="lvl-label">LVL ${level}</span>
                        <div class="progress-bar-small">
                            <div class="progress-fill" style="width: ${(level / config.maxLevel) * 100}%"></div>
                        </div>
                    </div>
                </div>
                <div class="upgrade-action">
                    ${isMax ? `
                        <button class="upgrade-btn max" disabled>MAXED</button>
                    ` : `
                        <button class="upgrade-btn ${canAfford ? 'active' : 'poor'}" 
                                data-type="${key}" 
                                data-cost="${nextCost}">
                            💰 ${nextCost}
                        </button>
                    `}
                </div>
            </div>
        `;
  }

  setupListeners() {
    const btns = this.screenEl.querySelectorAll('.upgrade-btn.active');
    btns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const type = btn.dataset.type;
        const cost = parseInt(btn.dataset.cost);
        const upgradeTypeMap = {
          'FIRE_RATE': 'fireRateLevel',
          'DAMAGE': 'damageLevel',
          'HP': 'hpLevel',
          'SPEED': 'speedLevel'
        };

        try {
          showToast('Applying upgrade...', 'info');
          await purchaseUpgrade(this.currentUser.uid, upgradeTypeMap[type], cost);

          // Reload user data
          this.currentUser = await getUserProfile(this.currentUser.uid);
          this.render();
          showToast('Upgrade successful!', 'success');
        } catch (error) {
          console.error('Upgrade error:', error);
          showToast(error.message || 'Upgrade failed', 'error');
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
