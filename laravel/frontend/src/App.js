import React, { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import axios from "axios";
import { Toaster, toast } from "sonner";

const API = (process.env.REACT_APP_BACKEND_URL || "") + "/api";

const CATEGORIES = {
  alapszereles: "Alapszerelés",
  szerelvenyezes: "Szerelvényezés",
  atadas: "Átadás"
};

const TAGS = [
  "villanyszerelés", "csövezés", "burkolás", "festés",
  "szigetelés", "gipszkarton", "hiba", "javítás",
  "ablak", "ajtó", "fűtés", "klíma", "szaniter"
];

const formatDate = (d) => new Date(d).toLocaleDateString("hu-HU", {
  year: "numeric", month: "short", day: "numeric"
});

// Icon components
const Icons = {
  FolderPlus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>,
  Search: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  ArrowLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Upload: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Camera: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Clock: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  ChevronRight: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
  Map: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>,
  Plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  X: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  MapPin: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Link: () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
  Image: () => <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Folder: () => <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>,
  File: () => <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
};

// Modal component
function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 w-full max-w-lg max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><Icons.X /></button>
        </div>
        <div className="p-4">{children}</div>
        {footer && <div className="p-4 border-t border-zinc-800 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

// Button component
function Button({ children, onClick, variant = "primary", disabled, className = "" }) {
  const base = "px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50";
  const variants = {
    primary: "bg-amber-500 text-black hover:bg-amber-400",
    secondary: "bg-blue-600 text-white hover:bg-blue-500",
    outline: "border border-zinc-700 text-white hover:bg-zinc-800",
    danger: "bg-red-600 text-white hover:bg-red-500",
    ghost: "text-zinc-400 hover:text-white hover:bg-zinc-800"
  };
  return <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>{children}</button>;
}

// Projects List
function ProjectsList({ onSelect }) {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/projects`, { params: search ? { search } : {} });
      setProjects(data);
    } catch (err) {
      console.error(err);
      toast.error("Hiba a betöltéskor");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchProjects, 300);
    return () => clearTimeout(t);
  }, [fetchProjects]);

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error("Add meg a nevet"); return; }
    try {
      await axios.post(`${API}/projects`, { name: newName, description: newDesc });
      toast.success("Létrehozva");
      setShowNew(false);
      setNewName("");
      setNewDesc("");
      fetchProjects();
    } catch (err) {
      console.error(err);
      toast.error("Hiba");
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await axios.delete(`${API}/projects/${toDelete.id}`);
      toast.success("Törölve");
      setToDelete(null);
      fetchProjects();
    } catch (err) {
      console.error(err);
      toast.error("Hiba");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black">BauDok</h1>
              <p className="text-zinc-400 text-sm">Építési projekt dokumentáció</p>
            </div>
            <Button onClick={() => setShowNew(true)}><Icons.FolderPlus />Új Projekt</Button>
          </div>
          <div className="mt-4 relative max-w-md">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"><Icons.Search /></div>
            <input
              type="text"
              placeholder="Keresés..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-zinc-900 rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-zinc-800 rounded w-3/4 mb-4" />
                <div className="h-4 bg-zinc-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-zinc-600 mb-4"><Icons.Folder /></div>
            <h2 className="text-xl font-bold mb-2">{search ? "Nincs találat" : "Még nincs projekt"}</h2>
            <p className="text-zinc-400 mb-6">{search ? "Próbálj mást" : "Hozd létre az elsőt"}</p>
            {!search && <Button onClick={() => setShowNew(true)}><Icons.FolderPlus />Új Projekt</Button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <div
                key={p.id}
                onClick={() => onSelect(p)}
                className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 cursor-pointer hover:border-amber-500/50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold truncate flex-1">{p.name}</h3>
                  <Icons.ChevronRight />
                </div>
                {p.description && <p className="text-zinc-400 text-sm mt-1 line-clamp-2">{p.description}</p>}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-800 text-sm text-zinc-400">
                  <span className="flex items-center gap-1"><Icons.Camera />{p.image_count || 0} kép</span>
                  <span className="flex items-center gap-1"><Icons.Clock />{formatDate(p.created_at)}</span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setToDelete(p); }}
                  className="mt-3 w-full py-2 text-red-400 hover:bg-red-500/10 rounded-lg flex items-center justify-center gap-2"
                >
                  <Icons.Trash />Törlés
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Új Projekt" footer={
        <><Button variant="outline" onClick={() => setShowNew(false)}>Mégse</Button><Button onClick={handleCreate}>Létrehozás</Button></>
      }>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Név</label>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="pl. Lakás felújítás" className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-amber-500" />
          </div>
          <div>
            <label className="block text-sm mb-1">Leírás</label>
            <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Leírás..." rows={3} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-amber-500" />
          </div>
        </div>
      </Modal>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Törlés" footer={
        <><Button variant="outline" onClick={() => setToDelete(null)}>Mégse</Button><Button variant="danger" onClick={handleDelete}>Törlés</Button></>
      }>
        <p>Biztosan törlöd a "{toDelete?.name}" projektet?</p>
      </Modal>
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
    } catch (err) {
      console.error(err);
      toast.error("Hiba");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={onClose}>
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 w-full max-w-5xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2"><Icons.Map />{floorplan.name}<span className="text-sm text-zinc-400">({marked.length} jelölő)</span></h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><Icons.X /></button>
        </div>
        <div className="flex gap-4 p-4">
          <div className="flex-1">
            <div ref={ref} className={`relative bg-zinc-800 rounded-lg overflow-hidden ${positioning ? 'cursor-crosshair' : ''}`} onClick={handleClick}>
              <img src={`${API}/floorplans/${floorplan.id}/data`} alt={floorplan.name} className="w-full h-auto" />
              {marked.map(img => (
                <div key={img.id} className="absolute w-6 h-6 -ml-3 -mt-3 cursor-pointer hover:scale-125 transition-transform" style={{ left: `${img.floorplan_x}%`, top: `${img.floorplan_y}%` }} onClick={e => { e.stopPropagation(); onImageClick(img); }}>
                  <div className="w-full h-full bg-amber-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white"><Icons.Camera /></div>
                </div>
              ))}
              {positioning && <div className="absolute inset-0 bg-amber-500/10 flex items-center justify-center"><span className="bg-zinc-900 px-4 py-2 rounded-lg">Kattints az elhelyezéshez</span></div>}
            </div>
          </div>
          <div className="w-40 flex-shrink-0">
            <h4 className="text-sm font-medium mb-2">Képek elhelyezése</h4>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {available.length === 0 ? <p className="text-xs text-zinc-500">Mind el van helyezve</p> : available.map(img => (
                <div key={img.id} className={`cursor-pointer rounded border-2 ${positioning?.id === img.id ? 'border-amber-500' : 'border-transparent hover:border-zinc-600'}`} onClick={() => setPositioning(positioning?.id === img.id ? null : img)}>
                  <img src={`${API}/images/${img.id}/data`} alt="" className="w-full aspect-square object-cover rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Project Detail
function ProjectDetail({ project, onBack }) {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("alapszereles");
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCat, setUploadCat] = useState("alapszereles");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadTags, setUploadTags] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showFpUpload, setShowFpUpload] = useState(false);
  const [fpName, setFpName] = useState("");
  const [fpFile, setFpFile] = useState(null);
  const [fpUploading, setFpUploading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editDesc, setEditDesc] = useState("");
  const [editTags, setEditTags] = useState([]);
  const [toDelete, setToDelete] = useState(null);
  const [fpToDelete, setFpToDelete] = useState(null);
  const [selectedFp, setSelectedFp] = useState(null);
  const [tagFilter, setTagFilter] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: d } = await axios.get(`${API}/projects/${project.id}`);
      setData(d);
    } catch (err) {
      console.error(err);
      toast.error("Hiba");
    } finally {
      setLoading(false);
    }
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
      try {
        await axios.post(`${API}/projects/${project.id}/images`, fd);
        ok++;
      } catch (err) {
        console.error(err);
      }
    }
    if (ok) { toast.success(`${ok} kép feltöltve`); fetchData(); }
    setUploading(false);
    setShowUpload(false);
    setUploadFiles([]);
    setUploadDesc("");
    setUploadTags([]);
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
      setShowFpUpload(false);
      setFpName("");
      setFpFile(null);
    } catch (err) {
      console.error(err);
      toast.error("Hiba a feltöltéskor");
    }
    setFpUploading(false);
  };

  const handleDeleteFp = async () => {
    if (!fpToDelete) return;
    try {
      await axios.delete(`${API}/floorplans/${fpToDelete.id}`);
      toast.success("Törölve");
      setFpToDelete(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Hiba");
    }
  };

  const handleUpdateImage = async () => {
    if (!selected) return;
    try {
      await axios.put(`${API}/images/${selected.id}`, { description: editDesc, tags: editTags });
      toast.success("Mentve");
      fetchData();
      setSelected(null);
    } catch (err) {
      console.error(err);
      toast.error("Hiba");
    }
  };

  const handleDeleteImage = async () => {
    if (!toDelete) return;
    try {
      await axios.delete(`${API}/images/${toDelete.id}`);
      toast.success("Törölve");
      setToDelete(null);
      setSelected(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Hiba");
    }
  };

  const filtered = data?.images?.filter(i => {
    if (i.category !== tab) return false;
    if (tagFilter && !i.tags?.includes(tagFilter)) return false;
    return true;
  }) || [];

  const allTags = [...new Set(data?.images?.flatMap(i => i.tags || []) || [])];

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Betöltés...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="text-zinc-400 hover:text-white"><Icons.ArrowLeft /></button>
              <div>
                <h1 className="text-2xl font-black">{data?.name}</h1>
                {data?.description && <p className="text-zinc-400 text-sm">{data.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {allTags.length > 0 && (
                <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg">
                  <option value="">Összes címke</option>
                  {allTags.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              )}
              <Button variant="secondary" onClick={() => setShowUpload(true)}><Icons.Upload />Képfeltöltés</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Floorplans */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><Icons.Map />Tervrajzok</h2>
            <Button variant="outline" onClick={() => setShowFpUpload(true)}><Icons.Plus />Új tervrajz</Button>
          </div>
          {data?.floorplans?.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {data.floorplans.map(fp => (
                <div key={fp.id} onClick={() => setSelectedFp(fp)} className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 cursor-pointer hover:border-amber-500/50">
                  <div className="aspect-video relative">
                    <img src={`${API}/floorplans/${fp.id}/data`} alt={fp.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">{fp.name}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-zinc-400">{fp.marker_count || 0} jelölő</span>
                      <button onClick={e => { e.stopPropagation(); setFpToDelete(fp); }} className="text-red-400 hover:text-red-300"><Icons.Trash /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-zinc-800 rounded-lg">
              <div className="text-zinc-600 mb-2"><Icons.File /></div>
              <p className="text-zinc-500 text-sm">Nincs tervrajz</p>
              <Button variant="outline" onClick={() => setShowFpUpload(true)} className="mt-2">Feltöltés</Button>
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {Object.entries(CATEGORIES).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-lg whitespace-nowrap ${tab === k ? 'bg-amber-500 text-black font-medium' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
              {label}
              <span className="ml-2 text-sm opacity-70">({data?.images?.filter(i => i.category === k).length || 0})</span>
            </button>
          ))}
        </div>

        {/* Images */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-zinc-600 mb-4"><Icons.Image /></div>
            <h2 className="text-xl font-bold mb-2">{tagFilter ? "Nincs találat" : "Nincs kép"}</h2>
            <Button variant="secondary" onClick={() => { setUploadCat(tab); setShowUpload(true); }}><Icons.Upload />Feltöltés</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(img => (
              <div key={img.id} onClick={() => { setSelected(img); setEditDesc(img.description || ""); setEditTags(img.tags || []); }} className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 cursor-pointer hover:border-amber-500/50">
                <div className="aspect-square relative">
                  <img src={`${API}/images/${img.id}/data`} alt="" className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute top-2 right-2 flex gap-1">
                    {img.location && <div className="bg-black/60 p-1 rounded"><Icons.MapPin /></div>}
                    {img.linked_image_id && <div className="bg-black/60 p-1 rounded"><Icons.Link /></div>}
                    {img.floorplan_id && <div className="bg-black/60 p-1 rounded text-xs"><Icons.Map /></div>}
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm truncate">{img.description || img.filename}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-zinc-400">{formatDate(img.created_at)}</span>
                    {img.tags?.length > 0 && <span className="text-xs text-zinc-500">{img.tags[0]}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Upload Image Modal */}
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Képfeltöltés" footer={
        <><Button variant="outline" onClick={() => setShowUpload(false)}>Mégse</Button><Button onClick={handleUpload} disabled={uploading || !uploadFiles.length}>{uploading ? "Feltöltés..." : "Feltöltés"}</Button></>
      }>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Kategória</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(CATEGORIES).map(([k, label]) => (
                <button key={k} onClick={() => setUploadCat(k)} className={`px-3 py-1 rounded-lg text-sm ${uploadCat === k ? 'bg-amber-500 text-black' : 'bg-zinc-800'}`}>{label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2">Képek</label>
            <div onClick={() => document.getElementById("file-input")?.click()} className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center cursor-pointer hover:border-amber-500">
              <Icons.Upload />
              <p className="text-zinc-400 mt-2">{uploadFiles.length > 0 ? `${uploadFiles.length} kép kiválasztva` : "Kattints a kiválasztáshoz"}</p>
              <input id="file-input" type="file" accept="image/*" multiple onChange={e => setUploadFiles(Array.from(e.target.files || []))} className="hidden" />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2">Leírás</label>
            <textarea value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} placeholder="Leírás..." rows={2} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm mb-2">Címkék</label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(t => (
                <button key={t} onClick={() => setUploadTags(uploadTags.includes(t) ? uploadTags.filter(x => x !== t) : [...uploadTags, t])} className={`px-2 py-1 rounded text-xs ${uploadTags.includes(t) ? 'bg-amber-500 text-black' : 'bg-zinc-800'}`}>{t}</button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Floorplan Upload Modal */}
      <Modal open={showFpUpload} onClose={() => setShowFpUpload(false)} title="Új tervrajz" footer={
        <><Button variant="outline" onClick={() => setShowFpUpload(false)}>Mégse</Button><Button onClick={handleFpUpload} disabled={fpUploading || !fpFile || !fpName.trim()}>{fpUploading ? "Feltöltés..." : "Feltöltés"}</Button></>
      }>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Név</label>
            <input type="text" value={fpName} onChange={e => setFpName(e.target.value)} placeholder="pl. Földszint" className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm mb-1">Fájl</label>
            <div onClick={() => document.getElementById("fp-input")?.click()} className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center cursor-pointer hover:border-amber-500">
              <Icons.File />
              <p className="text-zinc-400 mt-2">{fpFile ? fpFile.name : "Kattints a kiválasztáshoz"}</p>
              <input id="fp-input" type="file" accept="image/*" onChange={e => setFpFile(e.target.files?.[0] || null)} className="hidden" />
            </div>
          </div>
        </div>
      </Modal>

      {/* Floorplan Viewer */}
      {selectedFp && (
        <FloorplanViewer
          floorplan={selectedFp}
          images={data?.images || []}
          onClose={() => setSelectedFp(null)}
          onImageClick={img => { setSelectedFp(null); setSelected(img); setEditDesc(img.description || ""); setEditTags(img.tags || []); }}
          fetchProject={fetchData}
        />
      )}

      {/* Image Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.filename || "Kép"} footer={
        <>
          <Button variant="danger" onClick={() => setToDelete(selected)}><Icons.Trash />Törlés</Button>
          <Button variant="outline" onClick={() => setSelected(null)}>Bezárás</Button>
          <Button onClick={handleUpdateImage}>Mentés</Button>
        </>
      }>
        {selected && (
          <div className="space-y-4">
            <img src={`${API}/images/${selected.id}/data`} alt="" className="w-full max-h-64 object-contain bg-zinc-800 rounded-lg" />
            <div>
              <label className="block text-sm mb-1">Leírás</label>
              <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm mb-1">Címkék</label>
              <div className="flex flex-wrap gap-2">
                {TAGS.map(t => (
                  <button key={t} onClick={() => setEditTags(editTags.includes(t) ? editTags.filter(x => x !== t) : [...editTags, t])} className={`px-2 py-1 rounded text-xs ${editTags.includes(t) ? 'bg-amber-500 text-black' : 'bg-zinc-800'}`}>{t}</button>
                ))}
              </div>
            </div>
            <p className="text-xs text-zinc-500">Feltöltve: {formatDate(selected.created_at)}</p>
          </div>
        )}
      </Modal>

      {/* Delete Image Confirm */}
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Törlés" footer={
        <><Button variant="outline" onClick={() => setToDelete(null)}>Mégse</Button><Button variant="danger" onClick={handleDeleteImage}>Törlés</Button></>
      }>
        <p>Biztosan törlöd ezt a képet?</p>
      </Modal>

      {/* Delete Floorplan Confirm */}
      <Modal open={!!fpToDelete} onClose={() => setFpToDelete(null)} title="Tervrajz törlése" footer={
        <><Button variant="outline" onClick={() => setFpToDelete(null)}>Mégse</Button><Button variant="danger" onClick={handleDeleteFp}>Törlés</Button></>
      }>
        <p>Biztosan törlöd a "{fpToDelete?.name}" tervrajzot?</p>
      </Modal>
    </div>
  );
}

// Main App
export default function App() {
  const [project, setProject] = useState(null);
  return (
    <>
      <Toaster position="top-right" richColors theme="dark" />
      {project ? <ProjectDetail project={project} onBack={() => setProject(null)} /> : <ProjectsList onSelect={setProject} />}
    </>
  );
}
