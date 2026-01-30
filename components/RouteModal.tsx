import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, Navigation, Car, Clock, MapPin, AlertCircle, CheckCircle2, AlertTriangle, Search, Activity } from 'lucide-react';
import { Member } from '../types';
import { CHURCH_ADDRESS } from '../constants';

// --- Helper Functions for API ---
// Using Nominatim (OpenStreetMap) for Geocoding
const getCoordinates = async (address: string) => {
  try {
    // Adicionando um timestamp para evitar cache agressivo e user-agent customizado
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, {
        headers: {
            "User-Agent": "MembersAI-ADEPA/1.0"
        }
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

// Using OSRM for Routing (Driving)
const getRouteData = async (start: {lat: number, lon: number}, end: {lat: number, lon: number}) => {
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.code === 'Ok') {
            return {
                distance: data.routes[0].distance, // meters
                duration: data.routes[0].duration, // seconds
                geometry: data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]) // Convert to Leaflet [lat, lon]
            };
        }
        return null;
    } catch (error) {
        console.error("Routing error", error);
        return null;
    }
};

// --- Custom Components ---

// Component to fit map bounds
const MapFitter = ({ coords }: { coords: [number, number][] }) => {
    const map = useMap();
    useEffect(() => {
        if (coords.length > 0) {
            const bounds = L.latLngBounds(coords);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [coords, map]);
    return null;
};

// Icons (CSS based divIcon to avoid asset issues)
const createIcon = (label: string, color: string) => {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 100px; padding: 4px; border-radius: 4px; border: 2px solid white; text-align: center; color: white; font-weight: bold; font-size: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); position: relative; top: -15px; left: -50px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${label}</div><div style="width: 12px; height: 12px; background-color: ${color}; transform: rotate(45deg); border: 2px solid white; position: absolute; bottom: -4px; left: -6px; z-index: -1;"></div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
    });
};

interface RouteModalProps {
  member: Member;
  onClose: () => void;
}

export const RouteModal: React.FC<RouteModalProps> = ({ member, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [methodUsed, setMethodUsed] = useState<'plan1' | 'plan2' | 'plan3' | null>(null);
  
  const [routeInfo, setRouteInfo] = useState<{
      distanceKm: number;
      durationMin: number;
      path: [number, number][];
      startCoords: [number, number] | null;
      endCoords: [number, number] | null;
  }>({ distanceKm: 0, durationMin: 0, path: [], startCoords: null, endCoords: null });

  // Preços
  const [price, setPrice] = useState<{ avg: number, min: number, max: number }>({ avg: 0, min: 0, max: 0 });

  useEffect(() => {
    const calculateRoute = async () => {
      setLoading(true);
      setError('');
      setMethodUsed(null);

      try {
        // --- ETAPA 0: LOCALIZAR A IGREJA (Prioridade: CEP) ---
        let churchCoords = null;
        
        // Tenta CEP da Igreja primeiro (conforme pedido: "A busca imediata é do ponto da igreja (CEP)")
        if (CHURCH_ADDRESS.cep) {
             churchCoords = await getCoordinates(`${CHURCH_ADDRESS.cep}, Brasil`);
        }
        
        // Fallback para endereço completo se o CEP falhar
        if (!churchCoords) {
            console.log("CEP da igreja falhou, usando endereço completo...");
            churchCoords = await getCoordinates(CHURCH_ADDRESS.fullAddress);
        }

        if (!churchCoords) {
            setError("Erro crítico: Não foi possível localizar a Igreja (nem por CEP, nem por Endereço).");
            setLoading(false);
            return;
        }
        
        // --- ETAPA 1, 2 e 3: LOCALIZAR O MEMBRO (LÓGICA FAILOVER) ---
        let memberCoords = null;
        let successPlan: 'plan1' | 'plan2' | 'plan3' | null = null;

        const street = member.street ? member.street.trim() : '';
        const neighborhood = member.neighborhood ? member.neighborhood.trim() : '';
        const city = member.city ? member.city.trim() : CHURCH_ADDRESS.city;
        const state = CHURCH_ADDRESS.state || 'Rio de Janeiro';
        const zip = member.zipCode ? member.zipCode.trim() : '';

        // --- PLANO A: Endpoint 1 de 3 (RUA + BAIRRO) ---
        // Prioridade máxima
        if (!memberCoords && street && neighborhood) {
            console.log("Tentando PLANO A: Rua + Bairro");
            const query1 = `${street}, ${neighborhood}, ${city}, ${state}, Brasil`;
            memberCoords = await getCoordinates(query1);
            if (memberCoords) successPlan = 'plan1';
        }

        // --- PLANO B: Endpoint 2 de 3 (CEP) ---
        // Se Plano A falhou ou não tinha dados suficientes
        if (!memberCoords && zip) {
            console.log("Tentando PLANO B: Apenas CEP");
            const query2 = `${zip}, Brasil`;
            memberCoords = await getCoordinates(query2);
            if (memberCoords) successPlan = 'plan2';
        }

        // --- PLANO C: Endpoint 3 de 3 (HÍBRIDO: RUA + CEP) ---
        // Último recurso se A e B falharam
        if (!memberCoords && street && zip) {
             console.log("Tentando PLANO C: Rua + CEP + Cidade + Estado");
             const query3 = `${street}, ${city}, ${state}, ${zip}, Brasil`;
             memberCoords = await getCoordinates(query3);
             if (memberCoords) successPlan = 'plan3';
        }

        // --- VERIFICAÇÃO FINAL ---
        if (!memberCoords) {
            setError('Falha nos 3 endpoints de busca. Verifique se o CEP ou o nome da rua estão corretos.');
            setLoading(false);
            return;
        }

        setMethodUsed(successPlan);

        // --- ETAPA 4: TRAÇAR ROTA (OSRM) ---
        const route = await getRouteData(churchCoords, memberCoords);
        
        if (!route) {
            setError('Locais encontrados, mas não foi possível traçar rota de carro entre eles.');
            setLoading(false);
            return;
        }

        // --- ETAPA 5: CÁLCULOS FINAIS ---
        const distKm = route.distance / 1000;
        const durMin = Math.round(route.duration / 60);

        // Price Math: 1km = R$6.00 base.
        const baseRate = 6.0;
        const rawAvg = distKm * baseRate;
        const rawMin = distKm * 5.0; 
        const rawMax = distKm * 8.0;

        const finalMin = Math.max(6, rawMin);
        const finalMax = Math.max(8, rawMax);
        const finalAvg = Math.max(7, rawAvg);

        setPrice({
            avg: Math.round(finalAvg),
            min: Math.floor(finalMin),
            max: Math.ceil(finalMax)
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
        setError("Erro interno de conexão com o serviço de mapas.");
        setLoading(false);
      }
    };

    calculateRoute();
  }, [member]);

  const firstName = member.fullName.split(' ')[0];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
       <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col h-[90vh] overflow-hidden">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-royal-900/30 rounded-full">
                    <Navigation className="text-royal-500" size={20}/>
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white text-base mr-2">Trajeto de Visita</h3>
                        
                        {/* PLANO A: Verde */}
                        {!loading && !error && methodUsed === 'plan1' && (
                            <span className="text-[10px] bg-emerald-900/30 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded flex items-center gap-1 font-medium animate-in fade-in zoom-in duration-300">
                                <CheckCircle2 size={10} /> Endpoint 1/3 • Alta Precisão (Rua + Bairro)
                            </span>
                        )}
                        
                        {/* PLANO B: Laranja */}
                        {!loading && !error && methodUsed === 'plan2' && (
                            <span className="text-[10px] bg-orange-900/30 text-orange-400 border border-orange-900 px-2 py-0.5 rounded flex items-center gap-1 font-medium animate-in fade-in zoom-in duration-300">
                                <Activity size={10} /> Endpoint 2/3 • Aproximação (Via CEP)
                            </span>
                        )}
                        
                        {/* PLANO C: Vermelho */}
                        {!loading && !error && methodUsed === 'plan3' && (
                            <span className="text-[10px] bg-red-900/30 text-red-400 border border-red-900 px-2 py-0.5 rounded flex items-center gap-1 font-medium animate-in fade-in zoom-in duration-300">
                                <AlertTriangle size={10} /> Endpoint 3/3 • Varredura Híbrida
                            </span>
                        )}
                    </div>
                    
                    <p className="text-xs text-slate-400 mt-1">
                        Destino: <span className="text-slate-200">{member.street || 'Rua não inf.'}, nº{member.number || 'S/N'}</span> - {member.neighborhood || 'Bairro não inf.'} | {member.city || 'Cidade não inf.'}
                    </p>
                </div>
             </div>
             <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                <X size={24} />
             </button>
          </div>

          <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
             
             {/* Left Panel: Stats */}
             <div className="w-full md:w-80 bg-slate-950 p-6 flex flex-col gap-6 border-r border-slate-800 overflow-y-auto z-20">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
                        <div className="relative">
                            <div className="w-10 h-10 border-2 border-royal-500/30 border-t-royal-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-royal-500 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                        <p className="text-xs font-mono text-center animate-pulse text-royal-400">
                           📡 Backend trabalhando com API...
                        </p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-red-400 text-center">
                        <AlertCircle size={32} />
                        <p className="text-sm">{error}</p>
                    </div>
                ) : (
                    <>
                        {/* Preço */}
                        <div className="bg-slate-900 rounded-lg p-5 border border-slate-800 shadow-lg">
                            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Valor Estimado (Uber)</span>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-sm text-slate-400">R$</span>
                                <span className="text-4xl font-bold text-white">{price.avg},00</span>
                            </div>
                            <div className="mt-2 text-xs text-slate-500 flex justify-between border-t border-slate-800 pt-2">
                                <span>Min: R$ {price.min},00</span>
                                <span>Máx: R$ {price.max},00</span>
                            </div>
                            <p className="text-[10px] text-slate-600 mt-2 leading-tight">
                                *Baseado em tarifa de R$ 6,00/km. Sujeito a variação de demanda dinâmica.
                            </p>
                        </div>

                        {/* Detalhes */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 text-slate-200">
                                <div className="w-10 h-10 rounded bg-slate-900 flex items-center justify-center border border-slate-800">
                                    <MapPin size={20} className="text-royal-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Distância Total</p>
                                    <p className="font-semibold text-lg">{routeInfo.distanceKm} km</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-slate-200">
                                <div className="w-10 h-10 rounded bg-slate-900 flex items-center justify-center border border-slate-800">
                                    <Car size={20} className="text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Tempo de Carro</p>
                                    <p className="font-semibold text-lg">{routeInfo.durationMin} min</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-slate-200">
                                <div className="w-10 h-10 rounded bg-slate-900 flex items-center justify-center border border-slate-800">
                                    <Clock size={20} className="text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Tempo a Pé (Est.)</p>
                                    {/* @ts-ignore */}
                                    <p className="font-semibold text-lg">{routeInfo.walkingTime} min</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto pt-4">
                            <a 
                                href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(CHURCH_ADDRESS.fullAddress)}&destination=${encodeURIComponent(`${member.street}, ${member.number}, ${member.city}`)}&travelmode=driving`}
                                target="_blank"
                                rel="noreferrer"
                                className="block w-full py-3 bg-white text-slate-900 text-center font-bold rounded hover:bg-slate-200 transition-colors"
                            >
                                Abrir no Google Maps App
                            </a>
                        </div>
                    </>
                )}
             </div>

             {/* Right Panel: Map */}
             <div className="flex-1 bg-slate-800 relative z-10">
                {!loading && !error && routeInfo.startCoords && routeInfo.endCoords && (
                    <MapContainer 
                        center={routeInfo.startCoords} 
                        zoom={13} 
                        style={{ height: "100%", width: "100%", background: '#1e293b' }}
                        zoomControl={false}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        
                        {/* Rota */}
                        <Polyline 
                            positions={routeInfo.path} 
                            color="black" // Linha preta como solicitado
                            weight={5}
                            opacity={0.8}
                        />
                        <Polyline 
                            positions={routeInfo.path} 
                            color="#3b82f6" 
                            weight={2}
                            opacity={1}
                            dashArray="5, 10"
                        />

                        {/* Markers Customizados */}
                        <Marker 
                            position={routeInfo.startCoords} 
                            icon={createIcon('IGREJA', '#4169E1')}
                        />

                        <Marker 
                            position={routeInfo.endCoords}
                            icon={createIcon(firstName.toUpperCase(), '#10b981')}
                        />

                        {/* Ajustar Zoom */}
                        <MapFitter coords={[routeInfo.startCoords, routeInfo.endCoords]} />

                    </MapContainer>
                )}
             </div>

          </div>
       </div>
    </div>
  );
};