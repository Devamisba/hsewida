<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use App\Models\User;
use App\Models\Role;

class UserController extends Controller
{
    /**
     * Get all users with role and search/filter support.
     */
    public function index(Request $request)
    {
        $query = User::with(['role:id,code,name']);

        if ($request->filled('role')) {
            $query->whereHas('role', function ($q) use ($request) {
                $q->where('code', $request->role);
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nik', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%")
                  ->orWhere('department', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * Store a newly created user in database.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nik' => 'required|string|max:50|unique:users,nik',
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'role_id' => 'required|exists:roles,id',
            'company_name' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'phone_number' => 'nullable|string|max:50',
        ]);

        $user = User::create([
            'nik' => $validated['nik'],
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $validated['role_id'],
            'company_name' => $validated['company_name'] ?? null,
            'department' => $validated['department'] ?? null,
            'phone_number' => $validated['phone_number'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil didaftarkan.',
            'data' => $user->load('role:id,code,name'),
        ], 201);
    }

    /**
     * Update an existing user's details.
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'nik' => ['sometimes', 'required', 'string', 'max:50', Rule::unique('users')->ignore($user->id)],
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role_id' => 'sometimes|required|exists:roles,id',
            'company_name' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'phone_number' => 'nullable|string|max:50',
            'password' => 'nullable|string|min:6',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Data pengguna berhasil diperbarui.',
            'data' => $user->load('role:id,code,name'),
        ]);
    }

    /**
     * Reset user password by Admin.
     */
    public function resetPassword(Request $request, $id)
    {
        $request->validate([
            'new_password' => 'required|string|min:6',
        ]);

        $user = User::findOrFail($id);
        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password pengguna ' . $user->name . ' berhasil di-reset.',
        ]);
    }

    /**
     * Delete / Deactivate a user.
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);

        // Prevent self-deletion of current user
        if (auth()->id() === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri.',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengguna ' . $user->name . ' berhasil dinonaktifkan.',
        ]);
    }
}
