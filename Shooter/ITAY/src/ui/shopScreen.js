// Enhanced Shop Screen Module

import { getUserProfile, purchaseItem, updateUserProfile } from '../firebase/firestore.js';
import { CONFIG } from '../config.js';
import { showToast, formatNumber } from '../utils/helpers.js';

export class ShopScreen {
    constructor() {
        this.screenEl = document.getElementById('shop-screen');
        this.currentUser = null;
    }

    async setUser(user) {
        if (!user) return;
        this.currentUser = await getUserProfile(user.uid);
    }

    render() {
        if (!this.currentUser) return;

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
                    <h1 class="screen-title">MEGA SHOP</h1>
                    <p class="screen-subtitle">Premium equipment and skins</p>
                    <div class="currency-display-small">💰 ${formatNumber(this.currentUser.currency || 0)}</div>
                </div>

                <div class="shop-tabs">
                    <button class="tab-btn active">SKINS</button>
                    <button class="tab-btn" onclick="showToast('More items coming soon!', 'info')">BOOSTS</button>
                </div>

                <div class="items-grid" id="cosmetics-grid">
                    ${CONFIG.COSMETICS.map(item => this.renderItemCard(item)).join('')}
                </div>
            </div>
        `;

        this.setupListeners();
    }

    renderItemCard(item) {
        const owned = this.currentUser.cosmeticsOwned?.includes(item.id);
        const selected = this.currentUser.selectedCosmetic === item.id;

        return `
            <div class="item-card ${owned ? 'owned' : ''} ${selected ? 'selected' : ''}" 
                 data-id="${item.id}" 
                 data-price="${item.price}"
                 data-name="${item.name}"
                 data-owned="${owned}">
                <div class="item-preview" style="background: ${item.color}">
                    ${item.price > 1000 ? '<span class="rare-tag">RARE</span>' : ''}
                </div>
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-action">
                        ${selected ? '<span class="selected-text">ACTIVE</span>' :
                owned ? '<button class="shop-action-btn equip">EQUIP</button>' :
                    `<button class="shop-action-btn buy">💰 ${item.price}</button>`}
                    </div>
                </div>
            </div>
        `;
    }

    setupListeners() {
        const grid = document.getElementById('cosmetics-grid');
        if (!grid) return;

        grid.querySelectorAll('.item-card').forEach(card => {
            card.addEventListener('click', async () => {
                const id = card.dataset.id;
                const price = parseInt(card.dataset.price);
                const name = card.dataset.name;
                const owned = card.dataset.owned === 'true';

                if (owned) {
                    // Equip
                    if (id === this.currentUser.selectedCosmetic) return;
                    try {
                        showToast(`Equipping ${name}...`, 'info');
                        await updateUserProfile(this.currentUser.uid, { selectedCosmetic: id });
                        this.currentUser = await getUserProfile(this.currentUser.uid);
                        this.render();
                        showToast('Skin equipped!', 'success');
                    } catch (error) {
                        showToast('Failed to equip', 'error');
                    }
                } else {
                    // Buy
                    if (this.currentUser.currency < price) {
                        showToast('Not enough coins!', 'error');
                        return;
                    }

                    if (!confirm(`Purchase ${name} for 💰${price}?`)) return;

                    try {
                        showToast(`Purchasing ${name}...`, 'info');
                        await purchaseItem(this.currentUser.uid, id, price);
                        this.currentUser = await getUserProfile(this.currentUser.uid);
                        this.render();
                        showToast('Purchase complete!', 'success');
                    } catch (error) {
                        showToast(error.message || 'Purchase failed', 'error');
                    }
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
