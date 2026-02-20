<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Floorplan;
use App\Models\Project;
use Illuminate\Http\Request;

class FloorplanController extends Controller
{
    public function index($projectId)
    {
        $floorplans = Floorplan::where('project_id', $projectId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($fp) {
                $fp->marker_count = $fp->images()->count();
                return $fp;
            });
        
        return response()->json($floorplans);
    }
    
    public function store(Request $request, $projectId)
    {
        $project = Project::findOrFail($projectId);
        
        $request->validate([
            'name' => 'required|string|max:255',
            'file' => 'required|image|max:20480',
        ]);
        
        $file = $request->file('file');
        $filename = time() . '_' . $file->getClientOriginalName();
        $path = 'uploads/floorplans/' . $filename;
        $file->move(public_path('uploads/floorplans'), $filename);
        
        $floorplan = Floorplan::create([
            'project_id' => $projectId,
            'name' => $request->name,
            'filename' => $file->getClientOriginalName(),
            'path' => $path,
        ]);
        
        $floorplan->marker_count = 0;
        
        return response()->json($floorplan, 201);
    }
    
    public function show($id)
    {
        $floorplan = Floorplan::findOrFail($id);
        $path = public_path($floorplan->path);
        
        if (!file_exists($path)) {
            abort(404);
        }
        
        return response()->file($path);
    }
    
    public function images($id)
    {
        $images = \App\Models\Image::where('floorplan_id', $id)->get();
        return response()->json($images);
    }
    
    public function destroy($id)
    {
        $floorplan = Floorplan::findOrFail($id);
        
        // Remove floorplan references from images
        \App\Models\Image::where('floorplan_id', $id)->update([
            'floorplan_id' => null,
            'floorplan_x' => null,
            'floorplan_y' => null,
        ]);
        
        // Delete file
        if (file_exists(public_path($floorplan->path))) {
            unlink(public_path($floorplan->path));
        }
        
        $floorplan->delete();
        
        return response()->json(['message' => 'Tervrajz törölve']);
    }
}
