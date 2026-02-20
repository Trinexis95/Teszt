<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Image;
use App\Models\Project;
use Illuminate\Http\Request;

class ImageController extends Controller
{
    public function index(Request $request, $projectId)
    {
        $query = Image::where('project_id', $projectId);
        
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }
        
        if ($request->has('tag')) {
            $query->whereJsonContains('tags', $request->tag);
        }
        
        return $query->orderBy('created_at', 'desc')->get();
    }
    
    public function store(Request $request, $projectId)
    {
        $project = Project::findOrFail($projectId);
        
        $request->validate([
            'file' => 'required|image|max:20480',
            'category' => 'required|in:alapszereles,szerelvenyezes,atadas',
        ]);
        
        $file = $request->file('file');
        $filename = time() . '_' . $file->getClientOriginalName();
        $path = 'uploads/images/' . $filename;
        $file->move(public_path('uploads/images'), $filename);
        
        // Parse tags
        $tags = [];
        if ($request->has('tags') && $request->tags) {
            $tags = array_filter(array_map('trim', explode(',', $request->tags)));
        }
        
        // Build location
        $location = null;
        if ($request->has('lat') && $request->has('lng') && $request->lat && $request->lng) {
            $location = [
                'lat' => (float) $request->lat,
                'lng' => (float) $request->lng,
                'address' => $request->address ?? '',
            ];
        }
        
        $image = Image::create([
            'project_id' => $projectId,
            'category' => $request->category,
            'description' => $request->description ?? '',
            'filename' => $file->getClientOriginalName(),
            'path' => $path,
            'tags' => $tags,
            'location' => $location,
            'floorplan_id' => $request->floorplan_id,
            'floorplan_x' => $request->floorplan_x,
            'floorplan_y' => $request->floorplan_y,
        ]);
        
        // Update project image count
        $project->image_count = $project->images()->count();
        $project->save();
        
        return response()->json($image, 201);
    }
    
    public function show($id)
    {
        $image = Image::findOrFail($id);
        $path = public_path($image->path);
        
        if (!file_exists($path)) {
            abort(404);
        }
        
        return response()->file($path);
    }
    
    public function update(Request $request, $id)
    {
        $image = Image::findOrFail($id);
        
        $data = [];
        
        if ($request->has('description')) {
            $data['description'] = $request->description;
        }
        
        if ($request->has('tags')) {
            $data['tags'] = $request->tags;
        }
        
        if ($request->has('location')) {
            $data['location'] = $request->location;
        }
        
        if ($request->has('linked_image_id')) {
            $data['linked_image_id'] = $request->linked_image_id ?: null;
        }
        
        if ($request->has('floorplan_id')) {
            $data['floorplan_id'] = $request->floorplan_id ?: null;
        }
        
        if ($request->has('floorplan_x')) {
            $data['floorplan_x'] = $request->floorplan_x;
        }
        
        if ($request->has('floorplan_y')) {
            $data['floorplan_y'] = $request->floorplan_y;
        }
        
        $image->update($data);
        
        return response()->json(['message' => 'Kép frissítve']);
    }
    
    public function destroy($id)
    {
        $image = Image::findOrFail($id);
        $projectId = $image->project_id;
        
        // Remove linked references
        Image::where('linked_image_id', $id)->update(['linked_image_id' => null]);
        
        // Delete file
        if (file_exists(public_path($image->path))) {
            unlink(public_path($image->path));
        }
        
        $image->delete();
        
        // Update project image count
        $project = Project::find($projectId);
        if ($project) {
            $project->image_count = $project->images()->count();
            $project->save();
        }
        
        return response()->json(['message' => 'Kép törölve']);
    }
}
