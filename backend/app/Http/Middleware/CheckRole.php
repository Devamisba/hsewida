<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string[] ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user || !$user->role) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: User role not assigned.'
            ], 403);
        }

        // Admin always has bypass
        if ($user->role->code === 'admin') {
            return $next($request);
        }

        if (!in_array($user->role->code, $roles)) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden: You do not have permission to access this resource.'
            ], 403);
        }

        return $next($request);
    }
}
