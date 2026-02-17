import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { 
  FolderPlus, Search, ArrowLeft, Upload, Trash2, Edit3, 
  X, Calendar, Filter, Image as ImageIcon, FolderOpen,
  ChevronRight, Clock, Camera
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Category labels in Hungarian
const CATEGORIES = {
  alapszereles: { label: "Alapszerelés", color: "amber" },
  szerelvenyezes: { label: "Szerelvényezés", color: "blue" },
  atadas: { label: "Átadás", color: "emerald" }
};

// Format date for display
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const formatShortDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

// Projects List View
const ProjectsList = ({ onSelectProject }) => {
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [deleteProject, setDeleteProject] = useState(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const params = searchQuery ? { search: searchQuery } : {};
      const response = await axios.get(`${API}/projects`, { params });
      setProjects(response.data);
    } catch (error) {
      toast.error("Hiba történt a projektek betöltésekor");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(fetchProjects, 300);
    return () => clearTimeout(timer);
  }, [fetchProjects]);

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast.error("Add meg a projekt nevét");
      return;
    }
    try {
      await axios.post(`${API}/projects`, newProject);
      toast.success("Projekt létrehozva");
      setShowNewDialog(false);
      setNewProject({ name: "", description: "" });
      fetchProjects();
    } catch (error) {
      toast.error("Hiba történt a projekt létrehozásakor");
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteProject) return;
    try {
      await axios.delete(`${API}/projects/${deleteProject.id}`);
      toast.success("Projekt törölve");
      setDeleteProject(null);
      fetchProjects();
    } catch (error) {
      toast.error("Hiba történt a projekt törlésekor");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="app-header sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                BauDok
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Építési projekt dokumentáció
              </p>
            </div>
            <Button 
              onClick={() => setShowNewDialog(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
              data-testid="new-project-btn"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Új Projekt
            </Button>
          </div>
          
          {/* Search */}
          <div className="mt-6 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Keresés..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-input"
              data-testid="search-input"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card border-border animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">
              {searchQuery ? "Nincs találat" : "Még nincs projekt"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery 
                ? "Próbálj más keresőszót"
                : "Hozd létre az első projektedet"}
            </p>
            {!searchQuery && (
              <Button 
                onClick={() => setShowNewDialog(true)}
                className="bg-primary text-primary-foreground"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                Új Projekt
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <Card 
                key={project.id}
                className="project-card bg-card border-border cursor-pointer group"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => onSelectProject(project)}
                data-testid={`project-card-${project.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-2" />
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Camera className="w-4 h-4" />
                      <span>{project.image_count || 0} kép</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{formatShortDate(project.created_at)}</span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 text-destructive hover:text-destructive hover:bg-destructive/10 w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteProject(project);
                    }}
                    data-testid={`delete-project-${project.id}`}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Törlés
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* New Project Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Új Projekt</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add meg az új projekt adatait
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Projekt neve</Label>
              <Input
                id="name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="pl. Lakás felújítás"
                className="bg-background"
                data-testid="project-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Leírás (opcionális)</Label>
              <Textarea
                id="description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Projekt leírása..."
                className="bg-background"
                data-testid="project-description-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Mégse
            </Button>
            <Button 
              onClick={handleCreateProject}
              className="bg-primary text-primary-foreground"
              data-testid="create-project-btn"
            >
              Létrehozás
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProject} onOpenChange={() => setDeleteProject(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Projekt törlése</AlertDialogTitle>
            <AlertDialogDescription>
              Biztosan törölni szeretnéd a "{deleteProject?.name}" projektet? 
              Ez a művelet nem vonható vissza, és minden kép törlődik.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete-btn"
            >
              Törlés
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Project Detail View
const ProjectDetail = ({ project, onBack }) => {
  const [projectData, setProjectData] = useState(null);
  const [activeCategory, setActiveCategory] = useState("alapszereles");
  const [loading, setLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("alapszereles");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editingDescription, setEditingDescription] = useState("");
  const [deleteImage, setDeleteImage] = useState(null);
  const [dateFilter, setDateFilter] = useState(null);
  const [showDateFilter, setShowDateFilter] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/projects/${project.id}`);
      setProjectData(response.data);
    } catch (error) {
      toast.error("Hiba történt a projekt betöltésekor");
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setUploadFiles(files);
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) {
      toast.error("Válassz ki legalább egy képet");
      return;
    }

    setUploading(true);
    let successCount = 0;

    for (const file of uploadFiles) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", uploadCategory);
      formData.append("description", uploadDescription);

      try {
        await axios.post(`${API}/projects/${project.id}/images`, formData);
        successCount++;
      } catch (error) {
        toast.error(`Hiba: ${file.name}`);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} kép feltöltve`);
      fetchProject();
    }

    setUploading(false);
    setShowUploadDialog(false);
    setUploadFiles([]);
    setUploadDescription("");
  };

  const handleUpdateDescription = async () => {
    if (!selectedImage) return;
    try {
      await axios.put(`${API}/images/${selectedImage.id}`, {
        description: editingDescription
      });
      toast.success("Leírás mentve");
      fetchProject();
      setSelectedImage(null);
    } catch (error) {
      toast.error("Hiba történt a mentéskor");
    }
  };

  const handleDeleteImage = async () => {
    if (!deleteImage) return;
    try {
      await axios.delete(`${API}/images/${deleteImage.id}`);
      toast.success("Kép törölve");
      setDeleteImage(null);
      setSelectedImage(null);
      fetchProject();
    } catch (error) {
      toast.error("Hiba történt a törlésekor");
    }
  };

  const getFilteredImages = () => {
    if (!projectData?.images) return [];
    
    let filtered = projectData.images.filter(img => img.category === activeCategory);
    
    if (dateFilter) {
      const filterDate = dateFilter.toISOString().split("T")[0];
      filtered = filtered.filter(img => img.created_at.startsWith(filterDate));
    }
    
    return filtered;
  };

  const filteredImages = getFilteredImages();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Betöltés...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="app-header sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onBack}
                className="text-muted-foreground hover:text-foreground"
                data-testid="back-btn"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                  {projectData?.name}
                </h1>
                {projectData?.description && (
                  <p className="text-muted-foreground text-sm mt-1">
                    {projectData.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Popover open={showDateFilter} onOpenChange={setShowDateFilter}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={dateFilter ? "border-primary text-primary" : ""}
                    data-testid="date-filter-btn"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {dateFilter ? formatShortDate(dateFilter) : "Szűrés dátumra"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={dateFilter}
                    onSelect={(date) => {
                      setDateFilter(date);
                      setShowDateFilter(false);
                    }}
                    className="rounded-md"
                  />
                  {dateFilter && (
                    <div className="p-2 border-t border-border">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          setDateFilter(null);
                          setShowDateFilter(false);
                        }}
                      >
                        Szűrő törlése
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              <Button 
                onClick={() => setShowUploadDialog(true)}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                data-testid="upload-btn"
              >
                <Upload className="w-4 h-4 mr-2" />
                Képfeltöltés
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="bg-muted p-1 rounded-lg mb-8 w-full md:w-auto">
            {Object.entries(CATEGORIES).map(([key, { label }]) => {
              const count = projectData?.images?.filter(img => img.category === key).length || 0;
              return (
                <TabsTrigger 
                  key={key} 
                  value={key}
                  className="category-tab data-[state=active]:bg-card data-[state=active]:text-foreground rounded-md transition-all flex-1 md:flex-none"
                  data-testid={`tab-${key}`}
                >
                  {label}
                  <Badge variant="secondary" className="ml-2 bg-background/50">
                    {count}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.keys(CATEGORIES).map((category) => (
            <TabsContent key={category} value={category}>
              {filteredImages.length === 0 ? (
                <div className="empty-state">
                  <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    {dateFilter ? "Nincs kép ezen a napon" : "Nincs feltöltött kép"}
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {dateFilter 
                      ? "Próbálj más dátumot választani"
                      : "Tölts fel képeket ebbe a kategóriába"}
                  </p>
                  <Button 
                    onClick={() => {
                      setUploadCategory(category);
                      setShowUploadDialog(true);
                    }}
                    className="bg-secondary text-secondary-foreground"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Képfeltöltés
                  </Button>
                </div>
              ) : (
                <div className="gallery-grid">
                  {filteredImages.map((image, index) => (
                    <Card 
                      key={image.id}
                      className="image-card bg-card border-border cursor-pointer overflow-hidden gallery-item"
                      style={{ animationDelay: `${index * 0.05}s` }}
                      onClick={() => {
                        setSelectedImage(image);
                        setEditingDescription(image.description || "");
                      }}
                      data-testid={`image-card-${image.id}`}
                    >
                      <div className="aspect-square relative">
                        <img
                          src={`${API}/images/${image.id}/data`}
                          alt={image.description || image.filename}
                          className="image-thumbnail w-full h-full"
                          loading="lazy"
                        />
                      </div>
                      <CardContent className="p-3">
                        <p className="text-sm text-foreground truncate">
                          {image.description || image.filename}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatShortDate(image.created_at)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Képfeltöltés</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Válassz képeket és kategóriát
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Kategória</Label>
              <div className="flex gap-2">
                {Object.entries(CATEGORIES).map(([key, { label }]) => (
                  <Button
                    key={key}
                    variant={uploadCategory === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUploadCategory(key)}
                    className={uploadCategory === key ? "bg-primary text-primary-foreground" : ""}
                    data-testid={`upload-category-${key}`}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Képek</Label>
              <div 
                className="drop-zone p-8 text-center cursor-pointer"
                onClick={() => document.getElementById("file-input").click()}
              >
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">
                  {uploadFiles.length > 0 
                    ? `${uploadFiles.length} kép kiválasztva`
                    : "Kattints a képek kiválasztásához"}
                </p>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="file-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="upload-desc">Leírás (opcionális)</Label>
              <Textarea
                id="upload-desc"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Kép leírása..."
                className="bg-background"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Mégse
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={uploading || uploadFiles.length === 0}
              className="bg-primary text-primary-foreground"
              data-testid="upload-submit-btn"
            >
              {uploading ? "Feltöltés..." : "Feltöltés"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="bg-card border-border max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              {selectedImage?.filename}
              <Badge className={`badge-${selectedImage?.category}`}>
                {CATEGORIES[selectedImage?.category]?.label}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative bg-background rounded-lg overflow-hidden flex items-center justify-center">
              {selectedImage && (
                <img
                  src={`${API}/images/${selectedImage.id}/data`}
                  alt={selectedImage.description || selectedImage.filename}
                  className="lightbox-image"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Leírás</Label>
              <Textarea
                value={editingDescription}
                onChange={(e) => setEditingDescription(e.target.value)}
                placeholder="Add meg a kép leírását..."
                className="bg-background"
                data-testid="image-description-input"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Feltöltve: {selectedImage && formatDate(selectedImage.created_at)}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={() => setDeleteImage(selectedImage)}
              className="sm:mr-auto"
              data-testid="delete-image-btn"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Törlés
            </Button>
            <Button variant="outline" onClick={() => setSelectedImage(null)}>
              Bezárás
            </Button>
            <Button 
              onClick={handleUpdateDescription}
              className="bg-primary text-primary-foreground"
              data-testid="save-description-btn"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Mentés
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Image Confirmation */}
      <AlertDialog open={!!deleteImage} onOpenChange={() => setDeleteImage(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Kép törlése</AlertDialogTitle>
            <AlertDialogDescription>
              Biztosan törölni szeretnéd ezt a képet? 
              Ez a művelet nem vonható vissza.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteImage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete-image-btn"
            >
              Törlés
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Main App
function App() {
  const [selectedProject, setSelectedProject] = useState(null);

  return (
    <div className="app-container">
      <Toaster 
        position="top-right" 
        richColors 
        theme="dark"
      />
      {selectedProject ? (
        <ProjectDetail 
          project={selectedProject} 
          onBack={() => setSelectedProject(null)} 
        />
      ) : (
        <ProjectsList onSelectProject={setSelectedProject} />
      )}
    </div>
  );
}

export default App;
