// Auth Logic (Firestore Version)
const Auth = {
    user: null,
    profile: null,

    init: function () {
        document.getElementById('btn-login-google').addEventListener('click', this.loginGoogle);
        document.getElementById('btn-login-guest').addEventListener('click', this.loginGuest);

        auth.onAuthStateChanged(async (user) => {
            if (user) {
                console.log("User logged in:", user.uid);
                this.user = user;
                await this.handleUserProfile(user);
                GameUI.showMainHud();
            } else {
                console.log("No user logged in.");
                GameUI.showAuth();
            }
        });
    },

    loginGoogle: function () {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch(e => {
            console.error(e);
            alert("Login Failed: " + e.message + "\n\nEnable Google Sign-In in Firebase Console -> Build -> Authentication.");
        });
    },

    loginGuest: function () {
        auth.signInAnonymously().catch(e => {
            console.error(e);
            alert("Guest Login Failed: " + e.message + "\n\nEnable Anonymous Auth in Firebase Console -> Build -> Authentication.");
        });
    },

    handleUserProfile: async function (user) {
        // FIRESTORE: Collection 'users', Document 'uid'
        const userRef = db.collection('users').doc(user.uid);

        try {
            const doc = await userRef.get();
            if (doc.exists) {
                this.profile = doc.data();
            } else {
                console.log("Creating new user profile...");
                const shortId = this.generateShortId();
                const newProfile = {
                    uid: user.uid,
                    email: user.email || "guest",
                    displayName: user.displayName || "Guest Agent",
                    shortId: shortId,
                    friends: {},
                    currency: 0,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                await userRef.set(newProfile);
                this.profile = newProfile;
            }
            GameUI.updateUserInfo(this.profile);
        } catch (err) {
            console.error("Error fetching profile:", err);
            alert("Database Error: " + err.message + "\n\nDid you create the Firestore Database in the Console?");
        }
    },

    generateShortId: function () {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
};

window.Auth = Auth;
window.addEventListener('DOMContentLoaded', () => Auth.init());
