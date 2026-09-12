<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PermitWorker;
use App\Models\PermitDocument;

class PermitDocumentController extends Controller
{
    /**
     * Upload worker identity card or BPJS / insurance document.
     */
    public function uploadWorkerDocument(Request $request, $permitId, $workerId)
    {
        $worker = PermitWorker::where('work_permit_id', $permitId)
            ->findOrFail($workerId);

        $request->validate([
            'document_type' => 'required|in:BPJS_TK,BPJS_Kesehatan,Asuransi_Lain',
            'file' => 'required|file|mimes:jpeg,png,jpg,pdf|max:5120', // Max 5MB
        ]);

        $file = $request->file('file');
        $fileName = time() . '_' . $file->getClientOriginalName();
        $path = $file->storeAs('documents/workers', $fileName, 'public');

        $doc = PermitDocument::create([
            'permit_worker_id' => $worker->id,
            'document_type' => $request->document_type,
            'file_path' => '/storage/' . $path,
            'is_verified' => false,
            'uploaded_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Dokumen berhasil diunggah.',
            'data' => $doc,
        ], 201);
    }

    /**
     * Verify document validity (GA Dept Head).
     */
    public function verifyDocument(Request $request, $docId)
    {
        $doc = PermitDocument::findOrFail($docId);
        $doc->is_verified = true;
        $doc->save();

        return response()->json([
            'success' => true,
            'message' => 'Dokumen kepesertaan berhasil diverifikasi.',
            'data' => $doc,
        ]);
    }
}
