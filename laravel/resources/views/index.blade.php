<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nearify</title>
  <link rel="stylesheet" href="{{ asset('css/main.css') }}">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
  <link rel="shortcut icon" href="{{ asset('assets/image/Logo.png') }}" type="image/x-icon">
</head>
<body>
  <main class="container">
    <section class="left-section">
      <img class="nearify-logo" src="{{ asset('assets/image/Logo.png') }}" alt="Logo Nearify">
      <p>Tempatnya Mahasiswa</p>
      <img class="loading-logo" src="{{ asset('assets/image/loading.png') }}" alt="Loading animasi">
    </section>

    <section class="right-section">
      <h1 class="text1">Selamat Datang di Nearify</h1>
      <p class="text2">Temukan makanan dan laundry lebih mudah bersama Nearify.</p>
      <a href="{{ url('login') }}"><button class="login-button">Login</button></a>
      <a href="{{ url('signup') }}"><button class="signup-button">Sign Up</button></a>
      <p class="text3">V 1.00</p>
    </section>
  </main>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelector('.right-section').style.opacity = '0';
      document.querySelector('.left-section').style.opacity = '0';

      setTimeout(() => {
        document.querySelector('.left-section').style.transition = 'opacity 0.6s ease';
        document.querySelector('.left-section').style.opacity = '1';
      }, 100);

      setTimeout(() => {
        document.querySelector('.right-section').style.transition = 'opacity 0.6s ease';
        document.querySelector('.right-section').style.opacity = '1';
      }, 400);
    });
  </script>
</body>
</html>
