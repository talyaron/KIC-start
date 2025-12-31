const App = {
    user: null,
    currentRoomId: null,
    isHost: false,

    init: function () {
        // Auth Listeners
        document.getElementById('btn-login-google').onclick = () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider).catch(e => alert(e.message));
        };

        document.getElementById('btn-login-guest').onclick = () => {
            auth.signInAnonymously().catch(e => alert(e.message));
        };

        // Firebase Auth State
        auth.onAuthStateChanged(u => {
            if (u) {
                this.user = u;
                this.showScreen('screen-home');

                // If anonymous, ensure we have a display name
                if (u.isAnonymous && !u.displayName) {
                    // We can't easily update profile in compat SDK for anon sometimes, 
                    // but we will use the ID for display if name is missing.
                }

                const name = u.displayName || "Guest " + u.uid.substring(0, 4);
                document.getElementById('user-name').textContent = name;
                document.getElementById('user-id').textContent = "ID: " + u.uid.substring(0, 6);
            } else {
                this.showScreen('screen-auth');
            }
        });

        // Lobby Buttons
        document.getElementById('btn-create-server').onclick = () => this.createRoom();
        document.getElementById('btn-join-server').onclick = () => {
            const code = document.getElementById('inp-friend-id').value;
            if (code) this.joinRoom(code);
        };

        document.getElementById('btn-start-game').onclick = () => {
            db.collection('rooms').doc(this.currentRoomId).update({ status: 'countdown' });
        };

        document.getElementById('btn-leave').onclick = () => this.leaveRoom();
        document.getElementById('btn-play-again').onclick = () => this.leaveRoom(); // Simple reset
        document.getElementById('btn-home').onclick = () => this.leaveRoom();
    },

    createRoom: async function () {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        this.currentRoomId = code;
        this.isHost = true;

        await db.collection('rooms').doc(code).set({
            hostId: this.user.uid,
            status: 'waiting',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        this.joinRoom(code);
    },

    joinRoom: async function (code) {
        const ref = db.collection('rooms').doc(code);
        const doc = await ref.get();
        if (!doc.exists) return alert("Room Not Found");

        this.currentRoomId = code;
        this.showScreen('screen-room');
        document.getElementById('room-code-txt').textContent = code;

        // Reset local state
        const name = this.user.displayName || "Guest " + this.user.uid.substring(0, 4);

        await ref.collection('players').doc(this.user.uid).set({
            uid: this.user.uid,
            name: name,
            hp: 100,
            score: 0,
            kills: 0,
            dead: false,
            x: 400, y: 500
        });

        // Listeners
        ref.onSnapshot(snap => {
            const data = snap.data();
            if (data.status === 'countdown') {
                this.startCountdown();
            }
            if (data.status === 'finished') {
                this.endGame();
            }
        });

        ref.collection('players').onSnapshot(snap => {
            const grid = document.getElementById('player-grid');
            grid.innerHTML = '';
            let count = 0;
            snap.forEach(d => {
                const p = d.data();
                grid.innerHTML += `<div style="margin:5px;">${p.dead ? '💀' : '🌿'} ${p.name}</div>`;
                count++;
            });

            // Host Logic check
            if (this.currentRoomId) { // Check if we are still in a room
                // const isHost = (doc.data().hostId === this.user.uid); // doc is stale
                // We rely on local this.isHost for UI button, server validates write
                document.getElementById('btn-start-game').classList.toggle('disabled', !this.isHost);
            }
        });
    },

    startCountdown: function () {
        const display = document.getElementById('countdown-display');
        display.classList.remove('hidden');
        let count = 5;
        const intv = setInterval(() => {
            display.textContent = count;
            count--;
            if (count < 0) {
                clearInterval(intv);
                display.classList.add('hidden');
                this.startGame();
            }
        }, 1000);
    },

    startGame: function () {
        this.showScreen('screen-game-hidden');
        document.getElementById('game-hud').classList.remove('hidden');
        NatureGame.start(this.currentRoomId, this.isHost);
    },

    endGame: function () {
        NatureGame.stop();
        this.showScreen('screen-stats');
        document.getElementById('game-hud').classList.add('hidden');

        const tbody = document.querySelector('#stats-table tbody');
        tbody.innerHTML = '';

        db.collection('rooms').doc(this.currentRoomId).collection('players').get().then(snap => {
            snap.forEach(doc => {
                const p = doc.data();
                const row = `<tr>
                    <td>${p.name} <span style="font-size:0.8em; color:#888;">(${p.uid.substring(0, 4)})</span></td>
                    <td>${p.kills || 0}</td>
                    <td>${p.dead ? '<span style="color:red">DEAD</span>' : '<span style="color:green">SURVIVOR</span>'}</td>
                 </tr>`;
                tbody.innerHTML += row;
            });
        });
    },

    leaveRoom: function () {
        if (this.currentRoomId) {
            db.collection('rooms').doc(this.currentRoomId).collection('players').doc(this.user.uid).delete();
        }
        this.currentRoomId = null;
        this.isHost = false;
        NatureGame.stop();
        this.showScreen('screen-home');
    },

    showScreen: function (id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        if (id !== 'screen-game-hidden') document.getElementById(id).classList.add('active');
    }
};

window.addEventListener('DOMContentLoaded', () => App.init());
