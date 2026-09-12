<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Location;
use App\Models\PermitTypeOption;
use App\Models\PpeOption;
use App\Models\Vendor;

class MasterDataController extends Controller
{
    // --- LOCATIONS ---
    public function getLocations(Request $request)
    {
        $query = Location::query();
        if ($request->boolean('active_only', true)) {
            $query->where('is_active', true);
        }
        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function storeLocation(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:locations,name|max:100',
            'description' => 'nullable|string|max:255',
        ]);
        $loc = Location::create($validated);
        return response()->json(['success' => true, 'message' => 'Lokasi berhasil ditambahkan.', 'data' => $loc], 201);
    }

    public function updateLocation(Request $request, $id)
    {
        $loc = Location::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100|unique:locations,name,' . $loc->id,
            'description' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
        ]);
        $loc->update($validated);
        return response()->json(['success' => true, 'message' => 'Lokasi berhasil diperbarui.', 'data' => $loc]);
    }

    // --- PERMIT TYPES ---
    public function getPermitTypes(Request $request)
    {
        $query = PermitTypeOption::query();
        if ($request->boolean('active_only', true)) {
            $query->where('is_active', true);
        }
        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function storePermitType(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:permit_type_options,name|max:100',
        ]);
        $pt = PermitTypeOption::create($validated);
        return response()->json(['success' => true, 'message' => 'Opsi kategori ijin berhasil ditambahkan.', 'data' => $pt], 201);
    }

    // --- PPE OPTIONS ---
    public function getPpeOptions(Request $request)
    {
        $query = PpeOption::query();
        if ($request->boolean('active_only', true)) {
            $query->where('is_active', true);
        }
        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function storePpeOption(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:ppe_options,name|max:100',
        ]);
        $ppe = PpeOption::create($validated);
        return response()->json(['success' => true, 'message' => 'Opsi APD berhasil ditambahkan.', 'data' => $ppe], 201);
    }

    // --- VENDORS ---
    public function getVendors(Request $request)
    {
        $vendors = Vendor::with('picVendorUser:id,name,email,phone_number')
            ->withCount('workPermits')
            ->get();
        return response()->json(['success' => true, 'data' => $vendors]);
    }

    public function storeVendor(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'main_contact_name' => 'nullable|string|max:255',
            'main_contact_phone' => 'nullable|string|max:50',
            'pic_vendor_user_id' => 'nullable|exists:users,id',
            'status' => 'sometimes|in:Aktif,Nonaktif,Blacklist',
        ]);
        $vendor = Vendor::create($validated);
        return response()->json(['success' => true, 'message' => 'Vendor berhasil didaftarkan.', 'data' => $vendor->load('picVendorUser')], 201);
    }

    public function updateVendor(Request $request, $id)
    {
        $vendor = Vendor::findOrFail($id);
        $validated = $request->validate([
            'company_name' => 'sometimes|required|string|max:255',
            'address' => 'nullable|string',
            'main_contact_name' => 'nullable|string|max:255',
            'main_contact_phone' => 'nullable|string|max:50',
            'pic_vendor_user_id' => 'nullable|exists:users,id',
            'status' => 'sometimes|in:Aktif,Nonaktif,Blacklist',
        ]);
        $vendor->update($validated);
        return response()->json(['success' => true, 'message' => 'Data vendor berhasil diperbarui.', 'data' => $vendor->load('picVendorUser')]);
    }
}
