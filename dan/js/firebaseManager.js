const FirebaseManager = {
    user: null,
    profile: null,
    roomRef: null,

    init: function (onAuthCallback) {
        auth.onAuthStateChanged(async (u) => {
            if (u) {
                this.user = u;
                this.profile = await this.ensureProfile(u);
                onAuthCallback(true, this.profile);
            } else {
                onAuthCallback(false);
            }
        });
    },

    ensureProfile: async function (user) {
        const ref = db.collection('users').doc(user.uid);
        const snap = await ref.get();
        if (snap.exists) return snap.data();

        const newProfile = {
            uid: user.uid,
            displayName: user.displayName || "Guest_" + Math.floor(Math.random() * 1000),
            shortId: Math.floor(100000 + Math.random() * 900000),
            stats: { score: 0, kills: 0 },
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        await ref.set(newProfile);
        return newProfile;
    },

    createRoom: async function () {
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        const ref = db.collection('rooms').doc(code);
        await ref.set({
            hostId: this.user.uid,
            status: 'waiting',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return code;
    },

    joinRoom: async function (code) {
        const ref = db.collection('rooms').doc(code);
        const doc = await ref.get();
        if (!doc.exists) throw new Error("Room Not Found");

        // Add player
        await ref.collection('players').doc(this.user.uid).set({
            uid: this.user.uid,
            name: this.profile.displayName,
            ready: true,
            score: 0,
            hp: 100,
            x: 400, y: 500
        });

        this.roomRef = ref;
        return { isHost: doc.data().hostId === this.user.uid };
    },

    leaveRoom: async function () {
        if (this.roomRef) {
            await this.roomRef.collection('players').doc(this.user.uid).delete();
            this.roomRef = null;
        }
    },

    saveHistory: function (score) {
        if (this.user) {
            db.collection('user_stats').doc(this.user.uid).collection('history').add({
                score: score,
                date: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    }
};
