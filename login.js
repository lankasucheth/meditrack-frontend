const LOGIN_API_URL = "http://localhost:8080/api/login";

document.getElementById("login-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(LOGIN_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const result = await response.json();
            sessionStorage.setItem("loggedIn", "true");
            sessionStorage.setItem("authToken", result.token);
            document.getElementById("login-message").innerText = "Login successful!";
            window.location.href = "index.html";
        } else {
            document.getElementById("login-message").innerText = "Invalid username or password.";
        }
    } catch (error) {
        console.error("Login error:", error);
        document.getElementById("login-message").innerText = "Something went wrong. Try again.";
    }
});