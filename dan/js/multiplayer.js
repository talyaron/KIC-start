const Multiplayer = {
    roomId: null,
    isHost: false,
    roomRef: null,

    players: {},
    enemies: {},
    projectiles: {},

    init: function () {
        document.getElementById('btn-create-private').addEventListener('click', () => this.createPrivateRoom());
        document.getElementById('btn-join-private').addEventListener('click', () => {
            const id = document.getElementById('input-room-id').value;
            if (id) this.joinRoom(id);
        });
        document.getElementById('btn-matchmaking').addEventListener('click', () => alert("Matchmaking coming soon"));
    },

    createPrivateRoom: async function () {
        if (!Auth.user) return alert("Please Login First!");
        const newRoomId = Math.floor(1000 + Math.random() * 9000).toString();
        this.roomId = newRoomId;
        this.roomRef = db.collection('rooms').doc(this.roomId);
        try {
            await this.roomRef.set({
                hostId: Auth.user.uid,
                status: 'waiting',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert(`Room Created! ID: ${newRoomId}`);
            this.joinRoom(newRoomId);
        } catch (e) { alert("Error: " + e.message); }
    },

    joinRoom: async function (roomId) {
        if (!Auth.user) return alert("Please Login First!");
        this.roomId = roomId;
        this.roomRef = db.collection('rooms').doc(roomId);
        const doc = await this.roomRef.get();
        if (!doc.exists) return alert("Room does not exist!");

        // Set Player
        await this.roomRef.collection('players').doc(Auth.user.uid).set({
            x: 400, y: 500, hp: 100, score: 0,
            displayName: Auth.profile.displayName, isDead: false
        });

        if (doc.data().hostId === Auth.user.uid) {
            this.isHost = true;
            console.log("I am the Host");
        }

        this.startSync();
        GameUI.showGameHud();
        startGame();
    },

    startSync: function () {
        // Players
        this.roomRef.collection('players').onSnapshot(snap => {
            snap.docChanges().forEach(c => {
                if (c.type === 'removed') delete this.players[c.doc.id];
                else this.players[c.doc.id] = c.doc.data();
            });
        });

        // Enemies (Subcollection)
        this.roomRef.collection('enemies').onSnapshot(snap => {
            snap.docChanges().forEach(c => {
                if (c.type === 'removed') delete this.enemies[c.doc.id];
                else this.enemies[c.doc.id] = c.doc.data();
            });
        });

        // Projectiles (Subcollection)
        this.roomRef.collection('projectiles').onSnapshot(snap => {
            snap.docChanges().forEach(c => {
                if (c.type === 'removed') delete this.projectiles[c.doc.id];
                else this.projectiles[c.doc.id] = c.doc.data();
            });
        });
    },

    syncPlayer: function (x, y) {
        if (this.roomRef && Auth.user) {
            this.roomRef.collection('players').doc(Auth.user.uid).update({ x, y }).catch(() => { });
        }
    },

    shoot: function (x, y) {
        if (this.roomRef && Auth.user) {
            const id = Auth.user.uid + '_' + Date.now();
            this.roomRef.collection('projectiles').doc(id).set({
                id, x, y, owner: Auth.user.uid
                // Not awaiting to avoid lag
            });
        }
    },

    // Host Functions
    spawnEnemy: function (enemyData) {
        if (this.isHost) this.roomRef.collection('enemies').doc(enemyData.id).set(enemyData);
    },

    updateEnemy: function (id, data) {
        if (this.isHost) this.roomRef.collection('enemies').doc(id).update(data).catch(() => { });
    },

    removeEnemy: function (id) {
        if (this.isHost) this.roomRef.collection('enemies').doc(id).delete().catch(() => { });
    },

    removeProjectile: function (id) {
        if (this.isHost) this.roomRef.collection('projectiles').doc(id).delete().catch(() => { });
    },

    addScore: function (uid, points) {
        if (!this.isHost) return;
        const pRef = this.roomRef.collection('players').doc(uid);
        db.runTransaction(async (t) => {
            const doc = await t.get(pRef);
            if (doc.exists) {
                const newScore = (doc.data().score || 0) + points;
                t.update(pRef, { score: newScore });
            }
        });
    }
};

window.Multiplayer = Multiplayer;
window.addEventListener('DOMContentLoaded', () => Multiplayer.init());
