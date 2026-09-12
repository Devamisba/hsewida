<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Role;
use App\Models\Permission;

class RolePermissionController extends Controller
{
    /**
     * Get all roles with permissions and user count.
     */
    public function indexRoles()
    {
        $roles = Role::with(['permissions'])
            ->withCount('users')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $roles,
        ]);
    }

    /**
     * Create a new role.
     */
    public function storeRole(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:roles,code|max:50',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'permission_ids' => 'nullable|array',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        $role = Role::create([
            'code' => $validated['code'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => true,
        ]);

        if (!empty($validated['permission_ids'])) {
            $role->permissions()->sync($validated['permission_ids']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Role berhasil ditambahkan.',
            'data' => $role->load('permissions'),
        ], 201);
    }

    /**
     * Update an existing role.
     */
    public function updateRole(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
            'permission_ids' => 'nullable|array',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        $role->update($validated);

        if (isset($validated['permission_ids'])) {
            $role->permissions()->sync($validated['permission_ids']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Role berhasil diperbarui.',
            'data' => $role->load('permissions'),
        ]);
    }

    /**
     * Get all available permissions grouped.
     */
    public function indexPermissions()
    {
        $permissions = Permission::all()->groupBy('group');

        return response()->json([
            'success' => true,
            'data' => $permissions,
        ]);
    }

    /**
     * Assign permissions to a role.
     */
    public function updateRolePermissions(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        $role->permissions()->sync($validated['permission_ids']);

        return response()->json([
            'success' => true,
            'message' => 'Hak akses role berhasil diperbarui.',
            'data' => $role->load('permissions'),
        ]);
    }
}
