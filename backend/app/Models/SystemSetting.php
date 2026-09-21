<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'label',
        'description',
        'unit',
        'group',
        'type',
    ];

    /**
     * Get a setting value by key with optional fallback.
     */
    public static function getValue(string $key, $default = null)
    {
        try {
            $setting = static::where('key', $key)->first();
            if ($setting) {
                if ($setting->type === 'number') {
                    return is_numeric($setting->value) ? (int)$setting->value : $default;
                }
                return $setting->value;
            }
        } catch (\Throwable $e) {
            // Fallback gracefully if database or table not ready
        }
        return $default;
    }

    /**
     * Set or update a setting value.
     */
    public static function setValue(string $key, $value): bool
    {
        $setting = static::where('key', $key)->first();
        if ($setting) {
            $setting->value = (string)$value;
            return $setting->save();
        }
        return false;
    }
}
