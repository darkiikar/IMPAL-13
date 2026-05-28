<?php
namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;

    protected $fillable = ['name', 'email', 'password', 'google_id', 'avatar', 'role', 'saldo'];
    protected $hidden   = ['password', 'remember_token'];
}
