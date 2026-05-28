<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TopUpController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me',      [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/topup/token', [TopUpController::class, 'getSnapToken']);
});

// Midtrans webhook — tidak perlu auth (dipanggil server Midtrans)
Route::post('/midtrans/callback', [TopUpController::class, 'handleCallback']);
