<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Image extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = [
        'project_id', 'category', 'description', 'filename', 'path',
        'tags', 'location', 'linked_image_id', 'floorplan_id',
        'floorplan_x', 'floorplan_y'
    ];
    
    protected $casts = [
        'tags' => 'array',
        'location' => 'array',
    ];
    
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
    
    public function floorplan()
    {
        return $this->belongsTo(Floorplan::class);
    }
    
    public function linkedImage()
    {
        return $this->belongsTo(Image::class, 'linked_image_id');
    }
}
