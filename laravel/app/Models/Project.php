<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Project extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = ['name', 'description', 'image_count'];
    
    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            $model->id = (string) Str::uuid();
        });
    }
    
    public function images()
    {
        return $this->hasMany(Image::class);
    }
    
    public function floorplans()
    {
        return $this->hasMany(Floorplan::class);
    }
}
