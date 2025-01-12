/****************************************
 * 1. Initialize LeanCloud
 ****************************************/
AV.init({
    appId: 'ZxhupKKmXgSXHf1uyEckW1xv-gzGzoHsz',
    appKey: '3YQM3gLlbLMBy3mmZulgwIlS',
    serverURL: 'https://zxhupkkm.lc-cn-n1-shared.com'
});

// DOM references for signup/login
const signupUsername = document.getElementById('signup-username');
const signupPassword = document.getElementById('signup-password');
const btnSignup = document.getElementById('btn-signup');

const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const btnLogin = document.getElementById('btn-login');

/****************************************
 * 2. Sign Up
 ****************************************/
btnSignup.addEventListener('click', async () => {
    const username = signupUsername.value.trim();
    const password = signupPassword.value.trim();

    if (!username || !password) {
        alert('Please enter a username and password.');
        return;
    }

    try {
        const user = new AV.User();
        user.setUsername(username);
        user.setPassword(password);

        await user.signUp();
        alert('Sign up successful (pending approval)!');
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (err) {
        console.error('Sign up error:', err);
        alert(`Sign up failed: ${err.message}`);
    }
});

/****************************************
 * 3. Login
 ****************************************/
btnLogin.addEventListener('click', async () => {
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();

    if (!username || !password) {
        alert('Please enter a username and password.');
        return;
    }

    try {
        await AV.User.logIn(username, password);
        alert('Login successful!');
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (err) {
        console.error('Login error:', err);
        alert(`Login failed: ${err.message}`);
    }
});