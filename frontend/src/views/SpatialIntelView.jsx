import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Circle, useMap, useMapEvents, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import axios from '../api/axios';
import { Map as MapIcon, Calendar, Activity, Info, Target, Plus, Trash2, MoreVertical, X, MapPin } from 'lucide-react';
import Skeleton from '../components/Skeleton';
import { useToast } from '../context/ToastContext';

const markerIcon = new L.DivIcon({
  html: `<div style="background-color: #8b5cf6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(139,92,246,0.8);"></div>`,
  className: 'custom-marker-icon',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const MapEventsHandler = ({ onClick, center }) => {
  const map = useMapEvents({
    click(e) {
      onClick(e.latlng);
    }
  });

  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom() < 13 ? 15 : map.getZoom());
    }
  }, [center, map]);

  return null;
};

// Heatmap Layer Component for React-Leaflet
const HeatmapLayer = ({ points }) => {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const handleZoom = () => setZoom(map.getZoom());
    map.on('zoomend', handleZoom);
    return () => map.off('zoomend', handleZoom);
  }, [map]);

  useEffect(() => {
    if (points && points.length > 0) {
        try {
            const heatData = points.map(p => [p.lat, p.lng]);
            const bounds = L.latLngBounds(heatData);
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
            }
        } catch (e) {}
    }
  }, [points, map]);

  useEffect(() => {
    if (!points || points.length === 0) return;

    const heatData = points.map(p => [p.lat, p.lng, p.weight || 0.5]);
    const dynamicRadius = Math.max(20, 60 - (zoom * 3));

    const layer = L.heatLayer(heatData, {
      radius: dynamicRadius,
      blur: 20,
      maxZoom: 17,
      minOpacity: 0.4,
      gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
    }).addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [points, map, zoom]);

  return null;
};

const SpatialIntelView = () => {
  const [range, setRange] = useState('week');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offices, setOffices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const { showToast } = useToast();

  const [coordsInput, setCoordsInput] = useState('');
  const [radiusInput, setRadiusInput] = useState(100);

  useEffect(() => {
    if (showModal) {
      setCoordsInput('');
      setRadiusInput(100);
    }
  }, [showModal]);

  const defaultCenter = useMemo(() => {
    if (offices.length > 0 && offices[0].location) {
      const parts = offices[0].location.split(',').map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return parts;
      }
    }
    return [18.5204, 73.8567];
  }, [offices]);

  const parsedCoords = useMemo(() => {
    if (!coordsInput) return null;
    const parts = coordsInput.split(',').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts;
    }
    return null;
  }, [coordsInput]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [res, officeRes] = await Promise.all([
        axios.get(`admin/spatial-density?range=${range}`),
        axios.get('admin/offices')
      ]);
      setData(res.data);
      setOffices(officeRes.data);
    } catch (err) {
      console.error('Map Data Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [range]);

  const handleDelete = async (id) => {
    if (window.confirm("Permanently delete this office? Location verification for this area will be disabled.")) {
        try { 
            await axios.delete(`admin/offices/${id}`); 
            showToast("Office location deleted.", "success");
            fetchData(); 
        } catch(e) { 
            showToast(e.response?.data?.error || "Unable to delete office.", "error");
        }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] animate-in fade-in duration-700">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="italic font-black text-4xl mb-2 flex items-center gap-4 uppercase tracking-tighter text-white">
            Office Location
            <div className="px-2 py-0.5 bg-violet-600 text-[10px] tracking-[0.3em] italic rounded uppercase">Unified Command</div>
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Live Geofence Monitoring & Infrastructure Management</p>
        </div>

        <div className="flex gap-4 items-center">
            <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl mr-4">
                {['today', 'week', 'month'].map(r => (
                    <button
                        key={r}
                        onClick={() => setRange(r)}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg ${range === r ? 'bg-violet-600 text-white italic shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'text-slate-500 hover:text-white'}`}
                    >
                    {r}
                    </button>
                ))}
            </div>
            <button onClick={() => setShowModal(true)} className="btn-primary px-8 h-12 text-[10px] uppercase font-black tracking-widest italic shadow-lg shadow-violet-900/20">Add New Office</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-8 min-h-0 overflow-hidden">
        {/* Top Section: Live Map & Insights */}
        <div className="h-[45%] flex gap-8 shrink-0">
            <div className="flex-1 glass-panel p-2 relative overflow-hidden group border-white/5 bg-slate-950/40">
                <div className="absolute inset-0 z-0">
                    {loading ? (
                        <div className="w-full h-full flex items-center justify-center bg-slate-900/50 backdrop-blur-md">
                            <div className="text-center">
                                <Activity className="animate-pulse text-violet-500 mx-auto mb-4" size={40} />
                                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Syncing Spatial Data...</p>
                            </div>
                        </div>
                    ) : (
                        <MapContainer 
                            center={[0, 0]} 
                            zoom={2} 
                            style={{ height: '100%', width: '100%', background: '#0b0f19' }}
                            zoomControl={false}
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                attribution='&copy; CARTO'
                            />
                            
                            <HeatmapLayer points={data} />

                            {offices.map(office => {
                                if (!office.location || !office.location.includes(',')) return null;
                                const [lat, lng] = office.location.split(',').map(Number);
                                return (
                                    <Circle 
                                        key={office.id}
                                        center={[lat, lng]}
                                        radius={office.radius || 100} 
                                        pathOptions={{ 
                                            color: '#8b5cf6', 
                                            fillColor: '#8b5cf6', 
                                            fillOpacity: 0.1,
                                            weight: 2,
                                            dashArray: '5, 10'
                                        }}
                                    />
                                );
                            })}
                        </MapContainer>
                    )}
                </div>
                
                <div className="absolute bottom-6 left-6 z-[1000] flex flex-col gap-2 scale-75 origin-bottom-left">
                    <div className="p-5 bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-2xl min-w-[200px] shadow-2xl">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-4 text-left">Telemetry Key</h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]"></div>
                                <span className="text-[9px] font-bold text-white uppercase tracking-widest">High Density</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]"></div>
                                <span className="text-[9px] font-bold text-white uppercase tracking-widest">Low Density</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full border-2 border-violet-500/60 border-dashed"></div>
                                <span className="text-[9px] font-bold text-white uppercase tracking-widest">Authorized Geofence</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-80 flex flex-col gap-6">
                <div className="glass-panel p-6 flex-1 flex flex-col justify-center">
                    <h3 className="italic font-black uppercase text-[11px] mb-6 flex items-center gap-2 text-white">
                        <Target size={14} className="text-violet-500" /> Infrastructure
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Active Geofences</p>
                            <p className="text-2xl font-black italic text-white">{loading ? <Skeleton width={60} height={24} /> : offices.length}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Density Level</p>
                            <p className="text-2xl font-black italic text-emerald-500">STABLE</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Bottom Section: Office Management Table */}
        <div className="flex-1 glass-panel p-0 overflow-hidden border-white/5 bg-slate-950/40">
            <div className="table-scroll-shield h-full overflow-y-auto">
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className="sticky top-0 bg-slate-950/80 backdrop-blur z-10 px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5">Office Name</th>
                            <th className="sticky top-0 bg-slate-950/80 backdrop-blur z-10 px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5">GPS Coordinates</th>
                            <th className="sticky top-0 bg-slate-950/80 backdrop-blur z-10 px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5">Radius (m)</th>
                            <th className="sticky top-0 bg-slate-950/80 backdrop-blur z-10 px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5">Shift Window</th>
                            <th className="sticky top-0 bg-slate-950/80 backdrop-blur z-10 px-6 py-4 text-right pr-10 text-[9px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {offices.map(o => (
                            <tr key={o.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-black uppercase italic text-white text-[11px] tracking-tight">{o.name}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-violet-500 font-mono text-[9px] font-bold">
                                        <MapPin size={10} /> {o.location}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] font-black text-slate-400">{o.radius}m</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="px-2 py-0.5 bg-violet-600/20 border border-violet-500/20 rounded text-[9px] font-black text-violet-400 italic">
                                            {o.startTime || '--:--'}
                                        </div>
                                        <span className="text-slate-600 text-[8px]">to</span>
                                        <div className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded text-[9px] font-black text-rose-400 italic">
                                            {o.endTime || '--:--'}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right pr-10 relative">
                                    <button 
                                        onClick={() => setActiveMenu(activeMenu === o.id ? null : o.id)} 
                                        className={`p-2 text-slate-500 hover:text-white transition-all ${activeMenu === o.id ? 'rotate-90 text-violet-500' : ''}`}
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                    {activeMenu === o.id && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)}></div>
                                            <div className="absolute right-10 top-10 w-48 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl z-50 py-2 animate-in zoom-in-95 duration-200">
                                                <button onClick={() => { handleDelete(o.id); setActiveMenu(null); }} className="w-full text-left px-6 py-3 text-[10px] font-black text-rose-500 hover:bg-rose-500/10 flex items-center gap-3 uppercase">
                                                    <Trash2 size={14} /> Delete Geofence
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
            <div className="modal-content w-[480px] glass-panel border-white/10">
                <button className="close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
                <h3 className="italic font-black uppercase mb-8 text-xl tracking-tight text-white">Provision New Geofence</h3>
                <form onSubmit={async (e)=>{ 
                    e.preventDefault(); 
                    try {
                        const formData = new FormData(e.target);
                        await axios.post('admin/offices', { 
                            name: formData.get('n'), 
                            address: formData.get('a'), 
                            location: coordsInput, 
                            radius: Number(radiusInput),
                            startTime: formData.get('st'),
                            endTime: formData.get('et')
                        }); 
                        showToast("Infrastructure updated.", "success");
                        setShowModal(false); 
                        fetchData(); 
                    } catch(err) { 
                        showToast(err.response?.data?.error || "Provisioning failure.", "error");
                    }
                }} className="space-y-6">
                    <div><label className="label-proto">Geofence Label</label><input name="n" placeholder="E.g. Primary Hub" required className="bg-white/5 border-white/10 text-white" /></div>
                    <div><label className="label-proto">Street Address</label><input name="a" placeholder="Full verification address" required className="bg-white/5 border-white/10 text-white" /></div>
                    <div>
                        <label className="label-proto">GPS Target (Lat, Lng)</label>
                        <input 
                            name="l" 
                            value={coordsInput}
                            onChange={(e) => setCoordsInput(e.target.value)}
                            placeholder="18.5204, 73.8567" 
                            required 
                            className="bg-white/5 border-white/10 font-mono text-xs text-white" 
                        />
                    </div>
                    <div>
                        <label className="label-proto">Validation Radius (Meters)</label>
                        <input 
                            name="r" 
                            type="number" 
                            value={radiusInput}
                            onChange={(e) => setRadiusInput(Number(e.target.value))}
                            required 
                            className="bg-white/5 border-white/10 text-white" 
                        />
                    </div>

                    <div className="h-48 rounded-xl overflow-hidden border border-white/10 relative z-0">
                        <MapContainer
                            center={parsedCoords || defaultCenter}
                            zoom={parsedCoords ? 15 : 12}
                            style={{ height: '100%', width: '100%', background: '#0b0f19' }}
                            zoomControl={false}
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                attribution='&copy; CARTO'
                            />
                            <MapEventsHandler 
                                onClick={(latlng) => {
                                    setCoordsInput(`${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`);
                                }}
                                center={parsedCoords}
                            />
                            {parsedCoords && (
                                <>
                                    <Marker position={parsedCoords} icon={markerIcon} />
                                    <Circle 
                                        center={parsedCoords} 
                                        radius={radiusInput || 100}
                                        pathOptions={{ 
                                            color: '#8b5cf6', 
                                            fillColor: '#8b5cf6', 
                                            fillOpacity: 0.15,
                                            weight: 1.5,
                                            dashArray: '4, 8'
                                        }}
                                    />
                                </>
                            )}
                        </MapContainer>
                        <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded text-[8px] font-black text-slate-400 uppercase tracking-widest pointer-events-none z-[1000]">
                            Click map to place pin
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="label-proto">Operational Start</label>
                            <input name="st" type="time" defaultValue="08:00" required className="w-full bg-white/5 border-white/10 text-white" />
                        </div>
                        <div className="flex-1">
                            <label className="label-proto">Operational End</label>
                            <input name="et" type="time" defaultValue="20:00" required className="w-full bg-white/5 border-white/10 text-white" />
                        </div>
                    </div>
                    <button className="btn-primary mt-8 w-full h-14 font-black italic tracking-widest shadow-lg shadow-violet-900/20">INITIALIZE GEOFENCE</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default SpatialIntelView;
