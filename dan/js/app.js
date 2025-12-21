const App = {
    init: function () {
        AuthManager.init();
        FirebaseManager.init((success, profile) => {
            if (success) AuthManager.onLogin(profile);
            else document.getElementById('screen-auth').classList.add('active');
        });

        // Lobby Logic
        document.getElementById('btn-create-room').addEventListener('click', async () => {
            try {
                const code = await FirebaseManager.createRoom();
                App.enterRoom(code);
            } catch (e) { alert(e.message); }
        });

        document.getElementById('btn-join-room').addEventListener('click', async () => {
            const code = document.getElementById('inp-room-code').value;
            try {
                const res = await FirebaseManager.joinRoom(code);
                App.enterRoom(code);
            } catch (e) { alert(e.message); }
        });

        document.getElementById('btn-start-match').addEventListener('click', () => {
            // Set Status playing
            FirebaseManager.roomRef.update({ status: 'playing' });
        });

        document.getElementById('btn-leave-room').addEventListener('click', () => {
            FirebaseManager.leaveRoom();
            App.showScreen('screen-lobby');
            GameManager.stopGame();
        });

        // Add Settings Button Programmatically
        const settingsBtn = document.createElement('button');
        settingsBtn.className = 'cyber-btn hollow';
        settingsBtn.innerText = 'FIX AUDIO';
        settingsBtn.style.position = 'absolute';
        settingsBtn.style.top = '20px';
        settingsBtn.style.right = '20px';
        settingsBtn.onclick = () => {
            // Basic Fix for Audio Context often needed in Chrome
            if (GameManager.game && GameManager.game.sound) GameManager.game.sound.context.resume();
            alert("Audio Resumed / Settings Placeholder");
        };
        document.getElementById('screen-lobby').appendChild(settingsBtn);
    },

    enterRoom: function (code) {
        document.getElementById('room-code-display').textContent = code;
        App.showScreen('screen-room');

        // Listen for Room Config
        FirebaseManager.roomRef.onSnapshot(doc => {
            if (doc.data().status === 'playing') {
                App.showScreen('screen-game-hidden'); // Just hide UI
                document.getElementById('ui-layer').style.pointerEvents = 'none'; // Passthrough
                // HACK: Hide screens manually
                document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

                const isHost = (doc.data().hostId === FirebaseManager.user.uid);
                GameManager.startGame(code, isHost);
            }
        });

        // Listen for Players
        FirebaseManager.roomRef.collection('players').onSnapshot(snap => {
            const list = document.getElementById('player-list');
            list.innerHTML = '';
            let count = 0;
            const myId = FirebaseManager.user.uid;

            snap.forEach(d => {
                const p = d.data();
                const div = document.createElement('div');
                div.className = 'player-item';
                div.innerHTML = `<span class="neon">${p.name}</span> <span>${p.score} PTS</span>`;
                list.appendChild(div);
                count++;
            });

            const isHost = (FirebaseManager.roomRef && FirebaseManager.roomRef.id);
            // Logic check for host button enable could be here
            document.getElementById('btn-start-match').classList.toggle('disabled', count < 1); // 1 for test
        });
    },

    showScreen: function (id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const el = document.getElementById(id);
        if (el) el.classList.add('active');
    }
};

window.addEventListener('DOMContentLoaded', () => App.init());
