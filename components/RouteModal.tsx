import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, Navigation, Car, MapPin, Bike, PersonStanding, Lock, Activity, Server, Cpu } from 'lucide-react';
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
  const [methodUsed, setMethodUsed] = useState<'plan1' | 'plan2' | 'plan3' | null>(null);
  
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
        
        // Dados do membro
        const street = member.street ? member.street.trim() : '';
        const number = member.number ? member.number.trim() : '';
        const neighborhood = member.neighborhood ? member.neighborhood.trim() : '';
        const city = member.city ? member.city.trim() : CHURCH_ADDRESS.city;
        const state = CHURCH_ADDRESS.state || 'Rio de Janeiro';
        const zip = member.zipCode ? member.zipCode.trim() : '';

        // --- LÓGICA DE CASCATA (WATERFALL) ---

        // Endpoint 1/3: Rua + Bairro
        if (!memberCoords && street && neighborhood) {
             const query1 = `${street}, ${neighborhood}, ${city}, ${state}, Brasil`;
             // console.log("Trying Endpoint 1:", query1);
             memberCoords = await getCoordinates(query1);
             if (memberCoords) successPlan = 'plan1';
        }

        // Endpoint 2/3: Pelo CEP
        if (!memberCoords && zip) {
            const query2 = `${zip}, Brasil`;
            // console.log("Trying Endpoint 2:", query2);
            memberCoords = await getCoordinates(query2);
            if (memberCoords) successPlan = 'plan2';
        }

        // Endpoint 3/3: Rua + CEP + Cidade + Estado
        if (!memberCoords && street) {
             const query3 = `${street}, ${zip}, ${city}, ${state}, Brasil`;
             // console.log("Trying Endpoint 3:", query3);
             memberCoords = await getCoordinates(query3);
             if (memberCoords) successPlan = 'plan3';
        }

        if (!memberCoords) {
            // Última tentativa de desespero: Só a cidade e estado para não quebrar a UI
            memberCoords = await getCoordinates(`${city}, ${state}, Brasil`);
        }

        if (!memberCoords) {
            setError('Falha crítica: Endereço não localizado pelos 3 endpoints.');
            setLoading(false);
            return;
        }

        setMethodUsed(successPlan);

        const route = await getRouteData(churchCoords, memberCoords);
        if (!route) {
            setError('Rota não encontrada entre a igreja e o destino.');
            setLoading(false);
            return;
        }

        const distKm = route.distance / 1000;
        
        // Cálculo de Tempo Personalizado (Regras Fixas)
        // Carro: 2:40 minutos por km = 160 segundos por km
        const carSeconds = distKm * 160;
        const durMin = Math.round(carSeconds / 60); 
        
        // Moto: 15% menos tempo que o carro
        const motoMin = Math.max(1, Math.round(durMin * 0.85)); 
        
        // Caminhando: ~15 min per km (mantido)
        const walkMin = Math.round(distKm * 15); 

        // Pricing Logic: 1km = R$6,00 base
        // Margem de erro entre -10% e +20%
        const baseRate = 6.0; 
        const rawCalc = distKm * baseRate;
        const minPrice = Math.floor(rawCalc * 0.9); // -10%
        const maxPrice = Math.ceil(rawCalc * 1.2); // +20%
        const avgPrice = Math.round(rawCalc);

        setPrice({ avg: avgPrice < 6 ? 6 : avgPrice }); // Mínimo de 6 reais

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
        setError("Erro de conexão com API.");
        setLoading(false);
      }
    };

    calculateRoute();
  }, [member]);

  const firstName = member.fullName.split(' ')[0];
  
  // Memoize icons
  const churchIcon = useMemo(() => createIcon('IGREJA', '#4169E1'), []);
  const memberIcon = useMemo(() => createIcon(firstName.toUpperCase(), '#10b981'), [firstName]);

  // --- Drag & Drop Logic for Mobile ---
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    const el = e.currentTarget.closest('.bottom-sheet') as HTMLElement;
    startHeight.current = el ? el.offsetHeight : 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const deltaY = startY.current - currentY;
    const newHeight = startHeight.current + deltaY;
    
    const maxHeight = window.innerHeight * 0.90;
    const minHeight = window.innerHeight * 0.25;

    if (newHeight > minHeight && newHeight < maxHeight) {
        setSheetHeight(`${newHeight}px`);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const currentPixelHeight = parseFloat(sheetHeight);
    const windowHeight = window.innerHeight;
    
    if (sheetHeight.includes('%')) {
        if (parseInt(sheetHeight) < 50) {
            setSheetHeight('85%');
        } else {
            setSheetHeight('40%');
        }
    } else {
        if (currentPixelHeight > windowHeight * 0.5) {
            setSheetHeight('85%');
        } else {
            setSheetHeight('40%');
        }
    }
  };

  const handleHandleClick = () => {
     if (sheetHeight === '85%' || (sheetHeight.endsWith('px') && parseFloat(sheetHeight) > window.innerHeight * 0.5)) {
         setSheetHeight('40%');
     } else {
         setSheetHeight('85%');
     }
  };

  // String formatada do destino (EXATAMENTE COMO PEDIDO)
  const destinationString = `Destino: ${member.street || ''}, nº${member.number || 'S/N'} - ${member.neighborhood || ''} | ${member.city || ''}`;

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
                    <p className="text-xs text-slate-400">{destinationString}</p>
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
                    <div className="w-full h-full flex items-center justify-center bg-slate-900">
                        {loading ? (
                           <div className="flex flex-col items-center gap-4 p-6 text-center animate-pulse">
                               <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-royal-500/30 shadow-[0_0_20px_rgba(65,105,225,0.2)]">
                                  <Server className="text-royal-500 animate-bounce" size={32} />
                               </div>
                               <div className="space-y-1">
                                   <h3 className="text-lg font-bold text-white">Backend trabalhando com API</h3>
                                   <p className="text-sm text-slate-400 flex items-center justify-center gap-2">
                                     <Cpu size={14} className="animate-spin" /> Processando geolocalização...
                                   </p>
                               </div>
                           </div>
                        ) : (
                           <div className="text-red-400 text-sm p-4 text-center">{error}</div>
                        )}
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
                    
                    {!loading && !error && (
                        <>
                            {/* Mobile Layout */}
                            <div className="md:hidden">
                                {/* Destination Header Mobile */}
                                <div className="mb-4 pb-2 border-b border-slate-800">
                                   <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Destino</p>
                                   <p className="text-xs text-slate-300 leading-snug">{destinationString}</p>
                                </div>

                                {/* Header Stats */}
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

                                {/* Stacked Stats List */}
                                <div className="flex flex-col gap-3 mb-4">
                                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <MapPin size={16} className="text-royal-500"/>
                                            <span className="text-xs uppercase font-bold">Distância</span>
                                        </div>
                                        <p className="text-white font-semibold">{routeInfo.distanceKm} km</p>
                                    </div>
                                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Car size={16} className="text-blue-400"/>
                                            <span className="text-xs uppercase font-bold">Carro</span>
                                        </div>
                                        <p className="text-white font-semibold">~{routeInfo.durationMin} min</p>
                                    </div>
                                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Bike size={16} className="text-yellow-400"/>
                                            <span className="text-xs uppercase font-bold">Moto</span>
                                        </div>
                                        <p className="text-white font-semibold">~{routeInfo.motoDurationMin} min</p>
                                    </div>
                                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <PersonStanding size={16} className="text-orange-500"/>
                                            <span className="text-xs uppercase font-bold">A pé</span>
                                        </div>
                                        <p className="text-white font-semibold">~{routeInfo.walkingDurationMin} min</p>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop Layout */}
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

                            {/* Action Button */}
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

                            {/* Tags de status da API (Endpoint 1/2/3) */}
                             <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2 px-6 pb-6 md:px-0 md:pb-0">
                                {methodUsed === 'plan1' && (
                                    <span className="text-[10px] text-emerald-400 bg-emerald-900/40 px-2 py-1 rounded border border-emerald-800 flex items-center gap-1">
                                        <Activity size={10} /> Endpoint 1/3 • Rua + Bairro
                                    </span>
                                )}
                                {methodUsed === 'plan2' && (
                                    <span className="text-[10px] text-yellow-400 bg-yellow-900/40 px-2 py-1 rounded border border-yellow-800 flex items-center gap-1">
                                        <Activity size={10} /> Endpoint 2/3 • Busca por CEP
                                    </span>
                                )}
                                {methodUsed === 'plan3' && (
                                    <span className="text-[10px] text-red-400 bg-red-900/40 px-2 py-1 rounded border border-red-800 flex items-center gap-1">
                                        <Activity size={10} /> Endpoint 3/3 • Rua + CEP + Cidade + Estado
                                    </span>
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