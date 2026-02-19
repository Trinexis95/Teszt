import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { 
  FolderPlus, Search, ArrowLeft, Upload, Trash2, Edit3, 
  Calendar, Image as ImageIcon, FolderOpen,
  ChevronRight, Clock, Camera, MapPin, Tag, Link2, X,
  Columns, Map, Plus, FileImage
} from "lucide-react";

import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Card, CardContent } from "./components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Calendar as CalendarComponent } from "./components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { Label } from "./components/ui/label";
import { Badge } from "./components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./components/ui/alert-dialog";

const API = (process.env.REACT_APP_BACKEND_URL || "") + "/api";

const CATEGORIES = {
  alapszereles: { label: "Alapszerelés" },
  szerelvenyezes: { label: "Szerelvényezés" },
  atadas: { label: "Átadás" }
};

const PREDEFINED_TAGS = [
  "villanyszerelés", "csövezés", "burkolás", "festés", 
  "szigetelés", "gipszkarton", "hiba", "javítás",
  "ablak", "ajtó", "fűtés", "klíma", "szaniter"
];

const formatDate = (d) => new Date(d).toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
const formatShortDate = (d) => new Date(d).toLocaleDateString("hu-HU", { year: "numeric", month: "short", day: "numeric" });

// Projects List
function ProjectsList({ onSelect }) {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/projects`, { params: search ? { search } : {} });
      setProjects(data);
    } catch { toast.error("Hiba a betöltéskor"); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { const t = setTimeout(fetch, 300); return () => clearTimeout(t); }, [fetch]);

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error("Add meg a nevet"); return; }
    try {
      await axios.post(`${API}/projects`, { name: newName, description: newDesc });
      toast.success("Létrehozva");
      setShowNew(false); setNewName(""); setNewDesc("");
      fetch();
    } catch { toast.error("Hiba"); }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await axios.delete(`${API}/projects/${toDelete.id}`);
      toast.success("Törölve");
      setToDelete(null);
      fetch();
    } catch { toast.error("Hiba"); }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="app-header sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-foreground">BauDok</h1>
              <p className="text-muted-foreground text-sm mt-1">Építési projekt dokumentáció</p>
            </div>
            <Button onClick={() => setShowNew(true)} className="bg-primary text-primary-foreground" data-testid="new-project-btn">
              <FolderPlus className="w-4 h-4 mr-2" />Új Projekt
            </Button>
          </div>
          <div className="mt-6 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Keresés..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-background" data-testid="search-input" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <Card key={i} className="bg-card animate-pulse"><CardContent className="p-6"><div className="h-6 bg-muted rounded w-3/4 mb-4"/><div className="h-4 bg-muted rounded w-1/2"/></CardContent></Card>)}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">{search ? "Nincs találat" : "Még nincs projekt"}</h2>
            <p className="text-muted-foreground mb-6">{search ? "Próbálj mást" : "Hozd létre az elsőt"}</p>
            {!search && <Button onClick={() => setShowNew(true)} className="bg-primary text-primary-foreground"><FolderPlus className="w-4 h-4 mr-2"/>Új Projekt</Button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <Card key={p.id} className="bg-card cursor-pointer group hover:border-primary/50 transition-all" onClick={() => onSelect(p)} data-testid={`project-card-${p.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold truncate group-hover:text-primary transition-colors">{p.name}</h3>
                      {p.description && <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{p.description}</p>}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary ml-2" />
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <span className="flex items-center gap-2 text-muted-foreground text-sm"><Camera className="w-4 h-4"/>{p.image_count || 0} kép</span>
                    <span className="flex items-center gap-2 text-muted-foreground text-sm"><Clock className="w-4 h-4"/>{formatShortDate(p.created_at)}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="mt-3 text-destructive hover:bg-destructive/10 w-full" onClick={(e) => { e.stopPropagation(); setToDelete(p); }}>
                    <Trash2 className="w-4 h-4 mr-2"/>Törlés
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="bg-card">
          <DialogHeader><DialogTitle>Új Projekt</DialogTitle><DialogDescription>Add meg az adatokat</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Név</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="pl. Lakás felújítás" className="bg-background" data-testid="project-name-input"/></div>
            <div className="space-y-2"><Label>Leírás</Label><Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Leírás..." className="bg-background"/></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNew(false)}>Mégse</Button><Button onClick={handleCreate} className="bg-primary text-primary-foreground" data-testid="create-project-btn">Létrehozás</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={() => setToDelete(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader><AlertDialogTitle>Törlés</AlertDialogTitle><AlertDialogDescription>Biztosan törlöd a "{toDelete?.name}" projektet?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Mégse</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Törlés</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Floorplan Viewer
function FloorplanViewer({ floorplan, images, onClose, onImageClick, fetchProject }) {
  const ref = useRef(null);
  const [positioning, setPositioning] = useState(null);
  const available = images.filter(i => !i.floorplan_id);
  const marked = images.filter(i => i.floorplan_id === floorplan.id);

  const handleClick = async (e) => {
    if (!positioning || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    try {
      await axios.put(`${API}/images/${positioning.id}`, { floorplan_id: floorplan.id, floorplan_x: x, floorplan_y: y });
      toast.success("Elhelyezve");
      setPositioning(null);
      fetchProject();
    } catch { toast.error("Hiba"); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card max-w-6xl max-h-[90vh]">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Map className="w-5 h-5"/>{floorplan.name}<Badge variant="outline">{marked.length} jelölő</Badge></DialogTitle></DialogHeader>
        <div className="flex gap-4">
          <div className="flex-1">
            <div ref={ref} className={`relative bg-background rounded-lg overflow-hidden ${positioning ? 'cursor-crosshair' : ''}`} onClick={handleClick}>
              <img src={`${API}/floorplans/${floorplan.id}/data`} alt={floorplan.name} className="w-full h-auto"/>
              {marked.map(img => (
                <div key={img.id} className="absolute w-6 h-6 -ml-3 -mt-3 cursor-pointer hover:scale-125 transition-transform" style={{ left: `${img.floorplan_x}%`, top: `${img.floorplan_y}%` }} onClick={(e) => { e.stopPropagation(); onImageClick(img); }} title={img.description || img.filename}>
                  <div className="w-full h-full bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white"><Camera className="w-3 h-3 text-primary-foreground"/></div>
                </div>
              ))}
              {positioning && <div className="absolute inset-0 bg-primary/10 flex items-center justify-center"><p className="bg-card px-4 py-2 rounded-lg shadow text-sm">Kattints az elhelyezéshez</p></div>}
            </div>
          </div>
          <div className="w-48 flex-shrink-0">
            <h4 className="text-sm font-medium mb-2">Képek elhelyezése</h4>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {available.length === 0 ? <p className="text-xs text-muted-foreground">Mind el van helyezve</p> : available.map(img => (
                <div key={img.id} className={`cursor-pointer rounded border-2 transition-all ${positioning?.id === img.id ? 'border-primary' : 'border-transparent hover:border-muted'}`} onClick={() => setPositioning(positioning?.id === img.id ? null : img)}>
                  <img src={`${API}/images/${img.id}/data`} alt="" className="w-full aspect-square object-cover rounded"/>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Bezárás</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Before/After Comparison
function Comparison({ before, after, onClose }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card max-w-6xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Columns className="w-5 h-5"/>Előtte - Utána</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Badge className="bg-orange-500/20 text-orange-400">Előtte</Badge>
            <div className="aspect-video bg-background rounded-lg overflow-hidden"><img src={`${API}/images/${before.id}/data`} alt="Előtte" className="w-full h-full object-contain"/></div>
            <p className="text-sm text-muted-foreground">{before.description || before.filename}</p>
          </div>
          <div className="space-y-2">
            <Badge className="bg-green-500/20 text-green-400">Utána</Badge>
            <div className="aspect-video bg-background rounded-lg overflow-hidden"><img src={`${API}/images/${after.id}/data`} alt="Utána" className="w-full h-full object-contain"/></div>
            <p className="text-sm text-muted-foreground">{after.description || after.filename}</p>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Bezárás</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Project Detail
function ProjectDetail({ project, onBack }) {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("alapszereles");
  const [loading, setLoading] = useState(true);
  
  // Upload state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCat, setUploadCat] = useState("alapszereles");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadTags, setUploadTags] = useState([]);
  const [uploadLoc, setUploadLoc] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Floorplan upload
  const [showFpUpload, setShowFpUpload] = useState(false);
  const [fpName, setFpName] = useState("");
  const [fpFile, setFpFile] = useState(null);
  const [fpUploading, setFpUploading] = useState(false);
  
  // View state
  const [selected, setSelected] = useState(null);
  const [editDesc, setEditDesc] = useState("");
  const [editTags, setEditTags] = useState([]);
  const [editLoc, setEditLoc] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [fpToDelete, setFpToDelete] = useState(null);
  const [showLink, setShowLink] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [selectedFp, setSelectedFp] = useState(null);
  
  // Filters
  const [dateFilter, setDateFilter] = useState(null);
  const [tagFilter, setTagFilter] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: d } = await axios.get(`${API}/projects/${project.id}`);
      setData(d);
    } catch { toast.error("Hiba"); }
    finally { setLoading(false); }
  }, [project.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpload = async () => {
    if (!uploadFiles.length) { toast.error("Válassz képet"); return; }
    setUploading(true);
    let ok = 0;
    for (const file of uploadFiles) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", uploadCat);
      fd.append("description", uploadDesc);
      fd.append("tags", uploadTags.join(","));
      if (uploadLoc) { fd.append("lat", uploadLoc.lat); fd.append("lng", uploadLoc.lng); fd.append("address", ""); }
      try { await axios.post(`${API}/projects/${project.id}/images`, fd); ok++; } catch {}
    }
    if (ok) { toast.success(`${ok} kép feltöltve`); fetchData(); }
    setUploading(false); setShowUpload(false); setUploadFiles([]); setUploadDesc(""); setUploadTags([]); setUploadLoc(null);
  };

  const handleFpUpload = async () => {
    if (!fpFile || !fpName.trim()) { toast.error("Add meg a nevet és válassz fájlt"); return; }
    setFpUploading(true);
    const fd = new FormData();
    fd.append("file", fpFile);
    fd.append("name", fpName);
    try {
      await axios.post(`${API}/projects/${project.id}/floorplans`, fd);
      toast.success("Tervrajz feltöltve");
      fetchData();
      setShowFpUpload(false); setFpName(""); setFpFile(null);
    } catch (err) { 
      console.error(err);
      toast.error("Hiba a feltöltéskor"); 
    }
    setFpUploading(false);
  };

  const handleDeleteFp = async () => {
    if (!fpToDelete) return;
    try { await axios.delete(`${API}/floorplans/${fpToDelete.id}`); toast.success("Törölve"); setFpToDelete(null); fetchData(); } catch { toast.error("Hiba"); }
  };

  const handleUpdateImage = async () => {
    if (!selected) return;
    try { await axios.put(`${API}/images/${selected.id}`, { description: editDesc, tags: editTags, location: editLoc }); toast.success("Mentve"); fetchData(); setSelected(null); } catch { toast.error("Hiba"); }
  };

  const handleLinkImage = async (linkedId) => {
    if (!selected) return;
    try { await axios.put(`${API}/images/${selected.id}`, { linked_image_id: linkedId }); toast.success("Összekapcsolva"); fetchData(); setShowLink(false); } catch { toast.error("Hiba"); }
  };

  const handleDeleteImage = async () => {
    if (!toDelete) return;
    try { await axios.delete(`${API}/images/${toDelete.id}`); toast.success("Törölve"); setToDelete(null); setSelected(null); fetchData(); } catch { toast.error("Hiba"); }
  };

  const openComparison = (img) => {
    if (!img.linked_image_id) return;
    const linked = data?.images?.find(i => i.id === img.linked_image_id);
    if (linked) {
      const d1 = new Date(img.created_at), d2 = new Date(linked.created_at);
      setComparison(d1 < d2 ? { before: img, after: linked } : { before: linked, after: img });
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUploadLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); toast.success("Helyszín rögzítve"); },
        () => toast.error("Nem sikerült")
      );
    } else toast.error("Nem támogatott");
  };

  const filtered = data?.images?.filter(i => {
    if (i.category !== tab) return false;
    if (dateFilter && !i.created_at.startsWith(dateFilter.toISOString().split("T")[0])) return false;
    if (tagFilter && !i.tags?.includes(tagFilter)) return false;
    return true;
  }) || [];

  const allTags = [...new Set(data?.images?.flatMap(i => i.tags || []) || [])];

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Betöltés...</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="app-header sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack} data-testid="back-btn"><ArrowLeft className="w-5 h-5"/></Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-black">{data?.name}</h1>
                {data?.description && <p className="text-muted-foreground text-sm mt-1">{data.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-36"><Tag className="w-4 h-4 mr-2"/><SelectValue placeholder="Címke"/></SelectTrigger>
                <SelectContent><SelectItem value="">Összes</SelectItem>{allTags.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild><Button variant="outline" className={dateFilter ? "border-primary" : ""}><Calendar className="w-4 h-4 mr-2"/>{dateFilter ? formatShortDate(dateFilter) : "Dátum"}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card" align="end">
                  <CalendarComponent mode="single" selected={dateFilter} onSelect={(d) => { setDateFilter(d); setShowDatePicker(false); }}/>
                  {dateFilter && <div className="p-2 border-t"><Button variant="ghost" size="sm" className="w-full" onClick={() => { setDateFilter(null); setShowDatePicker(false); }}>Törlés</Button></div>}
                </PopoverContent>
              </Popover>
              <Button onClick={() => setShowUpload(true)} className="bg-secondary text-secondary-foreground" data-testid="upload-btn"><Upload className="w-4 h-4 mr-2"/>Képfeltöltés</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Floorplans */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><Map className="w-5 h-5"/>Tervrajzok</h2>
            <Button variant="outline" size="sm" onClick={() => setShowFpUpload(true)}><Plus className="w-4 h-4 mr-1"/>Új tervrajz</Button>
          </div>
          {data?.floorplans?.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {data.floorplans.map(fp => (
                <Card key={fp.id} className="bg-card cursor-pointer group hover:border-primary/50" onClick={() => setSelectedFp(fp)}>
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <img src={`${API}/floorplans/${fp.id}/data`} alt={fp.name} className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><span className="text-white text-sm">Megnyitás</span></div>
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium truncate">{fp.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">{fp.marker_count || 0} jelölő</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={(e) => { e.stopPropagation(); setFpToDelete(fp); }}><Trash2 className="w-3 h-3"/></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <FileImage className="w-12 h-12 mx-auto text-muted-foreground mb-2"/>
              <p className="text-muted-foreground text-sm">Nincs tervrajz</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowFpUpload(true)}>Feltöltés</Button>
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted p-1 rounded-lg mb-8">
            {Object.entries(CATEGORIES).map(([k, { label }]) => (
              <TabsTrigger key={k} value={k} className="flex-1 md:flex-none" data-testid={`tab-${k}`}>{label}<Badge variant="secondary" className="ml-2">{data?.images?.filter(i => i.category === k).length || 0}</Badge></TabsTrigger>
            ))}
          </TabsList>

          {Object.keys(CATEGORIES).map(cat => (
            <TabsContent key={cat} value={cat}>
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4"/>
                  <h2 className="text-xl font-bold mb-2">{dateFilter || tagFilter ? "Nincs találat" : "Nincs kép"}</h2>
                  <Button onClick={() => { setUploadCat(cat); setShowUpload(true); }} className="bg-secondary text-secondary-foreground"><Upload className="w-4 h-4 mr-2"/>Feltöltés</Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filtered.map(img => (
                    <Card key={img.id} className="bg-card cursor-pointer overflow-hidden hover:border-primary/50" onClick={() => { setSelected(img); setEditDesc(img.description || ""); setEditTags(img.tags || []); setEditLoc(img.location); }} data-testid={`image-card-${img.id}`}>
                      <div className="aspect-square relative">
                        <img src={`${API}/images/${img.id}/data`} alt="" className="w-full h-full object-cover" loading="lazy"/>
                        <div className="absolute top-2 right-2 flex gap-1">
                          {img.location && <div className="bg-black/60 p-1 rounded"><MapPin className="w-3 h-3 text-white"/></div>}
                          {img.linked_image_id && <div className="bg-black/60 p-1 rounded"><Link2 className="w-3 h-3 text-white"/></div>}
                          {img.floorplan_id && <div className="bg-black/60 p-1 rounded"><Map className="w-3 h-3 text-white"/></div>}
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <p className="text-sm truncate">{img.description || img.filename}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground">{formatShortDate(img.created_at)}</span>
                          {img.tags?.length > 0 && <div className="flex gap-1">{img.tags.slice(0,2).map(t => <Badge key={t} variant="outline" className="text-xs py-0 px-1">{t}</Badge>)}</div>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {/* Upload Image Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="bg-card max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Képfeltöltés</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Kategória</Label><div className="flex gap-2 flex-wrap">{Object.entries(CATEGORIES).map(([k, { label }]) => <Button key={k} variant={uploadCat === k ? "default" : "outline"} size="sm" onClick={() => setUploadCat(k)} className={uploadCat === k ? "bg-primary" : ""}>{label}</Button>)}</div></div>
            <div className="space-y-2"><Label>Képek</Label><div className="drop-zone p-8 text-center cursor-pointer" onClick={() => document.getElementById("file-input")?.click()}><Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2"/><p className="text-muted-foreground text-sm">{uploadFiles.length > 0 ? `${uploadFiles.length} kép` : "Kattints"}</p><input id="file-input" type="file" accept="image/*" multiple onChange={(e) => setUploadFiles(Array.from(e.target.files || []))} className="hidden"/></div></div>
            <div className="space-y-2"><Label>Leírás</Label><Textarea value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} placeholder="Leírás..." className="bg-background"/></div>
            <div className="space-y-2"><Label>Címkék</Label><div className="flex flex-wrap gap-2">{PREDEFINED_TAGS.map(t => <Badge key={t} variant={uploadTags.includes(t) ? "default" : "outline"} className={`cursor-pointer ${uploadTags.includes(t) ? "bg-primary" : ""}`} onClick={() => setUploadTags(uploadTags.includes(t) ? uploadTags.filter(x => x !== t) : [...uploadTags, t])}>{t}</Badge>)}</div></div>
            <div className="space-y-2"><Label>GPS</Label><div className="flex gap-2"><Button variant="outline" onClick={getLocation} className="flex-1"><MapPin className="w-4 h-4 mr-2"/>{uploadLoc ? `${uploadLoc.lat.toFixed(4)}, ${uploadLoc.lng.toFixed(4)}` : "Rögzítés"}</Button>{uploadLoc && <Button variant="ghost" size="icon" onClick={() => setUploadLoc(null)}><X className="w-4 h-4"/></Button>}</div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowUpload(false)}>Mégse</Button><Button onClick={handleUpload} disabled={uploading || !uploadFiles.length} className="bg-primary text-primary-foreground">{uploading ? "Feltöltés..." : "Feltöltés"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floorplan Upload Dialog */}
      <Dialog open={showFpUpload} onOpenChange={setShowFpUpload}>
        <DialogContent className="bg-card">
          <DialogHeader><DialogTitle>Új tervrajz</DialogTitle><DialogDescription>Tölts fel egy tervrajzot</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Név</Label><Input value={fpName} onChange={(e) => setFpName(e.target.value)} placeholder="pl. Földszint" className="bg-background"/></div>
            <div className="space-y-2"><Label>Fájl</Label><div className="drop-zone p-8 text-center cursor-pointer" onClick={() => document.getElementById("fp-input")?.click()}><FileImage className="w-8 h-8 mx-auto text-muted-foreground mb-2"/><p className="text-muted-foreground text-sm">{fpFile ? fpFile.name : "Kattints"}</p><input id="fp-input" type="file" accept="image/*" onChange={(e) => setFpFile(e.target.files?.[0] || null)} className="hidden"/></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowFpUpload(false)}>Mégse</Button><Button onClick={handleFpUpload} disabled={fpUploading || !fpFile || !fpName.trim()} className="bg-primary text-primary-foreground">{fpUploading ? "Feltöltés..." : "Feltöltés"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floorplan Viewer */}
      {selectedFp && <FloorplanViewer floorplan={selectedFp} images={data?.images || []} onClose={() => setSelectedFp(null)} onImageClick={(img) => { setSelectedFp(null); setSelected(img); setEditDesc(img.description || ""); setEditTags(img.tags || []); setEditLoc(img.location); }} fetchProject={fetchData}/>}

      {/* Image Lightbox */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-card max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">{selected?.filename}<Badge>{CATEGORIES[selected?.category]?.label}</Badge>
              {selected?.linked_image_id && <Button variant="outline" size="sm" onClick={() => openComparison(selected)}><Columns className="w-4 h-4 mr-1"/>Összehasonlítás</Button>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-background rounded-lg overflow-hidden flex items-center justify-center">{selected && <img src={`${API}/images/${selected.id}/data`} alt="" className="max-h-[50vh] object-contain"/>}</div>
            <div className="space-y-2"><Label>Leírás</Label><Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="bg-background"/></div>
            <div className="space-y-2"><Label>Címkék</Label><div className="flex flex-wrap gap-2">{PREDEFINED_TAGS.map(t => <Badge key={t} variant={editTags.includes(t) ? "default" : "outline"} className={`cursor-pointer ${editTags.includes(t) ? "bg-primary" : ""}`} onClick={() => setEditTags(editTags.includes(t) ? editTags.filter(x => x !== t) : [...editTags, t])}>{t}</Badge>)}</div></div>
            <div className="space-y-2"><Label>Helyszín</Label>{editLoc ? <div className="flex items-center gap-2"><span className="flex-1 p-2 bg-background rounded text-sm"><MapPin className="w-4 h-4 inline mr-2"/>{editLoc.lat.toFixed(6)}, {editLoc.lng.toFixed(6)}</span><Button variant="ghost" size="icon" onClick={() => setEditLoc(null)}><X className="w-4 h-4"/></Button><Button variant="outline" size="sm" onClick={() => window.open(`https://maps.google.com?q=${editLoc.lat},${editLoc.lng}`, '_blank')}>Térkép</Button></div> : <p className="text-sm text-muted-foreground">Nincs</p>}</div>
            <div className="space-y-2"><Label>Előtte-Utána</Label><Button variant="outline" onClick={() => setShowLink(true)} className="w-full"><Link2 className="w-4 h-4 mr-2"/>{selected?.linked_image_id ? "Módosítás" : "Összekapcsolás"}</Button></div>
            <p className="text-sm text-muted-foreground">Feltöltve: {selected && formatDate(selected.created_at)}</p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="destructive" onClick={() => setToDelete(selected)} className="sm:mr-auto"><Trash2 className="w-4 h-4 mr-2"/>Törlés</Button>
            <Button variant="outline" onClick={() => setSelected(null)}>Bezárás</Button>
            <Button onClick={handleUpdateImage} className="bg-primary text-primary-foreground"><Edit3 className="w-4 h-4 mr-2"/>Mentés</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={showLink} onOpenChange={setShowLink}>
        <DialogContent className="bg-card max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Összekapcsolás</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-4">
            {data?.images?.filter(i => i.id !== selected?.id).map(img => (
              <div key={img.id} className={`cursor-pointer rounded-lg overflow-hidden border-2 ${selected?.linked_image_id === img.id ? "border-primary" : "border-transparent hover:border-muted"}`} onClick={() => handleLinkImage(img.id)}>
                <img src={`${API}/images/${img.id}/data`} alt="" className="aspect-square object-cover"/>
                <div className="p-2 text-xs text-muted-foreground truncate">{formatShortDate(img.created_at)}</div>
              </div>
            ))}
          </div>
          <DialogFooter>{selected?.linked_image_id && <Button variant="outline" onClick={() => handleLinkImage("")} className="mr-auto">Törlés</Button>}<Button variant="outline" onClick={() => setShowLink(false)}>Bezárás</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comparison */}
      {comparison && <Comparison before={comparison.before} after={comparison.after} onClose={() => setComparison(null)}/>}

      {/* Delete Image */}
      <AlertDialog open={!!toDelete} onOpenChange={() => setToDelete(null)}>
        <AlertDialogContent className="bg-card"><AlertDialogHeader><AlertDialogTitle>Törlés</AlertDialogTitle><AlertDialogDescription>Biztosan törlöd?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Mégse</AlertDialogCancel><AlertDialogAction onClick={handleDeleteImage} className="bg-destructive text-destructive-foreground">Törlés</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      {/* Delete Floorplan */}
      <AlertDialog open={!!fpToDelete} onOpenChange={() => setFpToDelete(null)}>
        <AlertDialogContent className="bg-card"><AlertDialogHeader><AlertDialogTitle>Tervrajz törlése</AlertDialogTitle><AlertDialogDescription>Biztosan törlöd?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Mégse</AlertDialogCancel><AlertDialogAction onClick={handleDeleteFp} className="bg-destructive text-destructive-foreground">Törlés</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Main App
export default function App() {
  const [project, setProject] = useState(null);
  return (
    <div className="app-container">
      <Toaster position="top-right" richColors theme="dark"/>
      {project ? <ProjectDetail project={project} onBack={() => setProject(null)}/> : <ProjectsList onSelect={setProject}/>}
    </div>
  );
}
