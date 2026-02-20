<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Project::query();
        
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
        
        return $query->orderBy('created_at', 'desc')->get();
    }
    
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);
        
        $project = Project::create([
            'name' => $request->name,
            'description' => $request->description,
        ]);
        
        return response()->json($project, 201);
    }
    
    public function show($id)
    {
        $project = Project::with(['images' => function($q) {
            $q->orderBy('created_at', 'desc');
        }, 'floorplans' => function($q) {
            $q->orderBy('created_at', 'desc');
        }])->findOrFail($id);
        
        $data = $project->toArray();
        
        // Add marker_count to floorplans
        foreach ($data['floorplans'] as &$fp) {
            $fp['marker_count'] = $project->images()->where('floorplan_id', $fp['id'])->count();
        }
        
        return response()->json($data);
    }
    
    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        
        $project->update($request->only(['name', 'description']));
        
        return response()->json($project);
    }
    
    public function destroy($id)
    {
        $project = Project::findOrFail($id);
        
        // Delete all images
        foreach ($project->images as $image) {
            if (file_exists(public_path($image->path))) {
                unlink(public_path($image->path));
            }
        }
        
        // Delete all floorplans
        foreach ($project->floorplans as $fp) {
            if (file_exists(public_path($fp->path))) {
                unlink(public_path($fp->path));
            }
        }
        
        $project->delete();
        
        return response()->json(['message' => 'Projekt törölve']);
    }
}
