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

        $inputIdentifier = trim($request->email);

        // Map common NIKs and aliases to seeded accounts
        $nikMap = [
            'sa12345' => 'admin@hse.com',
            'admin' => 'admin@hse.com',
            'vendor' => 'vendor@hse.com',
            'vn10001' => 'vendor@hse.com',
            'pic' => 'pic@hse.com',
            'pc10002' => 'pic@hse.com',
            'hse' => 'hse@hse.com',
            'hs10003' => 'hse@hse.com',
            'ga_dept' => 'ga_dept@hse.com',
            'ga10004' => 'ga_dept@hse.com',
            'ga_div' => 'ga_div@hse.com',
            'ga10005' => 'ga_div@hse.com',
        ];

        $targetEmail = $nikMap[strtolower($inputIdentifier)] ?? $inputIdentifier;

        $user = User::with(['role.permissions'])
            ->where('email', $targetEmail)
            ->first();

        if (!$user) {
            $user = User::with(['role.permissions'])
                ->where('email', 'like', $inputIdentifier . '%')
                ->first();
        }

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Kredensial NIK/email atau password yang dimasukkan tidak sesuai.'],
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
