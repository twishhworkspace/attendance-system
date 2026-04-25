import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import axios from '../api/axios';
import { Map as MapIcon, Calendar, Activity, Info, Target } from 'lucide-react';
import Skeleton from '../components/Skeleton';

// Heatmap Layer Component for React-Leaflet
const HeatmapLayer = ({ points }) => {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const handleZoom = () => setZoom(map.getZoom());
    map.on('zoomend', handleZoom);
    return () => map.off('zoomend', handleZoom);
  }, [map]);

  // Only auto-fit once when data is loaded
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

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] animate-in fade-in duration-700">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="italic font-black text-4xl mb-2 flex items-center gap-4 uppercase tracking-tighter">
            Spatial Intelligence
            <div className="px-2 py-0.5 bg-violet-600 text-[10px] tracking-[0.3em] italic rounded">DENSITY_MAP</div>
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Visualizing geofence integrity & punch distribution</p>
        </div>

        <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
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
      </div>

      <div className="flex-1 flex gap-8">
        <div className="flex-1 glass-panel p-2 relative overflow-hidden group">
            <div className="absolute inset-0 z-0">
                {loading ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900/50 backdrop-blur-md">
                        <div className="text-center">
                            <Activity className="animate-pulse text-violet-500 mx-auto mb-4" size={40} />
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Mapping Density Fields...</p>
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
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        />
                        
                        {/* Heatmap Layer */}
                        <HeatmapLayer points={data} />

                        {/* Geofence Overlay (Offices) */}
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
            
            <div className="absolute bottom-6 left-6 z-[1000] flex flex-col gap-2">
                <div className="p-5 bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-2xl min-w-[220px] shadow-2xl">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-4">Location Key</h4>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]"></div>
                            <span className="text-[9px] font-bold text-white uppercase tracking-widest">Busy Area (Many People)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]"></div>
                            <span className="text-[9px] font-bold text-white uppercase tracking-widest">Regular Area (Few People)</span>
                        </div>
                        <div className="flex items-center gap-3">
                             <div className="w-5 h-5 rounded-full border-2 border-violet-500/60 border-dashed"></div>
                             <span className="text-[9px] font-bold text-white uppercase tracking-widest">Authorized Office Area</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute top-6 right-6 z-[1000]">
                 <div className="p-3 bg-violet-600 shadow-[0_0_30px_rgba(139,92,246,0.4)] rounded-xl text-white">
                    <MapIcon size={20} />
                 </div>
            </div>
        </div>

        <div className="w-80 flex flex-col gap-6">
            <div className="glass-panel p-6">
                <h3 className="italic font-black uppercase text-[11px] mb-6 flex items-center gap-2">
                    <Target size={14} className="text-violet-500" /> Key Insights
                </h3>
                <div className="space-y-6">
                    <div>
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Active Offices</p>
                        <p className="text-2xl font-black italic">{loading ? <Skeleton width={60} height={24} /> : offices.length}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Office Compliance</p>
                        <p className="text-2xl font-black italic text-emerald-500">98.4%</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Sector Saturation</p>
                        <p className="text-[10px] font-bold text-slate-400 italic leading-relaxed">Most activity concentrated around main office entry points.</p>
                    </div>
                </div>
            </div>

            <div className="glass-panel p-6 bg-violet-600/5 border-violet-500/20">
                <h3 className="italic font-black uppercase text-[11px] mb-4 flex items-center gap-2">
                    <Info size={14} className="text-violet-500" /> Operational Tip
                </h3>
                <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic">
                    Use this map to verify field agent movements and ensure that high-density clusters remain within your authorized geofence radius. Red areas indicate high personnel concentration.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SpatialIntelView;
