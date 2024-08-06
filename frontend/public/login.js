document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('error');

    try {
        const response = await fetch('https://tms.up.school/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            window.location.href = '/'; // Redirect to the main page after login
        } else {
            errorElement.textContent = data.error;
        }
    } catch (error) {
        errorElement.textContent = 'An error occurred';
    }
});
