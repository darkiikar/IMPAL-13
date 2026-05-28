<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Notification;

class TopUpController extends Controller
{
    public function __construct()
    {
        // Set konfigurasi Midtrans
        Config::$serverKey    = config('midtrans.server_key');
        Config::$isProduction = config('midtrans.is_production');
        Config::$isSanitized  = config('midtrans.is_sanitized');
        Config::$is3ds        = config('midtrans.is_3ds');

        // Nonaktifkan verifikasi SSL untuk localhost/development
        Config::$curlOptions = [
            CURLOPT_SSL_VERIFYHOST => 0,
            CURLOPT_SSL_VERIFYPEER => 0,
            CURLOPT_HTTPHEADER => [] // Mencegah bug "Undefined array key 10023" di PHP 8+
        ];
    }

    /**
     * Buat Snap Token untuk frontend Midtrans Snap.js
     */
    public function getSnapToken(Request $request)
    {
        $request->validate([
            'amount' => 'required|integer|min:10000|max:10000000',
        ]);

        $user   = $request->user();
        $amount = (int) $request->input('amount');

        // Order ID unik: NEARIFY-{userId}-{timestamp}
        $orderId = 'NEARIFY-' . $user->id . '-' . time();

        $params = [
            'transaction_details' => [
                'order_id'     => $orderId,
                'gross_amount' => $amount,
            ],
            'customer_details' => [
                'first_name' => $user->name,
                'email'      => $user->email,
            ],
        ];

        try {
            $snapToken = Snap::getSnapToken($params);
            return response()->json([
                'snap_token' => $snapToken,
                'order_id'   => $orderId,
            ]);
        } catch (\Exception $e) {
            \Log::error('Midtrans getSnapToken Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Callback/Notification dari Midtrans server.
     * Endpoint ini dipanggil oleh Midtrans saat status transaksi berubah.
     */
    public function handleCallback(Request $request)
    {
        try {
            $notification = new Notification();

            $transactionStatus = $notification->transaction_status;
            $orderId           = $notification->order_id;
            $grossAmount       = (int) $notification->gross_amount;
            $fraudStatus       = $notification->fraud_status ?? null;

            \Log::info("Midtrans Callback: order={$orderId}, status={$transactionStatus}, fraud={$fraudStatus}");

            // Ekstrak user ID dari order_id format: NEARIFY-{userId}-{timestamp}
            $parts  = explode('-', $orderId);
            $userId = $parts[1] ?? null;

            if (!$userId) {
                \Log::error("Midtrans Callback: cannot extract user ID from order_id={$orderId}");
                return response()->json(['message' => 'Invalid order ID'], 400);
            }

            $user = User::find($userId);
            if (!$user) {
                \Log::error("Midtrans Callback: user not found for ID={$userId}");
                return response()->json(['message' => 'User not found'], 404);
            }

            // Update saldo berdasarkan status transaksi
            if ($transactionStatus === 'capture' || $transactionStatus === 'settlement') {
                if ($fraudStatus === null || $fraudStatus === 'accept') {
                    $user->saldo = ($user->saldo ?? 0) + $grossAmount;
                    $user->save();
                    \Log::info("Saldo updated: user={$userId}, added={$grossAmount}, new_saldo={$user->saldo}");
                }
            }

            return response()->json(['message' => 'OK']);
        } catch (\Exception $e) {
            \Log::error('Midtrans Callback Error: ' . $e->getMessage());
            return response()->json(['message' => 'Error'], 500);
        }
    }
}
