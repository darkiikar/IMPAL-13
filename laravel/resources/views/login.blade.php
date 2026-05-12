<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nearify — Login</title>
  <link rel="stylesheet" href="{{ asset('css/login.css') }}">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
  <link rel="shortcut icon" href="{{ asset('assets/image/Logo.png') }}" type="image/x-icon">
</head>
<body>
  <main class="container">
    <section class="left-section">
      <h1 class="text1-left">Log in</h1>
      <p class="text2-left">Hello there!<br>Welcome back</p>

      <div class="hr-container">
        <hr>
        <p class="text3-left">Sign in with Social Media</p>
      </div>

      <div class="social-media-logo">
        <button class="social-btn" aria-label="Login dengan Google">
          <img src="{{ asset('assets/image/google.png') }}" alt="Google logo">
        </button>
        <button class="social-btn" aria-label="Login dengan Facebook">
          <img src="{{ asset('assets/image/facebook.png') }}" alt="Facebook logo">
        </button>
        <button class="social-btn" aria-label="Login dengan X (Twitter)">
          <img src="{{ asset('assets/image/twitter.png') }}" alt="X logo">
        </button>
      </div>
    </section>

    <section class="right-section">
      <form id="loginForm" novalidate>
        <label for="email">Email Address</label>
        <input
          type="email"
          id="email"
          placeholder="Your E-mail Address"
          name="email"
          class="email-input"
          required
        >
        <span class="field-error" id="emailError"></span>

        <label for="password">Password</label>
        <input
          type="password"
          id="password"
          placeholder="********"
          name="password"
          class="password-input"
          required
          minlength="6"
        >
        <span class="field-error" id="passwordError"></span>

        <div class="checkbox-container">
          <input type="checkbox" id="remember" name="remember">
          <label for="remember" class="rememberme-label">Remember me</label>
          <a href="#" class="forgot-password">Forgot password?</a>
        </div>

        <button type="submit">Login</button>
      </form>

      <p class="last-text">
        Don't have an account?
        <a href="{{ url('signup') }}" class="signup-text">Sign up</a>
      </p>
    </section>
  </main>

  <script>
    const form = document.getElementById('loginForm');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;

      const email = document.getElementById('email');
      const emailError = document.getElementById('emailError');
      const password = document.getElementById('password');
      const passwordError = document.getElementById('passwordError');

      // Validasi email
      if (!email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        emailError.textContent = 'Masukkan email yang valid.';
        email.classList.add('input-error');
        valid = false;
      } else {
        emailError.textContent = '';
        email.classList.remove('input-error');
      }

      // Validasi password
      if (!password.value || password.value.length < 6) {
        passwordError.textContent = 'Password minimal 6 karakter.';
        password.classList.add('input-error');
        valid = false;
      } else {
        passwordError.textContent = '';
        password.classList.remove('input-error');
      }

      if (valid) {
        // Simulasi login berhasil → arahkan ke homepage
        window.location.href = "{{ url('homepage') }}";
      }
    });

    // Hapus pesan error saat user mulai mengetik
    document.querySelectorAll('input[type="email"], input[type="password"]').forEach(input => {
      input.addEventListener('input', () => {
        input.classList.remove('input-error');
        const errorEl = document.getElementById(input.id + 'Error');
        if (errorEl) errorEl.textContent = '';
      });
    });
  </script>
</body>
</html>
