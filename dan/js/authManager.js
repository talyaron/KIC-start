const AuthManager = {
    init: function () {
        document.getElementById('btn-login-google').addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider);
        });

        document.getElementById('btn-login-guest').addEventListener('click', () => {
            auth.signInAnonymously();
        });
    },

    onLogin: function (profile) {
        document.getElementById('screen-auth').classList.remove('active');
        document.getElementById('screen-lobby').classList.add('active');

        // Update UI
        document.getElementById('display-name').textContent = profile.displayName.toUpperCase();
        document.getElementById('display-id').textContent = "ID:" + profile.shortId;
    }
};
