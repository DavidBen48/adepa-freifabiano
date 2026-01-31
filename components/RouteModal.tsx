import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, Navigation, Car, Clock, MapPin, AlertCircle, CheckCircle2, AlertTriangle, Activity, Lock, ChevronUp, ChevronDown } from 'lucide-react';
import { Member } from '../types';
import { CHURCH_ADDRESS } from '../constants';

// --- Helper Functions for API ---
const getCoordinates = async (address: string) => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, {
        headers: { "User-Agent": "MembersAI-ADEPA/1.0" }
    });
    const data = await response.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error", error);
    return null;
  }
};

const getRouteData = async (start: {lat: number, lon: number}, end: {lat: number, lon: number}) => {
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.code === 'Ok') {
            return {
                distance: data.routes[0].distance,
                duration: data.routes[0].duration,
                geometry: data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]])
            };
        }
        return null;
    } catch (error) {
        console.error("Routing error", error);
        return null;
    }
};

// --- Custom Components ---
const MapFitter = ({ coords }: { coords: [number, number][] }) => {
    const map = useMap();
    useEffect(() => {
        if (coords.length > 0) {
            const bounds = L.latLngBounds(coords);
            map.fitBounds(bounds, { padding: [80, 80] });
        }
    }, [coords, map]);
    return null;
};

const createIcon = (label: string, color: string) => {
    return L.divIcon({
        className: 'custom-map-marker',
        html: `
            <div style="position: relative; width: 0; height: 0;">
                <div style="
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    transform: translate(-50%, -10px);
                    background-color: ${color};
                    color: white;
                    padding: 8px 12px;
                    border-radius: 4px;
                    font-weight: bold;
                    font-size: 12px;
                    white-space: nowrap;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.4);
                    border: 1px solid rgba(255,255,255,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    ${label}
                    <div style="
                        position: absolute;
                        bottom: -6px;
                        left: 50%;
                        transform: translateX(-50%) rotate(45deg);
                        width: 12px;
                        height: 12px;
                        background-color: ${color};
                        border-bottom: 1px solid rgba(0,0,0,0.1);
                        border-right: 1px solid rgba(0,0,0,0.1);
                        z-index: -1;
                    "></div>
                </div>
                <div style="
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    background-color: white;
                    border: 2px solid ${color};
                    border-radius: 50%;
                    top: -4px;
                    left: -4px;
                    box-shadow: 0 0 0 2px rgba(0,0,0,0.3);
                "></div>
            </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0] 
    });
};

interface RouteModalProps {
  member: Member;
  onClose: () => void;
  isReadOnly?: boolean;
}

export const RouteModal: React.FC<RouteModalProps> = ({ member, onClose, isReadOnly = false }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [methodUsed, setMethodUsed] = useState<'plan1' | 'plan2' | 'plan3' | null>(null);
  
  // Sheet state for Mobile (Expanded vs Collapsed)
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);

  const [routeInfo, setRouteInfo] = useState<{
      distanceKm: number;
      durationMin: number;
      path: [number, number][];
      startCoords: [number, number] | null;
      endCoords: [number, number] | null;
  }>({ distanceKm: 0, durationMin: 0, path: [], startCoords: null, endCoords: null });

  const [price, setPrice] = useState<{ avg: number, min: number, max: number }>({ avg: 0, min: 0, max: 0 });

  useEffect(() => {
    const calculateRoute = async () => {
      setLoading(true);
      setError('');
      setMethodUsed(null);

      try {
        let churchCoords = null;
        if (CHURCH_ADDRESS.cep) {
             churchCoords = await getCoordinates(`${CHURCH_ADDRESS.cep}, Brasil`);
        }
        if (!churchCoords) {
            churchCoords = await getCoordinates(CHURCH_ADDRESS.fullAddress);
        }
        if (!churchCoords) {
            setError("Erro: Igreja não localizada.");
            setLoading(false);
            return;
        }
        
        let memberCoords = null;
        let successPlan: 'plan1' | 'plan2' | 'plan3' | null = null;
        const street = member.street ? member.street.trim() : '';
        const neighborhood = member.neighborhood ? member.neighborhood.trim() : '';
        const city = member.city ? member.city.trim() : CHURCH_ADDRESS.city;
        const state = CHURCH_ADDRESS.state || 'Rio de Janeiro';
        const zip = member.zipCode ? member.zipCode.trim() : '';

        if (!memberCoords && street && neighborhood) {
            const query1 = `${street}, ${neighborhood}, ${city}, ${state}, Brasil`;
            memberCoords = await getCoordinates(query1);
            if (memberCoords) successPlan = 'plan1';
        }
        if (!memberCoords && zip) {
            const query2 = `${zip}, Brasil`;
            memberCoords = await getCoordinates(query2);
            if (memberCoords) successPlan = 'plan2';
        }
        if (!memberCoords && street && zip) {
             const query3 = `${street}, ${city}, ${state}, ${zip}, Brasil`;
             memberCoords = await getCoordinates(query3);
             if (memberCoords) successPlan = 'plan3';
        }

        if (!memberCoords) {
            setError('Falha ao localizar endereço do membro.');
            setLoading(false);
            return;
        }

        setMethodUsed(successPlan);

        const route = await getRouteData(churchCoords, memberCoords);
        if (!route) {
            setError('Rota não encontrada.');
            setLoading(false);
            return;
        }

        const distKm = route.distance / 1000;
        const durMin = Math.round(route.duration / 60);
        const baseRate = 6.0;
        const rawAvg = distKm * baseRate;
        const rawMin = distKm * 5.0; 
        const rawMax = distKm * 8.0;

        setPrice({
            avg: Math.round(Math.max(7, rawAvg)),
            min: Math.floor(Math.max(6, rawMin)),
            max: Math.ceil(Math.max(8, rawMax))
        });

        const walkingMinutes = Math.round(distKm * 16);

        setRouteInfo({
            distanceKm: parseFloat(distKm.toFixed(1)),
            durationMin: durMin,
            path: route.geometry,
            startCoords: [churchCoords.lat, churchCoords.lon],
            endCoords: [memberCoords.lat, memberCoords.lon],
            // @ts-ignore
            walkingTime: walkingMinutes
        });

        setLoading(false);
      } catch (e) {
        console.error("Critical error in route calc", e);
        setError("Erro interno.");
        setLoading(false);
      }
    };

    calculateRoute();
  }, [member]);

  const firstName = member.fullName.split(' ')[0];

  // Logic for Dragging Sheet
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragStartY.current) return;
    const currentY = e.touches[0].clientY;
    const diff = dragStartY.current - currentY;
    
    // Simple logic: if dragging up significantly, expand. If dragging down, collapse.
    if (diff > 50 && !isSheetExpanded) {
        setIsSheetExpanded(true);
        dragStartY.current = null;
    } else if (diff < -50 && isSheetExpanded) {
        setIsSheetExpanded(false);
        dragStartY.current = null;
    }
  };

  const toggleSheet = () => {
    setIsSheetExpanded(!isSheetExpanded);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-0 md:p-4">
       <div className="bg-slate-900 md:border md:border-slate-700 md:rounded-xl w-full max-w-4xl shadow-2xl flex flex-col h-full md:h-[90vh] overflow-hidden relative">
          
          {/* Header - Desktop Only (Hidden on mobile to maximize map) */}
          <div className="hidden md:flex p-4 border-b border-slate-800 justify-between items-center bg-slate-900 shrink-0 z-50">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-royal-900/30 rounded-full">
                    <Navigation className="text-royal-500" size={20}/>
                </div>
                <div className="flex flex-col">
                    <h3 className="font-bold text-white text-base">Trajeto de Visita</h3>
                    <p className="text-xs text-slate-400">
                        Destino: {member.street}
                    </p>
                </div>
             </div>
             <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                <X size={24} />
             </button>
          </div>

          {/* Close Button Mobile (Floating on Map) */}
          <button 
             onClick={onClose} 
             className="md:hidden absolute top-4 right-4 z-[1001] bg-slate-900/80 p-2 rounded-full text-white shadow-lg backdrop-blur-sm border border-slate-700"
          >
             <X size={24} />
          </button>

          <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative">
             
             {/* Map Panel (Mobile: Fullscreen Background, Desktop: Right Side) */}
             <div className="absolute inset-0 md:relative md:flex-1 bg-slate-800 z-0">
                {!loading && !error && routeInfo.startCoords && routeInfo.endCoords ? (
                    <MapContainer 
                        center={routeInfo.startCoords} 
                        zoom={13} 
                        style={{ height: "100%", width: "100%", background: '#1e293b' }}
                        zoomControl={false}
                    >
                        <TileLayer
                            attribution='&copy; OpenStreetMap'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        <Polyline positions={routeInfo.path} color="#ffffff" weight={4} opacity={1} lineCap="round" lineJoin="round" />
                        <Marker position={routeInfo.startCoords} icon={createIcon('IGREJA', '#4169E1')} />
                        <Marker position={routeInfo.endCoords} icon={createIcon(firstName.toUpperCase(), '#10b981')} />
                        <MapFitter coords={[routeInfo.startCoords, routeInfo.endCoords]} />
                    </MapContainer>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="animate-spin w-8 h-8 border-2 border-royal-500 rounded-full border-t-transparent"></div>
                    </div>
                )}
             </div>

             {/* Stats Panel (Mobile: Bottom Sheet Overlay, Desktop: Left Side) */}
             <div 
                ref={sheetRef}
                className={`
                    absolute bottom-0 w-full md:relative md:w-80 md:h-auto 
                    bg-slate-900 md:bg-slate-950 
                    rounded-t-3xl md:rounded-none
                    shadow-[0_-5px_20px_rgba(0,0,0,0.7)] md:shadow-none
                    border-t border-slate-700/50 md:border-t-0 md:border-r md:border-slate-800
                    z-20 flex flex-col transition-all duration-300 ease-in-out
                    ${isSheetExpanded ? 'h-[85%]' : 'h-[40%] md:h-auto'}
                `}
             >
                {/* Mobile Drag Handle */}
                <div 
                    className="w-full h-8 flex items-center justify-center cursor-pointer md:hidden shrink-0"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onClick={toggleSheet}
                >
                    <div className="w-12 h-1.5 bg-slate-700 rounded-full"></div>
                </div>

                {/* Content Container */}
                <div className="p-6 pt-2 md:pt-6 flex flex-col gap-6 overflow-y-auto h-full">
                    
                    {loading ? (
                         <div className="text-center text-slate-500 py-4">Calculando rota...</div>
                    ) : error ? (
                        <div className="text-center text-red-400 py-4">{error}</div>
                    ) : (
                        <>
                            {/* Mobile Layout (Bottom Sheet Content) */}
                            <div className="md:hidden">
                                {/* Header */}
                                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
                                    <div>
                                        <h3 className="text-xl font-bold text-white leading-tight">Carro de Aplicativo</h3>
                                        <div className="flex items-center gap-2 mt-1 text-slate-400">
                                            <Car size={14} />
                                            <span className="text-sm">~{routeInfo.durationMin} min</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                         <span className="text-2xl font-bold text-white">R${price.avg}</span>
                                    </div>
                                </div>

                                {/* Stats Info (Stacked List) */}
                                <div className="flex flex-col gap-3 mb-4">
                                    {/* Item 1: Distancia */}
                                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <MapPin size={16} className="text-royal-500"/>
                                            <span className="text-xs uppercase font-bold">Distância</span>
                                        </div>
                                        <p className="text-white font-semibold text-lg">{routeInfo.distanceKm} km</p>
                                    </div>
                                    
                                    {/* Item 2: A pé */}
                                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Clock size={16} className="text-orange-500"/>
                                            <span className="text-xs uppercase font-bold">A pé</span>
                                        </div>
                                        {/* @ts-ignore */}
                                        <p className="text-white font-semibold text-lg">~{routeInfo.walkingTime} min</p>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop Layout (Hidden on Mobile) */}
                            <div className="hidden md:block space-y-4">
                                <div className="bg-slate-900 rounded-lg p-5 border border-slate-800 shadow-lg">
                                    <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Valor Estimado</span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="text-sm text-slate-400">R$</span>
                                        <span className="text-4xl font-bold text-white">{price.avg},00</span>
                                    </div>
                                    <p className="text-[10px] text-slate-600 mt-2">Tarifa base R$ 6,00/km.</p>
                                </div>

                                <div className="flex items-center gap-4 text-slate-200">
                                    <div className="w-10 h-10 rounded bg-slate-900 flex items-center justify-center border border-slate-800">
                                        <MapPin size={20} className="text-royal-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Distância</p>
                                        <p className="font-semibold text-lg">{routeInfo.distanceKm} km</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-slate-200">
                                    <div className="w-10 h-10 rounded bg-slate-900 flex items-center justify-center border border-slate-800">
                                        <Clock size={20} className="text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Duração</p>
                                        <p className="font-semibold text-lg">{routeInfo.durationMin} min</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Button - Always at bottom */}
                            <div className="mt-auto pt-2 relative">
                                <a 
                                    href={isReadOnly ? "#" : `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(CHURCH_ADDRESS.fullAddress)}&destination=${encodeURIComponent(`${member.street}, ${member.number}, ${member.city}`)}&travelmode=driving`}
                                    target={isReadOnly ? undefined : "_blank"}
                                    rel={isReadOnly ? undefined : "noreferrer"}
                                    className={`block w-full py-4 bg-royal-600 hover:bg-royal-500 text-white text-center font-bold text-lg rounded-lg shadow-lg transition-colors ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isReadOnly ? "Abertura Bloqueada" : "Abrir no Maps"}
                                </a>
                                {isReadOnly && (
                                    <div className="absolute -top-3 right-0 bg-red-900/90 text-red-100 text-[10px] px-2 py-1 rounded-full flex items-center gap-1 border border-red-500/30">
                                        <Lock size={10} /> Visitante
                                    </div>
                                )}
                            </div>
                        
                            {/* Tags de status da API (Plano A/B/C) */}
                             <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2">
                                {methodUsed === 'plan1' && <span className="text-[10px] text-emerald-500 bg-emerald-900/20 px-2 py-1 rounded">Alta Precisão</span>}
                                {methodUsed === 'plan2' && <span className="text-[10px] text-orange-500 bg-orange-900/20 px-2 py-1 rounded">Precisão Média</span>}
                                {methodUsed === 'plan3' && <span className="text-[10px] text-red-500 bg-red-900/20 px-2 py-1 rounded">Baixa Precisão</span>}
                             </div>
                        </>
                    )}
                </div>
             </div>

          </div>
       </div>
    </div>
  );
};