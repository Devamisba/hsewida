<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Notification;

class NotificationController extends Controller
{
    /**
     * Get notifications for authenticated user.
     */
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $notifications,
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(Request $request, $id)
    {
        $notif = Notification::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $notif->is_read = true;
        $notif->save();

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi ditandai telah dibaca.',
            'data' => $notif,
        ]);
    }
}
