import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, Navigation, Car, Clock, MapPin, Bike, PersonStanding, Lock } from 'lucide-react';
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

// --- Custom Component to Fit Bounds Automatically ---
// Ensures the map *always* shows both points and the route
const MapController = ({ coords }: { coords: [number, number][] }) => {
    const map = useMap();
    
    useEffect(() => {
        if (coords.length > 1) {
            const bounds = L.latLngBounds(coords);
            // Invalidate size to prevent gray tiles if container resized
            map.invalidateSize();
            // Fit bounds with padding to ensure markers aren't on the edge
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
            
            // Re-run shortly after to catch any layout shifts (like bottom sheet animation)
            const timer = setTimeout(() => {
                map.invalidateSize();
                map.fitBounds(bounds, { padding: [50, 80], maxZoom: 16 });
            }, 600);

            return () => clearTimeout(timer);
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
  
  // Sheet state
  const [sheetHeight, setSheetHeight] = useState('40%');
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef<number>(0);
  const startHeight = useRef<number>(0);

  const [routeInfo, setRouteInfo] = useState<{
      distanceKm: number;
      durationMin: number; // Carro
      motoDurationMin: number;
      walkingDurationMin: number;
      path: [number, number][];
      startCoords: [number, number] | null;
      endCoords: [number, number] | null;
  }>({ 
      distanceKm: 0, 
      durationMin: 0, 
      motoDurationMin: 0, 
      walkingDurationMin: 0, 
      path: [], 
      startCoords: null, 
      endCoords: null 
  });

  const [price, setPrice] = useState<{ avg: number }>({ avg: 0 });

  useEffect(() => {
    const calculateRoute = async () => {
      setLoading(true);
      setError('');

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
        
        // Try precise address first
        let memberCoords = null;
        const street = member.street ? member.street.trim() : '';
        const neighborhood = member.neighborhood ? member.neighborhood.trim() : '';
        const city = member.city ? member.city.trim() : CHURCH_ADDRESS.city;
        const state = CHURCH_ADDRESS.state || 'Rio de Janeiro';
        const zip = member.zipCode ? member.zipCode.trim() : '';

        // Strategy 1: Full Address
        if (street) {
             memberCoords = await getCoordinates(`${street}, ${neighborhood}, ${city}, ${state}, Brasil`);
        }
        // Strategy 2: Zip
        if (!memberCoords && zip) {
            memberCoords = await getCoordinates(`${zip}, Brasil`);
        }
        // Strategy 3: City Fallback
        if (!memberCoords) {
             memberCoords = await getCoordinates(`${city}, ${state}, Brasil`);
        }

        if (!memberCoords) {
            setError('Falha ao localizar endereço do membro.');
            setLoading(false);
            return;
        }

        const route = await getRouteData(churchCoords, memberCoords);
        if (!route) {
            setError('Rota não encontrada.');
            setLoading(false);
            return;
        }

        const distKm = route.distance / 1000;
        const durMin = Math.round(route.duration / 60); // Car Time
        
        // Estimations
        const motoMin = Math.max(1, Math.round(durMin * 0.80)); // ~20% faster usually in traffic logic
        const walkMin = Math.round(distKm * 15); // ~15 min per km

        // Pricing
        const baseRate = 6.0;
        const rawAvg = distKm * baseRate;

        setPrice({ avg: Math.round(Math.max(7, rawAvg)) });

        setRouteInfo({
            distanceKm: parseFloat(distKm.toFixed(1)),
            durationMin: durMin,
            motoDurationMin: motoMin,
            walkingDurationMin: walkMin,
            path: route.geometry,
            startCoords: [churchCoords.lat, churchCoords.lon],
            endCoords: [memberCoords.lat, memberCoords.lon],
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
  
  // Memoize icons to prevent re-creation on every render (drag) which causes Marker to re-mount and throw _leaflet_pos error
  const churchIcon = useMemo(() => createIcon('IGREJA', '#4169E1'), []);
  const memberIcon = useMemo(() => createIcon(firstName.toUpperCase(), '#10b981'), [firstName]);

  // --- Drag & Drop Logic for Mobile ---
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    // Get current height in pixels
    const el = e.currentTarget.closest('.bottom-sheet') as HTMLElement;
    startHeight.current = el ? el.offsetHeight : 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const deltaY = startY.current - currentY; // Positive = Drag Up
    const newHeight = startHeight.current + deltaY;
    
    // Limits (pixels) roughly
    const maxHeight = window.innerHeight * 0.90;
    const minHeight = window.innerHeight * 0.25;

    if (newHeight > minHeight && newHeight < maxHeight) {
        setSheetHeight(`${newHeight}px`);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // Snap logic
    const currentPixelHeight = parseFloat(sheetHeight); // Assuming px if set by drag
    const windowHeight = window.innerHeight;
    
    if (sheetHeight.includes('%')) {
        // Toggle logic if clicked instead of dragged
        if (parseInt(sheetHeight) < 50) {
            setSheetHeight('85%');
        } else {
            setSheetHeight('40%');
        }
    } else {
        // Drag snap
        if (currentPixelHeight > windowHeight * 0.5) {
            setSheetHeight('85%');
        } else {
            setSheetHeight('40%');
        }
    }
  };

  // Allow clicking the handle to toggle
  const handleHandleClick = () => {
     if (sheetHeight === '85%' || (sheetHeight.endsWith('px') && parseFloat(sheetHeight) > window.innerHeight * 0.5)) {
         setSheetHeight('40%');
     } else {
         setSheetHeight('85%');
     }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-0 md:p-4">
       <div className="bg-slate-900 md:border md:border-slate-700 md:rounded-xl w-full max-w-4xl shadow-2xl flex flex-col h-full md:h-[90vh] overflow-hidden relative">
          
          {/* Header - Desktop Only */}
          <div className="hidden md:flex p-4 border-b border-slate-800 justify-between items-center bg-slate-900 shrink-0 z-50">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-royal-900/30 rounded-full">
                    <Navigation className="text-royal-500" size={20}/>
                </div>
                <div className="flex flex-col">
                    <h3 className="font-bold text-white text-base">Trajeto de Visita</h3>
                    <p className="text-xs text-slate-400">Destino: {member.street}</p>
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
             
             {/* Map Panel */}
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
                        <Marker position={routeInfo.startCoords} icon={churchIcon} />
                        <Marker position={routeInfo.endCoords} icon={memberIcon} />
                        <MapController coords={[routeInfo.startCoords, routeInfo.endCoords]} />
                    </MapContainer>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="animate-spin w-8 h-8 border-2 border-royal-500 rounded-full border-t-transparent"></div>
                    </div>
                )}
             </div>

             {/* Stats Panel (Bottom Sheet) */}
             <div 
                className={`
                    bottom-sheet
                    absolute bottom-0 w-full md:relative md:w-80 md:h-auto 
                    bg-slate-900 md:bg-slate-950 
                    rounded-t-3xl md:rounded-none
                    shadow-[0_-5px_20px_rgba(0,0,0,0.7)] md:shadow-none
                    border-t border-slate-700/50 md:border-t-0 md:border-r md:border-slate-800
                    z-20 flex flex-col transition-all duration-300 ease-out
                `}
                style={{ height: window.innerWidth < 768 ? sheetHeight : 'auto' }}
             >
                {/* Mobile Drag Handle */}
                <div 
                    className="w-full h-9 flex items-center justify-center cursor-pointer md:hidden shrink-0 touch-none"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onClick={handleHandleClick}
                >
                    <div className="w-12 h-1.5 bg-slate-700 rounded-full"></div>
                </div>

                {/* Content Container */}
                <div className="p-6 pt-2 md:pt-6 flex flex-col gap-4 overflow-y-auto h-full scrollbar-hide">
                    
                    {loading ? (
                         <div className="text-center text-slate-500 py-4">Calculando rota...</div>
                    ) : error ? (
                        <div className="text-center text-red-400 py-4">{error}</div>
                    ) : (
                        <>
                            {/* Mobile Layout */}
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

                                {/* Stacked Stats List (Ordered as requested) */}
                                <div className="flex flex-col gap-3 mb-4">
                                    
                                    {/* 1. Distância */}
                                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <MapPin size={16} className="text-royal-500"/>
                                            <span className="text-xs uppercase font-bold">Distância</span>
                                        </div>
                                        <p className="text-white font-semibold">{routeInfo.distanceKm} km</p>
                                    </div>
                                    
                                    {/* 2. Carro */}
                                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Car size={16} className="text-blue-400"/>
                                            <span className="text-xs uppercase font-bold">Carro</span>
                                        </div>
                                        <p className="text-white font-semibold">~{routeInfo.durationMin} min</p>
                                    </div>

                                    {/* 3. Moto */}
                                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Bike size={16} className="text-yellow-400"/>
                                            <span className="text-xs uppercase font-bold">Moto</span>
                                        </div>
                                        <p className="text-white font-semibold">~{routeInfo.motoDurationMin} min</p>
                                    </div>

                                    {/* 4. A pé */}
                                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <PersonStanding size={16} className="text-orange-500"/>
                                            <span className="text-xs uppercase font-bold">A pé</span>
                                        </div>
                                        <p className="text-white font-semibold">~{routeInfo.walkingDurationMin} min</p>
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

                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm text-slate-300 border-b border-slate-800 pb-2">
                                        <span>Distância</span>
                                        <span className="font-bold">{routeInfo.distanceKm} km</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-300 border-b border-slate-800 pb-2">
                                        <span>Carro</span>
                                        <span className="font-bold">{routeInfo.durationMin} min</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-300 border-b border-slate-800 pb-2">
                                        <span>Moto</span>
                                        <span className="font-bold">{routeInfo.motoDurationMin} min</span>
                                    </div>
                                     <div className="flex justify-between text-sm text-slate-300">
                                        <span>Caminhando</span>
                                        <span className="font-bold">{routeInfo.walkingDurationMin} min</span>
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
                        </>
                    )}
                </div>
             </div>

          </div>
       </div>
    </div>
  );
};