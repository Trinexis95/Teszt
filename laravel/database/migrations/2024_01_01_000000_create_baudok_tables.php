<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('image_count')->default(0);
            $table->timestamps();
        });

        Schema::create('floorplans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('project_id');
            $table->string('name');
            $table->string('filename');
            $table->string('path');
            $table->timestamps();
            
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
        });

        Schema::create('images', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('project_id');
            $table->enum('category', ['alapszereles', 'szerelvenyezes', 'atadas']);
            $table->text('description')->nullable();
            $table->string('filename');
            $table->string('path');
            $table->json('tags')->nullable();
            $table->json('location')->nullable();
            $table->uuid('linked_image_id')->nullable();
            $table->uuid('floorplan_id')->nullable();
            $table->float('floorplan_x')->nullable();
            $table->float('floorplan_y')->nullable();
            $table->timestamps();
            
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->foreign('floorplan_id')->references('id')->on('floorplans')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('images');
        Schema::dropIfExists('floorplans');
        Schema::dropIfExists('projects');
    }
};
