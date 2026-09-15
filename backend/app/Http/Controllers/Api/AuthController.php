<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\User;

class AuthController extends Controller
{
    /**
     * Login user & generate Sanctum token.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string',
            'password' => 'required|string',
        ]);

        $input = trim($request->email);

        // Search by NIK or email directly in database (case-insensitive)
        $user = User::with(['role.permissions'])
            ->whereRaw('LOWER(nik) = ?', [strtolower($input)])
            ->orWhereRaw('LOWER(email) = ?', [strtolower($input)])
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Kredensial NIK atau password yang dimasukkan tidak sesuai.'],
            ]);
        }

        // Create Sanctum Token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'nik' => $user->nik,
                    'name' => $user->name,
                    'email' => $user->email,
                    'company_name' => $user->company_name,
                    'department' => $user->department,
                    'phone_number' => $user->phone_number,
                    'role' => $user->role ? [
                        'id' => $user->role->id,
                        'code' => $user->role->code,
                        'name' => $user->role->name,
                    ] : null,
                    'permissions' => $user->role ? $user->role->permissions->pluck('code') : [],
                ],
            ],
        ]);
    }

    /**
     * Logout and revoke current token.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil dan token telah dinonaktifkan.',
        ]);
    }

    /**
     * Get authenticated user profile.
     */
    public function me(Request $request)
    {
        $user = $request->user()->load(['role.permissions']);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'nik' => $user->nik,
                'name' => $user->name,
                'email' => $user->email,
                'company_name' => $user->company_name,
                'department' => $user->department,
                'phone_number' => $user->phone_number,
                'role' => $user->role ? [
                    'id' => $user->role->id,
                    'code' => $user->role->code,
                    'name' => $user->role->name,
                ] : null,
                'permissions' => $user->role ? $user->role->permissions->pluck('code') : [],
            ],
        ]);
    }

    /**
     * Update user profile.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone_number' => 'sometimes|nullable|string|max:30',
            'password' => 'sometimes|nullable|string|min:6',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui.',
            'data' => $user->fresh(['role.permissions']),
        ]);
    }
}
