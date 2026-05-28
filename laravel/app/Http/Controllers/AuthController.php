<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    // Redirect ke Google
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    // Callback dari Google
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Exception $e) {
            \Log::error('Google OAuth Error: ' . $e->getMessage());
            return redirect(env('FRONTEND_URL') . '/login?error=google_failed');
        }

        $user = User::updateOrCreate(
            ['google_id' => $googleUser->getId()],
            [
                'name'   => $googleUser->getName(),
                'email'  => $googleUser->getEmail(),
                'avatar' => $googleUser->getAvatar(),
                'role'   => 'user',
            ]
        );

        // Buat Sanctum token
        $token = $user->createToken('google-login')->plainTextToken;

        // Redirect ke frontend dengan token
        return redirect(env('FRONTEND_URL') . '/auth/callback?token=' . $token);
    }

    // Get user yang sedang login
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    // Logout — hapus token
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }
}
