// Friends Screen - Full Implementation

import { getUserProfile, getUserProfileByCode, addFriend, removeFriend, updateUserProfile } from '../firebase/firestore.js';
import { showToast, copyToClipboard } from '../utils/helpers.js';
import { validateUserCode } from '../utils/validators.js';

export class FriendsScreen {
  constructor() {
    this.screenEl = document.getElementById('friends-screen');
    this.currentUser = null;
    this.friends = [];
  }

  async setUser(user) {
    this.currentUser = await getUserProfile(user.uid);
    await this.loadFriends();
    this.render();
  }

  async loadFriends() {
    if (!this.currentUser || !this.currentUser.friends) {
      this.friends = [];
      return;
    }

    this.friends = [];
    for (const friendCode of this.currentUser.friends) {
      const friend = await getUserProfileByCode(friendCode);
      if (friend) {
        this.friends.push(friend);
      }
    }
  }

  render() {
    if (!this.currentUser) return;

    this.screenEl.innerHTML = `
      <div style="position: relative; padding-bottom: 100px;">
        <button onclick="document.querySelector('.nav-btn[data-screen=home]').click()" class="icon-btn" style="position: absolute; top: 1.5rem; left: 1.5rem; z-index: 100; width: 50px; height: 50px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </button>
        
        <div class="screen-header">
          <h1 class="screen-title">FRIENDS</h1>
          <p class="screen-subtitle">Connect and play together</p>
        </div>
        
        <!-- Your Code Section -->
        <div class="your-code-section">
          <div class="your-code-label">Your Friend Code</div>
          <div class="your-code-value" id="your-friend-code">${this.currentUser.userCode}</div>
          <button id="copy-your-code-btn" class="copy-code-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy Code
          </button>
        </div>
        
        <!-- Add Friend Section -->
        <div class="add-friend-section">
          <h3>Add Friend</h3>
          <div class="add-friend-form">
            <input type="text" id="friend-code-input" placeholder="Enter 6-digit friend code" maxlength="6">
            <button id="add-friend-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
              Add Friend
            </button>
          </div>
        </div>
        
        <!-- Friends List -->
        <div class="friends-container">
          <h2 style="margin-bottom: 2rem;">Your Friends (${this.friends.length})</h2>
          
          ${this.friends.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">👥</div>
              <div class="empty-text">No friends yet</div>
              <div class="empty-hint">Add friends using their 6-digit code above</div>
            </div>
          ` : `
            <ul class="friends-list">
              ${this.friends.map(friend => this.renderFriendCard(friend)).join('')}
            </ul>
          `}
        </div>
      </div>
    `;

    this.setupListeners();
  }

  renderFriendCard(friend) {
    const colors = ['#ff006e', '#8338ec', '#3a86ff', '#06ffa5', '#ffbe0b'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    return `
      <li class="friend-card">
        <div class="friend-avatar" style="background: ${color}">
          ${friend.displayName?.charAt(0) || 'F'}
        </div>
        <div class="friend-info">
          <div class="friend-name">${friend.displayName || 'Friend'}</div>
          <div class="friend-code">#${friend.userCode}</div>
          <div class="friend-stats">
            <span>🎮 ${friend.stats?.gamesPlayed || 0} games</span>
            <span>🏆 ${friend.stats?.totalScore || 0} score</span>
          </div>
        </div>
        <div class="friend-actions">
          <button class="invite-btn" data-code="${friend.userCode}" title="Invite to game">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
          <button class="remove-friend-btn" data-code="${friend.userCode}" title="Remove friend">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </li>
    `;
  }

  setupListeners() {
    const copyBtn = document.getElementById('copy-your-code-btn');
    const addBtn = document.getElementById('add-friend-btn');
    const input = document.getElementById('friend-code-input');

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        copyToClipboard(this.currentUser.userCode);
      });
    }

    if (addBtn) {
      addBtn.addEventListener('click', () => this.handleAddFriend());
    }

    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleAddFriend();
      });
    }

    // Remove friend buttons
    document.querySelectorAll('.remove-friend-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const friendCode = btn.dataset.code;
        this.handleRemoveFriend(friendCode);
      });
    });

    // Invite buttons (placeholder)
    document.querySelectorAll('.invite-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        showToast('Invite feature coming soon! Share your room code instead.', 'info');
      });
    });
  }

  async handleAddFriend() {
    const input = document.getElementById('friend-code-input');
    const friendCode = input.value.trim();

    if (!validateUserCode(friendCode)) {
      showToast('Please enter a valid 6-digit code', 'error');
      return;
    }

    if (friendCode === this.currentUser.userCode) {
      showToast('You cannot add yourself as a friend!', 'error');
      return;
    }

    try {
      showToast('Adding friend...', 'info');
      await addFriend(this.currentUser.uid, friendCode);

      // Reload friends and update display
      this.currentUser = await getUserProfile(this.currentUser.uid);
      await this.loadFriends();
      this.render();

      showToast('Friend added successfully!', 'success');
      input.value = '';
    } catch (error) {
      console.error('Add friend error:', error);
      showToast(error.message || 'Failed to add friend', 'error');
    }
  }

  async handleRemoveFriend(friendCode) {
    if (!confirm('Are you sure you want to remove this friend?')) {
      return;
    }

    try {
      await removeFriend(this.currentUser.uid, friendCode);

      // Reload friends and update display
      this.currentUser = await getUserProfile(this.currentUser.uid);
      await this.loadFriends();
      this.render();

      showToast('Friend removed', 'success');
    } catch (error) {
      console.error('Remove friend error:', error);
      showToast('Failed to remove friend', 'error');
    }
  }

  show() {
    this.screenEl.classList.add('active');
  }

  hide() {
    this.screenEl.classList.remove('active');
  }
}
