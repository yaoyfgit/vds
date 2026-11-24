import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, Loader2, X } from 'lucide-react';

export interface MapLocationValue {
  location: string;
  latitude: number;
  longitude: number;
}

interface SearchResult {
  name: string;
  lat: number;
  lon: number;
}

// 默认地图中心（南宁市）
const DEFAULT_CENTER: L.LatLngExpression = [22.817, 108.366];

const createPinIcon = () =>
  L.divIcon({
    className: '',
    html: '<svg width="30" height="42" viewBox="0 0 24 34" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 22 12 22s12-13 12-22C24 5.4 18.6 0 12 0z" fill="#4f46e5"/><circle cx="12" cy="12" r="4.5" fill="#ffffff"/></svg>',
    iconSize: [30, 42],
    iconAnchor: [15, 42]
  });

interface MapLocationPickerProps {
  value: MapLocationValue | null;
  onChange: (value: MapLocationValue | null) => void;
  /** 同一活动下已存在的地点名称，用于重复校验提示 */
  existingLocations?: string[];
  /** 自定义标题，默认"活动地点（地图选点）" */
  label?: string;
}

/**
 * 地图选点组件：搜索地址或在地图上点击选点，记录地点名称与经纬度。
 * 使用 Leaflet + OpenStreetMap（免密钥），选点返回 WGS84 经纬度。
 */
const MapLocationPicker: React.FC<MapLocationPickerProps> = ({ value, onChange, existingLocations = [], label = '活动地点（地图选点）' }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [geocoding, setGeocoding] = useState(false);
  const [duplicateHint, setDuplicateHint] = useState('');

  const emitChange = (location: string, lat: number, lng: number) => {
    const trimmed = location.trim();
    setDuplicateHint(
      trimmed && existingLocations.includes(trimmed) ? '同一活动下已存在该地点名称' : ''
    );
    onChangeRef.current({ location: trimmed, latitude: lat, longitude: lng });
  };

  // 在地图上放置/移动标记
  const placeMarker = (lat: number, lng: number) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const latlng = L.latLng(lat, lng);
    if (markerRef.current) {
      markerRef.current.setLatLng(latlng);
    } else {
      markerRef.current = L.marker(latlng, { icon: createPinIcon(), draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const p = markerRef.current!.getLatLng();
        emitChange(valueRef.current?.location || '', p.lat, p.lng);
        reverseGeocode(p.lat, p.lng);
      });
    }
  };

  const valueRef = useRef(value);
  valueRef.current = value;

  // 逆地理编码：根据经纬度带出地点名称（尽力而为，失败时保留原名称）
  const reverseGeocode = async (lat: number, lng: number) => {
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&accept-language=zh-CN&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      const name: string = data?.name || data?.display_name || valueRef.current?.location || '';
      emitChange(name, lat, lng);
    } catch {
      emitChange(valueRef.current?.location || '', lat, lng);
    } finally {
      setGeocoding(false);
    }
  };

  // 地址搜索（Nominatim）
  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&accept-language=zh-CN&limit=5&q=${encodeURIComponent(query.trim())}`
      );
      const data = await res.json();
      setSearchResults(
        (data || []).map((item: { display_name: string; lat: string; lon: string }) => ({
          name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon)
        }))
      );
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // 选择搜索结果
  const handleSelectResult = (r: SearchResult) => {
    const map = mapInstanceRef.current;
    setSearchResults([]);
    setQuery('');
    if (!map) return;
    map.flyTo([r.lat, r.lon], 16);
    placeMarker(r.lat, r.lon);
    emitChange(r.name, r.lat, r.lon);
  };

  // 初始化地图（仅一次）
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    const map = L.map(mapContainerRef.current, {
      center: value ? [value.latitude, value.longitude] : DEFAULT_CENTER,
      zoom: value ? 16 : 11,
      zoomControl: true
    });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      placeMarker(e.latlng.lat, e.latlng.lng);
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    if (value) {
      placeMarker(value.latitude, value.longitude);
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasPoint = !!value;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {label} <span className="text-red-500">*</span>
      </label>

      {/* 地址搜索 */}
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500 text-sm"
            placeholder="输入地址关键词搜索（如：南宁国际会展中心）"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-slate-600"
            title="搜索地址"
          >
            {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {searchResults.map((r, i) => (
              <div
                key={i}
                onClick={() => handleSelectResult(r)}
                className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm"
              >
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                  <span className="text-slate-700">{r.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 地图 */}
      <div className="relative border border-slate-300 rounded-lg overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-56" />
        {!hasPoint && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 px-4 py-2 rounded-lg text-sm text-slate-600 shadow-sm">
              点击地图选点，或在上方搜索地址
            </div>
          </div>
        )}
        {geocoding && (
          <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs text-slate-500 flex items-center gap-1">
            <Loader2 size={12} className="animate-spin" />
            正在解析地址
          </div>
        )}
      </div>

      {/* 地点名称与经纬度 */}
      {hasPoint && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={value!.location}
              onChange={(e) => emitChange(e.target.value, value!.latitude, value!.longitude)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500 text-sm"
              placeholder="地点名称（选点后自动带出，可修改）"
            />
            <button
              type="button"
              onClick={() => onChangeRef.current(null)}
              className="px-2 py-2 text-slate-400 hover:text-red-500"
              title="清除选点"
            >
              <X size={16} />
            </button>
          </div>
          <div className="text-xs text-slate-500 px-1">
            经纬度：<span className="font-mono">{value!.longitude.toFixed(6)}</span>
            ，<span className="font-mono">{value!.latitude.toFixed(6)}</span>
            <span className="text-slate-400">（可拖动标记微调位置）</span>
          </div>
        </div>
      )}

      {duplicateHint && <p className="text-xs text-red-500 px-1">{duplicateHint}</p>}
    </div>
  );
};

export default MapLocationPicker;
