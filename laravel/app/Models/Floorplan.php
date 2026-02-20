<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Floorplan extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = ['project_id', 'name', 'filename', 'path'];
    
    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            $model->id = (string) Str::uuid();
        });
    }
    
    public function project()
    {
        return $this->belongsTo(Project::class);
    }
    
    public function images()
    {
        return $this->hasMany(Image::class);
    }
    
    public function getMarkerCountAttribute()
    {
        return $this->images()->count();
    }
}
