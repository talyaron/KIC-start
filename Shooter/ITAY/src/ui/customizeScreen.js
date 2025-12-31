// Full Customize Screen Implementation

import { getUserProfile, updateUserProfile } from '../firebase/firestore.js';
import { CONFIG } from '../config.js';
import { showToast } from '../utils/helpers.js';

export class CustomizeScreen {
  constructor() {
    this.screenEl = document.getElementById('customize-screen');
    this.currentUser = null;
  }

  async setUser(user) {
    if (!user) return;
    this.currentUser = await getUserProfile(user.uid);
  }

  render() {
    if (!this.currentUser) return;

    const ownedItems = this.currentUser.cosmeticsOwned || ['default'];
    const selected = this.currentUser.selectedCosmetic || 'default';

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
                    <h1 class="screen-title">SKINS</h1>
                    <p class="screen-subtitle">Choose your appearance in battle</p>
                </div>

                <div class="skins-display">
                    <div class="current-skin-preview" style="background: ${this.getSkinColor(selected)}">
                        <div class="preview-label">ACTIVE SKIN</div>
                        <div class="preview-name">${this.getSkinName(selected)}</div>
                    </div>
                </div>

                <div class="skins-grid">
                    ${CONFIG.COSMETICS.map(item => this.renderSkinTile(item, ownedItems.includes(item.id), selected === item.id)).join('')}
                </div>
            </div>
        `;

    this.setupListeners();
  }

  getSkinColor(id) {
    const item = CONFIG.COSMETICS.find(c => c.id === id);
    return item ? item.color : '#8338ec';
  }

  getSkinName(id) {
    const item = CONFIG.COSMETICS.find(c => c.id === id);
    return item ? item.name : 'Unknown';
  }

  renderSkinTile(item, isOwned, isSelected) {
    return `
            <div class="skin-tile ${isSelected ? 'selected' : ''} ${!isOwned ? 'locked' : ''}" 
                 data-id="${item.id}" 
                 data-owned="${isOwned}">
                <div class="skin-swatch" style="background: ${item.color}"></div>
                <div class="skin-info">
                    <div class="skin-name">${item.name}</div>
                    ${isSelected ? '<span class="status equip">EQUIPPED</span>' :
        isOwned ? '<span class="status own">OWNED</span>' :
          '<span class="status lock">🔒 LOCKED</span>'}
                </div>
            </div>
        `;
  }

  setupListeners() {
    const tiles = this.screenEl.querySelectorAll('.skin-tile[data-owned="true"]');
    tiles.forEach(tile => {
      tile.addEventListener('click', async () => {
        const id = tile.dataset.id;
        if (id === this.currentUser.selectedCosmetic) return;

        try {
          showToast('Equipping skin...', 'info');
          await updateUserProfile(this.currentUser.uid, { selectedCosmetic: id });

          // Reload
          this.currentUser = await getUserProfile(this.currentUser.uid);
          this.render();
          showToast('Skin equipped!', 'success');
        } catch (error) {
          console.error('Equip error:', error);
          showToast('Failed to equip skin', 'error');
        }
      });
    });

    // Click on locked tile redirect to shop
    const lockedTiles = this.screenEl.querySelectorAll('.skin-tile.locked');
    lockedTiles.forEach(tile => {
      tile.addEventListener('click', () => {
        showToast('Visit shop to unlock!', 'info');
        document.querySelector('.nav-btn[data-screen=shop]').click();
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
