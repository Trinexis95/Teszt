<?php

use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\FloorplanController;
use App\Http\Controllers\Api\ImageController;
use Illuminate\Support\Facades\Route;

// API routes
Route::prefix('api')->group(function () {
    
    Route::get('/', function () {
        return response()->json(['message' => 'BauDok API']);
    });
    
    Route::get('/tags', function () {
        return response()->json([
            'tags' => [
                'villanyszerelés', 'csövezés', 'burkolás', 'festés',
                'szigetelés', 'gipszkarton', 'hiba', 'javítás',
                'ablak', 'ajtó', 'fűtés', 'klíma', 'szaniter'
            ]
        ]);
    });
    
    // Projects
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::get('/projects/{id}', [ProjectController::class, 'show']);
    Route::put('/projects/{id}', [ProjectController::class, 'update']);
    Route::delete('/projects/{id}', [ProjectController::class, 'destroy']);
    
    // Floorplans
    Route::get('/projects/{projectId}/floorplans', [FloorplanController::class, 'index']);
    Route::post('/projects/{projectId}/floorplans', [FloorplanController::class, 'store']);
    Route::get('/floorplans/{id}/data', [FloorplanController::class, 'show']);
    Route::get('/floorplans/{id}/images', [FloorplanController::class, 'images']);
    Route::delete('/floorplans/{id}', [FloorplanController::class, 'destroy']);
    
    // Images
    Route::get('/projects/{projectId}/images', [ImageController::class, 'index']);
    Route::post('/projects/{projectId}/images', [ImageController::class, 'store']);
    Route::get('/images/{id}/data', [ImageController::class, 'show']);
    Route::put('/images/{id}', [ImageController::class, 'update']);
    Route::delete('/images/{id}', [ImageController::class, 'destroy']);
});

// Frontend - serve React app
Route::get('/{any?}', function () {
    return file_get_contents(public_path('index.html'));
})->where('any', '.*');
