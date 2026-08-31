import { type ChangeEvent, type ReactNode, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PilotAnalysis } from '@/components/pilot-analysis';
import {
  Activity,
  ArrowDownToLine,
  BarChart3,
  Check,
  ChevronDown,
  CircleHelp,
  Database,
  LocateFixed,
  Map as MapIcon,
  Minus,
  Navigation,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Store,
  Upload,
  X,
} from 'lucide-react';

import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import dgLocations from './wv-dg-map-locations.json';
import wicLocations from './wv-wic-vendor-locations-confirmed.json';
import wvCountyMap from '@assets/image_1787709763540.png';
import opportunityMap from './MAP.png';
import wicLogo from '@assets/wic_logo__1787710051410.png';
import dohLogo from '@assets/New_Dept_of_Health_Logo_horz_RGB_1787710060679.jpg';
import wicEmbellishmentOne from '@assets/WIC_Embellishments_01_1787710072092.png';
import wicEmbellishmentTwo from '@assets/WIC_Embellishments_02_1787710074118.png';
import wicColorLogo from '@assets/WIC-Color_1787710077940.jpg';
import wicColorLogoAlt from '@assets/WIC-Color_1787710081535.jpg';

type VendorType = 'Dollar General' | 'WIC Vendor';
type Rurality = 'Rural' | 'Micropolitan' | 'Metro' | 'Unknown';
type WicStatus = 'Active' | 'Not authorized' | 'Unknown';

type Vendor = {
  id: string;
  name: string;
  type: VendorType;
  county: string;
  city: string;
  rurality: Rurality;
  wic: WicStatus;
  mapX: number;
  mapY: number;
  lat: number;
  lng: number;
  distance: string;
  note: string;

  zip?: string;
  wicRegion?: string;
  dgStoreType?: string;
  produceFresh?: string | null;
  activeWicFamilies?: number | null;
  activeWicParticipants?: number | null;
  nearestWicVendor?: string | null;
  nearestWicVendorMiles?: number | null;
  dgMilesFromCommunity?: number | null;
  potentialMilesSaved?: number | null;
  accessGap10Miles?: boolean | null;
  noOtherGroceryOption?: boolean | null;
  nearestFullServiceGroceryMiles?: number | null;
  snapAuthorized?: boolean | null;
  pilotTier?: string | null;
  priorityRank?: number | null;
  recommendedForPilot?: string | null;
  pilotPriorityScore?: number | null;
  rucaClassification?: string | null;
};

function imageMapPoint(vendor: Vendor) {
  return {
    x: 61 + ((vendor.lng + 82.6) * 511) / 4.9,
    y: 402 - ((vendor.lat - 37) * 378) / 3.7,
  };
}

function AppShell() {
  return <Dashboard />;
}

function Dashboard() {
const [mapView, setMapView] = useState<'wic' | 'dg' | 'combined'>('dg');

const combinedLocations: Vendor[] = [
  ...(wicLocations as Vendor[]),
  ...(dgLocations as Vendor[])
];

const [vendors, setVendors] = useState<Vendor[]>(
  mapView === 'wic'
    ? (wicLocations as Vendor[])
    : mapView === 'dg'
      ? (dgLocations as Vendor[])
      : combinedLocations
);

function switchMapView(view: 'wic' | 'dg' | 'combined') {
  setMapView(view);
  setVendors(
    view === 'wic'
      ? (wicLocations as Vendor[])
      : view === 'dg'
        ? (dgLocations as Vendor[])
        : combinedLocations
  );
  setSelectedId('');
  setSearch('');
setTypeFilter('All');
setRuralFilter('All');
setWicFilter('All');  
}
  const [selectedId, setSelectedId] = useState('dg-mingo');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | VendorType>('All');
  const [ruralFilter, setRuralFilter] = useState<'All' | Rurality>('All');
  const [wicFilter, setWicFilter] = useState<'All' | WicStatus>('All');

  const [activeNav, setActiveNav] = useState('Map overview');
  const [importNotice, setImportNotice] = useState('');
  const [mapZoom, setMapZoom] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  const filteredVendors = useMemo(() => vendors.filter((vendor) => {
    const matchesSearch = `${vendor.name} ${vendor.city} ${vendor.county}`.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'All' || vendor.type === typeFilter;
    const matchesRural = ruralFilter === 'All' || vendor.rurality === ruralFilter;
    const matchesWic = wicFilter === 'All' || vendor.wic === wicFilter;
    return matchesSearch && matchesType && matchesRural && matchesWic;
  }), [vendors, search, typeFilter, ruralFilter, wicFilter]);

  const selected = vendors.find((vendor) => vendor.id === selectedId) ?? filteredVendors[0] ?? vendors[0];
  const ruralCount = vendors.filter((vendor) => vendor.rurality === 'Rural').length;
  const gapCount = vendors.filter((vendor) => vendor.wic !== 'Active').length;
  const activeCount = vendors.filter((vendor) => vendor.wic === 'Active').length;

  function resetFilters() {
    setSearch('');
    setTypeFilter('All');
    setRuralFilter('All');
    setWicFilter('All');
  }

  function parseImported(raw: string, fileName: string) {
    try {
      let rows: Record<string, unknown>[] = [];
      if (fileName.toLowerCase().endsWith('.json')) {
        const parsed = JSON.parse(raw);
        rows = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.vendors) ? parsed.vendors : []);
      } else {
        const lines = raw.trim().split(/\r?\n/);
        const headers = lines[0].split(',').map((header) => header.trim().toLowerCase().replace(/\s+/g, '_'));
        rows = lines.slice(1).filter(Boolean).map((line) => {
          const values = line.split(',').map((value) => value.trim().replace(/^"|"$/g, ''));
          return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
        });
      }
      const imported = rows.map((row, index): Vendor => ({
        id: String(row.id || `imported-${index + 1}`),
        name: String(row.name || row.vendor_name || 'Imported vendor'),
        type: (['Dollar General', 'Grocery', 'Pharmacy', 'Farmers market'].includes(String(row.type)) ? String(row.type) : 'Grocery') as VendorType,
        county: String(row.county || 'Unassigned'),
        city: String(row.city || row.town || 'Unknown'),
        rurality: (['Rural', 'Micropolitan', 'Metro'].includes(String(row.rurality)) ? String(row.rurality) : 'Rural') as Rurality,
        wic: (['Active', 'Not authorized', 'Unknown'].includes(String(row.wic || row.wic_status)) ? String(row.wic || row.wic_status) : 'Unknown') as WicStatus,
        mapX: Number(row.mapx || row.map_x || 300 + (index * 31) % 200),
        mapY: Number(row.mapy || row.map_y || 120 + (index * 27) % 200),
        lat: Number(row.lat || 38.5),
        lng: Number(row.lng || -80.5),
        distance: String(row.distance || 'Not calculated'),
        note: String(row.note || 'Imported record; validate attributes before analysis.'),
      }));
      if (!imported.length) throw new Error('No vendor rows found');
      setVendors(imported);
      setSelectedId(imported[0].id);
      setImportNotice(`${imported.length} records loaded from ${fileName}`);
      window.setTimeout(() => setImportNotice(''), 4000);
    } catch {
      setImportNotice('Could not read this file. Use a CSV with headers or a JSON array.');
      window.setTimeout(() => setImportNotice(''), 5000);
    }
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => parseImported(String(reader.result), file.name);
    reader.readAsText(file);
    event.target.value = '';
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="flex min-h-[100dvh]">
       
       
        <main className="min-w-0 flex-1">
          <header className="flex min-h-[84px] items-center justify-between border-b border-border bg-card/90 px-4 py-4 backdrop-blur md:px-8">
            <div className="flex items-center gap-3">
              
              <div>
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">
  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
  West Virginia WIC
</div>

<h1 className="mt-1 font-serif text-[22px] font-bold tracking-tight md:text-[25px]">
  Dollar General Partnership Dashboard
</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <img src={dohLogo} alt="West Virginia Department of Health" className="mr-2 hidden h-8 w-auto max-w-[170px] object-contain xl:block" />
              <input ref={fileInputRef} type="file" accept=".csv,.json,application/json,text/csv" onChange={handleFile} className="hidden" data-testid="input-import-file" />
              <button type="button" data-testid="button-import-vendors" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 rounded-sm border border-border bg-background px-3 py-2 text-[12px] font-semibold text-foreground transition-colors hover:border-primary hover:bg-muted"><Upload size={15} /> <span className="hidden sm:inline">Import list</span></button>
              <button type="button" data-testid="button-export-vendors" onClick={() => { const blob = new Blob([JSON.stringify(vendors, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'wv-vendor-map.json'; anchor.click(); URL.revokeObjectURL(url); }} className="flex items-center gap-2 rounded-sm bg-primary px-3 py-2 text-[12px] font-semibold text-primary-foreground transition-transform hover:-translate-y-px"><ArrowDownToLine size={15} /> <span className="hidden sm:inline">Export view</span></button>
            </div>
                    </header>

          <nav className="border-b border-border bg-card px-4 md:px-8">
            <div className="mx-auto flex max-w-[1600px] items-center gap-1 overflow-x-auto py-2">

              <button
                type="button"
                onClick={() =>
                  document.getElementById('partnership-overview')?.scrollIntoView({
                    behavior: 'smooth',
                  })
                }
                className="whitespace-nowrap rounded-sm px-4 py-2 text-[12px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Partnership Overview
              </button>

              <button
                type="button"
                onClick={() => setLocation('/pilot-analysis')}
                className="whitespace-nowrap rounded-sm px-4 py-2 text-[12px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Pilot Opportunities
              </button>

              <button
                type="button"
                onClick={() => {
                  switchMapView('combined');
                  document.getElementById('access-gaps')?.scrollIntoView({
                    behavior: 'smooth',
                  });
                }}
                className="whitespace-nowrap rounded-sm px-4 py-2 text-[12px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Access Gaps
              </button>

              <button
                type="button"
                onClick={() =>
                  document.getElementById('location-index')?.scrollIntoView({
                    behavior: 'smooth',
                  })
                }
                className="whitespace-nowrap rounded-sm px-4 py-2 text-[12px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Location Data
              </button>

            </div>
          </nav>

          <div className="mx-auto max-w-[1600px] space-y-5 p-4 md:p-7">
            {importNotice && <div role="status" data-testid="status-import-notice" className="animate-rise flex items-center justify-between border border-accent/50 bg-accent/15 px-4 py-3 text-[12px] font-semibold text-foreground"><span className="flex items-center gap-2"><Check size={15} className="text-[#6f7f31]" /> {importNotice}</span><button type="button" aria-label="Dismiss import notice" data-testid="button-dismiss-import-notice" onClick={() => setImportNotice('')}><X size={15} /></button></div>}
<div className="mb-6 border-l-4 border-[#f4c430] bg-card px-6 py-5 shadow-sm">
  <p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">
    The Opportunity
  </p>

  <h2 className="mt-2 max-w-4xl font-serif text-2xl font-bold leading-tight md:text-3xl">
    Dollar General is already positioned to close critical WIC retail access gaps across West Virginia.
  </h2>

  <p className="mt-3 max-w-4xl text-[13px] leading-relaxed text-muted-foreground">
    WV WIC identified communities where Dollar General's existing footprint
    overlaps with WIC families, limited retailer choice, and significant travel
    to currently authorized WIC retailers.
  </p>
</div>
      <section
  id="partnership-overview"
  className="grid scroll-mt-32 gap-3 sm:grid-cols-2 xl:grid-cols-4"
>
  <Metric  
  label="DG Locations Analyzed"
  value="318"
  detail="Dollar General locations across West Virginia"
  icon={<Store size={16} />}
  accent="yellow"
/>

<Metric
  label="DG Stores in ZIPs Without WIC"
  value="118"
  detail="Located in 110 ZIP codes without a current WIC vendor"
  icon={<Navigation size={16} />}
  accent="teal"
/>

<Metric
  label="DG Stores in 10+ Mile WIC Gaps"
  value="32"
  detail="Existing DG locations in identified WIC retail access-gap communities"
  icon={<Activity size={16} />}
  accent="coral"
/>

<Metric
  label="WIC Participants in Gap Communities"
  value="2,451"
  detail="1,570 active WIC families live in these communities"
  icon={<Check size={16} />}
  accent="green"
/>
            </section>
            
<div className="grid gap-4 border border-border bg-primary px-6 py-5 text-primary-foreground shadow-sm md:grid-cols-[220px_1fr] md:items-center">
  <div>
    <p className="font-serif text-[38px] font-bold leading-none">
      12.6 miles
    </p>
    <p className="mt-2 font-mono text-[9px] uppercase tracking-[.14em] text-primary-foreground/70">
      Average Potential Travel Reduction
    </p>
  </div>

  <div className="border-t border-primary-foreground/20 pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
    <p className="font-serif text-[18px] font-bold leading-snug">
      Bringing WIC purchasing closer to where families already live and shop.
    </p>

    <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-primary-foreground/70">
      Across the 32 identified 10+ mile WIC access-gap communities, a nearby
      Dollar General could reduce the average distance between the target
      community and WIC retail access by approximately 12.6 miles.
    </p>
  </div>
</div>
           <section
  id="access-gaps"
  className="grid scroll-mt-32 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,.75fr)]"
>
              <div className="min-w-0 overflow-hidden border border-border bg-card shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5 md:px-5">
                  <div>
                  <h2 className="font-serif text-[17px] font-bold">
  West Virginia Retail Access
</h2>
<p className="mt-0.5 text-[11px] text-muted-foreground">
  Explore Dollar General locations alongside the current WIC retail network
</p>  
                  </div>
                 <div className="flex items-center gap-1 rounded-sm border border-border bg-muted/50 p-1">
  <button
    type="button"
    onClick={() => switchMapView('wic')}
    className={`rounded-sm px-3 py-1.5 text-[10px] font-semibold transition-colors ${
      mapView === 'wic'
        ? 'bg-card text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground'
    }`}
  >
    WIC Vendors
  </button>

  <button
    type="button"
    onClick={() => switchMapView('dg')}
    className={`rounded-sm px-3 py-1.5 text-[10px] font-semibold transition-colors ${
      mapView === 'dg'
        ? 'bg-card text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground'
    }`}
  >
    Dollar General
  </button>
   <button
  type="button"
  onClick={() => switchMapView('combined')}
  className={`rounded-sm px-3 py-1.5 text-[10px] font-semibold transition-colors ${
    mapView === 'combined'
      ? 'bg-card text-foreground shadow-sm'
      : 'text-muted-foreground hover:text-foreground'
  }`}
>
  Opportunity Overlay
</button>                
</div>
                </div>
                   <div className="relative h-[390px] overflow-hidden bg-[#f8f8f4] sm:h-[470px]">
                  <div className="absolute left-4 top-4 z-10 rounded-sm border border-border/70 bg-card/90 px-3 py-2 backdrop-blur">
                    <p className="font-mono text-[9px] uppercase tracking-[.13em] text-muted-foreground">West Virginia</p>
                    <p className="mt-1 font-serif text-[18px] font-bold tracking-tight">The Mountain State</p>
                  </div>
                  <div className="absolute right-4 top-4 z-10 flex flex-col divide-y divide-border overflow-hidden rounded-sm border border-border bg-card/90 shadow-sm">
                    <button type="button" aria-label="Zoom in" data-testid="button-map-zoom-in" onClick={() => setMapZoom((zoom) => Math.min(1.6, zoom + .15))} className="p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground"><Plus size={16} /></button>
                    <button type="button" aria-label="Zoom out" data-testid="button-map-zoom-out" onClick={() => setMapZoom((zoom) => Math.max(.75, zoom - .15))} className="p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground"><Minus size={16} /></button>
                    <button type="button" aria-label="Reset map zoom" data-testid="button-map-reset" onClick={() => setMapZoom(1)} className="p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground"><LocateFixed size={16} /></button>
                  </div>
                  <div className="absolute bottom-4 left-4 z-10 flex flex-wrap gap-x-3 gap-y-1.5 rounded-sm border border-border/70 bg-card/90 px-3 py-2 font-mono text-[9px] uppercase tracking-[.08em] backdrop-blur">
{mapView === 'wic' && (
  <LegendDot color="#2c615d" label="Current WIC Vendor" />
)}

{mapView === 'dg' && (
  <LegendDot color="#e0ad2d" label="Dollar General" />
)}

{mapView === 'combined' && (
  <>
    <LegendDot color="#2c615d" label="Current WIC Vendor" />
    <LegendDot color="#e0ad2d" label="Dollar General" />
    <LegendDot color="#d96b52" label="10+ Mile WIC Access Gap" />
  </>
)}
                  </div>
                   <svg viewBox="0 0 620 410" className="h-full w-full transition-transform duration-500" style={{ transform: `scale(${mapZoom})` }} role="img" aria-label="West Virginia county map with vendor locations">
                   <image
  href={mapView === 'combined' ? opportunityMap : wvCountyMap}
  x="37"
  y="0"
  width="546"
  height="410"
  preserveAspectRatio="none"
/> 
                {filteredVendors.map((vendor) => {
  const active = selected?.id === vendor.id;
  const color = vendor.type === 'Dollar General' ? '#d8a629' : '#2c615d';

  const isAccessGap =
    mapView === 'combined' &&
    vendor.type === 'Dollar General' &&
    vendor.accessGap10Miles === true;

  const basePoint = imageMapPoint(vendor);   

const point =
  mapView === 'combined'
    ? {
        x: 91 + ((vendor.lng + 82.64) * 460) / 4.92,
        y: 409 - ((vendor.lat - 37.20) * 398) / 3.44
      }
    : basePoint;      
                       return <g key={vendor.id} className="vendor-pin" onClick={() => setSelectedId(vendor.id)} data-testid={`map-pin-${vendor.id}`} role="button" aria-label={`Select ${vendor.name}`} tabIndex={0}>
<circle
  cx={point.x}
  cy={point.y}
  r="12"
  fill="transparent"
  pointerEvents="all"
/>
                         {isAccessGap && (
  <circle
    cx={point.x}
    cy={point.y}
    r="9"
    fill="none"
    stroke="#d96b52"
    strokeWidth="2.5"
    opacity=".95"
    pointerEvents="none"
  />
)}
                      {active && (
  <circle
    cx={point.x}
    cy={point.y}
    r="15"
    fill="none"
    stroke="#111827"
    strokeWidth="3"
    opacity=".9"
    className="focus-ring"
    pointerEvents="none"
  />
)}
                         <circle cx={point.x} cy={point.y} r={active ? 7 : 5.5} fill={color} stroke="#f7f2e6" strokeWidth="2" />
                         {active && <circle cx={point.x} cy={point.y} r="2" fill="#f7f2e6" />}
                      </g>;
                    })}
                  </svg>
                </div>
                <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5 font-mono text-[9px] uppercase tracking-[.1em] text-muted-foreground md:px-5">
                  <span>{filteredVendors.length} visible locations</span>
<span>
  {mapView === 'wic'
    ? 'Current WIC Vendors'
    : mapView === 'dg'
      ? 'Dollar General Locations'
      : 'WIC + Dollar General Opportunity Overlay'}
</span>
                </div>
              </div>

              <SelectedPanel vendor={selected} onClear={() => setSelectedId('')} />
            </section>

           <section className="border border-border bg-card px-5 py-5 shadow-sm">
  <div>
    <p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">
      Why Dollar General?
    </p>

    <h2 className="mt-2 font-serif text-[22px] font-bold">
      An existing retail footprint positioned where WIC access is limited
    </h2>
  </div>
         <div className="mt-5 border-l-4 border-accent bg-muted/30 px-5 py-4">
    <p className="font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">
      Existing Footprint
    </p>

    <p className="mt-2 font-serif text-[24px] font-bold">
      318 locations
    </p>

    <p className="mt-2 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
      Dollar General locations analyzed across West Virginia, providing an
      existing retail network that could support targeted expansion of WIC
      purchasing access.
    </p>
  </div>  
     <div className="mt-3 border-l-4 border-primary bg-muted/30 px-5 py-4">
    <p className="font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">
      Existing Nutrition-Assistance Infrastructure
    </p>

    <p className="mt-2 font-serif text-[24px] font-bold">
      96% SNAP authorized
    </p>

    <p className="mt-2 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
      Nearly all Dollar General locations analyzed are identified as SNAP
      authorized, demonstrating an existing foundation for serving households
      participating in federal nutrition-assistance programs.
    </p>
  </div> 
       <div className="mt-3 border-l-4 border-[#d96b52] bg-muted/30 px-5 py-4">
    <p className="font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">
      Existing Community Reach
    </p>

    <p className="mt-2 font-serif text-[24px] font-bold">
      118 stores in ZIPs without WIC
    </p>

    <p className="mt-2 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
      Dollar General already operates in 110 ZIP codes without a current WIC
      vendor, including 32 identified communities with 10+ mile WIC retail
      access gaps.
    </p>
  </div>        
</section>

            <section id="location-index" className="border border-border bg-card">
              <div className="flex flex-col gap-4 border-b border-border p-4 md:flex-row md:items-center md:justify-between md:px-5">
                <div><h2 className="font-serif text-[18px] font-bold">Location index</h2><p className="mt-1 text-[11px] text-muted-foreground">Select a row to inspect the field context.</p></div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative"><Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search county or city" data-testid="input-search-vendors" className="h-8 w-full rounded-sm border border-input bg-background pl-8 pr-3 text-[11px] outline-none transition-colors placeholder:text-muted-foreground focus:border-primary sm:w-[180px]" /></div>
<FilterSelect
  label="Type"
  value={typeFilter}
  options={['All', 'Dollar General', 'WIC Vendor'] as const}
  onChange={(value) => setTypeFilter(value as typeof typeFilter)}
  testId="select-vendor-type"
/>
                  <FilterSelect label="Rurality" value={ruralFilter} options={['All', 'Rural', 'Micropolitan', 'Metro'] as const} onChange={(value) => setRuralFilter(value as typeof ruralFilter)} testId="select-rurality" />
                  <FilterSelect label="WIC" value={wicFilter} options={['All', 'Active', 'Not authorized', 'Unknown'] as const} onChange={(value) => setWicFilter(value as typeof wicFilter)} testId="select-wic-status" />
                 {(search || typeFilter !== 'All' || ruralFilter !== 'All' || wicFilter !== 'All') && (
  <button
    type="button"
    data-testid="button-reset-filters"
    onClick={resetFilters}
    className="flex h-8 items-center gap-1.5 px-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
  >
    <RotateCcw size={13} /> Reset
  </button>
)}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead className="bg-muted/45 font-mono text-[9px] uppercase tracking-[.13em] text-muted-foreground"><tr><th className="px-5 py-3 font-normal">Location</th><th className="px-3 py-3 font-normal">Type</th><th className="px-3 py-3 font-normal">Rurality</th><th className="px-3 py-3 font-normal">WIC status</th><th className="px-5 py-3 text-right font-normal">Nearest route</th></tr></thead>
                  <tbody className="divide-y divide-border/80">
                    {filteredVendors.map((vendor, index) => <tr key={vendor.id} data-testid={`row-vendor-${vendor.id}`} onClick={() => setSelectedId(vendor.id)} className={`cursor-pointer text-[12px] transition-colors hover:bg-muted/50 ${vendor.id === selected?.id ? 'bg-accent/10' : ''}`}><td className="px-5 py-3.5"><div className="flex items-center gap-3"><span className="font-mono text-[10px] text-muted-foreground/60">{String(index + 1).padStart(2, '0')}</span><div><p className="font-semibold">{vendor.city}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{vendor.county} County</p></div></div></td><td className="px-3 py-3.5"><TypePill type={vendor.type} /></td><td className="px-3 py-3.5 text-muted-foreground">{vendor.rurality}</td><td className="px-3 py-3.5"><WicPill status={vendor.wic} /></td><td className="px-5 py-3.5 text-right font-mono text-[10px] text-muted-foreground">{vendor.distance}</td></tr>)}
                    {!filteredVendors.length && <tr><td colSpan={5} className="px-5 py-12 text-center"><SlidersHorizontal className="mx-auto text-muted-foreground/50" size={23} /><p className="mt-3 text-[13px] font-semibold">No locations match this view</p><p className="mt-1 text-[11px] text-muted-foreground">Try widening the filters or reset the working set.</p><button type="button" data-testid="button-empty-reset" onClick={resetFilters} className="mt-4 text-[11px] font-bold text-primary underline underline-offset-4">Reset filters</button></td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
            <footer className="mt-8 border-t border-border bg-card px-5 py-6">
  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

    <div className="flex items-center gap-4">
      <img
        src={dohLogo}
        alt="West Virginia Department of Health"
        className="h-9 w-auto max-w-[190px] object-contain"
      />

      <div className="h-8 w-px bg-border" />

      <img
        src={wicLogo}
        alt="West Virginia WIC"
        className="h-10 w-auto object-contain"
      />
    </div>
    <div className="max-w-xl md:text-right">
      <p className="font-serif text-[14px] font-bold text-foreground">
        West Virginia Department of Health · Office of Nutrition Services
      </p>

      <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
        West Virginia WIC retail access analysis supporting exploration of a
        potential Dollar General partnership and targeted pilot.
      </p>

      <p className="mt-2 font-mono text-[9px] uppercase tracking-[.1em] text-muted-foreground">
        WV WIC · Dollar General Partnership Dashboard
      </p>
    </div>
  </div>
</footer>
          </div>
        </main>
      </div>
    </div>
  );
}

function Metric({ label, value, detail, icon, accent }: { label: string; value: string; detail: string; icon: ReactNode; accent: string }) {
  const colorMap: Record<string, string> = { yellow: 'bg-accent text-accent-foreground', teal: 'bg-primary text-primary-foreground', coral: 'bg-[#df7660] text-[#fff7ed]', green: 'bg-[#84943f] text-[#fff7ed]' };
  return <div className="animate-rise border border-border bg-card p-4 shadow-sm"><div className="flex items-start justify-between"><p className="font-mono text-[9px] uppercase tracking-[.15em] text-muted-foreground">{label}</p><span className={`flex h-7 w-7 items-center justify-center rounded-sm ${colorMap[accent]}`}>{icon}</span></div><p className="mt-4 font-serif text-[29px] font-bold leading-none tracking-tight">{value}</p><p className="mt-2 text-[11px] text-muted-foreground">{detail}</p></div>;
}

function SelectedPanel({
  vendor,
  onClear,
}: {
  vendor?: Vendor;
  onClear: () => void;
}) {
  if (!vendor) {
    return (
      <div className="flex min-h-[390px] items-center justify-center border border-border bg-card p-6 text-center">
        <div>
          <Store size={26} className="mx-auto text-muted-foreground/50" />
          <p className="mt-3 font-serif text-lg font-bold">
            Select a location
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Click a Dollar General location on the map to view access and pilot opportunity details.
          </p>
        </div>
      </div>
    );
  }

  const isDollarGeneral = vendor.type === 'Dollar General';

  return (
    <div className="animate-rise border border-border bg-card shadow-sm">
      <div className="flex items-start justify-between border-b border-border bg-primary px-5 py-5 text-primary-foreground">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[.16em] text-primary-foreground/60">
            {isDollarGeneral ? 'DG opportunity profile' : 'WIC vendor profile'}
          </p>

          <h2 className="mt-2 font-serif text-[22px] font-bold leading-tight">
            {vendor.city}
          </h2>

          <p className="mt-1 text-[12px] text-primary-foreground/70">
            {vendor.county} County, West Virginia
          </p>
        </div>

        <button
          type="button"
          aria-label="Clear selected location"
          onClick={onClear}
          className="rounded-sm p-1 text-primary-foreground/60 hover:bg-primary-foreground/10 hover:text-primary-foreground"
        >
          <X size={17} />
        </button>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold">{vendor.name}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {vendor.note}
              </p>
            </div>

            <TypePill type={vendor.type} />
          </div>
        </div>

        {isDollarGeneral ? (
          <>
           {vendor.accessGap10Miles === true && (
      <div className="border-l-4 border-[#d96b52] bg-[#d96b52]/10 px-4 py-3">
        <p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#b44f3b]">
          WIC Access Opportunity
        </p>

        <p className="mt-1.5 font-serif text-[16px] font-bold leading-snug">
          This Dollar General is positioned in a 10+ mile WIC retail access-gap community.
        </p>

        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
          Existing store infrastructure could provide a closer WIC shopping option
          for families in this community.
        </p>
      </div>
    )} 
            <div className="grid grid-cols-2 gap-2">
              <ProfileStat
                label="Active WIC families"
                value={
                  vendor.activeWicFamilies != null
                    ? vendor.activeWicFamilies.toLocaleString()
                    : '—'
                }
              />

              <ProfileStat
                label="WIC participants"
                value={
                  vendor.activeWicParticipants != null
                    ? vendor.activeWicParticipants.toLocaleString()
                    : '—'
                }
              />

              <ProfileStat
                label="Nearest WIC vendor"
                value={
                  vendor.nearestWicVendorMiles != null
                    ? `${vendor.nearestWicVendorMiles.toFixed(1)} mi`
                    : '—'
                }
              />

              <ProfileStat
                label="Potential miles saved"
                value={
                  vendor.potentialMilesSaved != null
                    ? `${vendor.potentialMilesSaved.toFixed(1)} mi`
                    : '—'
                }
              />
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <ProfileRow
                label="Pilot tier"
                value={vendor.pilotTier || 'Not assigned'}
              />
<ProfileRow
  label="Recommended for pilot"
  value={vendor.recommendedForPilot || 'Not assessed'}
/>

<ProfileRow
  label="Pilot priority score"
  value={
    vendor.pilotPriorityScore != null
      ? vendor.pilotPriorityScore.toFixed(1)
      : '—'
  }
/>
              <ProfileRow
                label="Priority rank"
                value={
                  vendor.priorityRank != null
                    ? `#${vendor.priorityRank}`
                    : '—'
                }
              />

              <ProfileRow
                label="10+ mile access gap"
                value={
                  vendor.accessGap10Miles == null
                    ? 'Unknown'
                    : vendor.accessGap10Miles
                      ? 'Yes'
                      : 'No'
                }
              />

              <ProfileRow
                label="No other grocery option"
                value={
                  vendor.noOtherGroceryOption == null
                    ? 'Unknown'
                    : vendor.noOtherGroceryOption
                      ? 'Yes'
                      : 'No'
                }
              />

              <ProfileRow
                label="SNAP authorized"
                value={
                  vendor.snapAuthorized == null
                    ? 'Unknown'
                    : vendor.snapAuthorized
                      ? 'Yes'
                      : 'No'
                }
              />

              <ProfileRow
                label="Community classification"
                value={vendor.rucaClassification || vendor.rurality}
              />
            </div>

            {vendor.nearestWicVendor && (
              <div className="border-l-2 border-accent bg-accent/10 px-3 py-3">
                <p className="font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground">
                  Nearest current WIC retailer
                </p>

                <p className="mt-2 text-[12px] font-semibold leading-relaxed">
                  {vendor.nearestWicVendor}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <InfoCell label="Rurality" value={vendor.rurality} />
            <InfoCell label="WIC status" value={vendor.wic} />
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-sm border border-border bg-muted/35 px-3 py-3">
      <p className="font-serif text-[19px] font-bold leading-none">
        {value}
      </p>

      <p className="mt-2 font-mono text-[8px] uppercase tracking-[.1em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function ProfileRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

function InfoCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) { return <div className="rounded-sm border border-border bg-muted/35 px-3 py-2.5"><p className="font-mono text-[9px] uppercase tracking-[.1em] text-muted-foreground">{label}</p><p className={`mt-1.5 text-[12px] font-semibold ${accent ? 'text-[#b95d4c]' : ''}`}>{value}</p></div>; }
function StoryStat({ value, label, detail }: { value: string; label: string; detail: string }) { return <div><p className="font-serif text-[24px] font-bold">{value}</p><p className="mt-1 text-[11px] font-semibold">{label}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{detail}</p></div>; }
function LegendDot({ color, label }: { color: string; label: string }) { return <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />{label}</span>; }
function TypePill({ type }: { type: VendorType }) {
  const color =
    type === 'Dollar General'
      ? 'bg-accent/30 text-[#765d18]'
      : 'bg-primary/10 text-primary';

  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${color}`}>
      {type}
    </span>
  );
}
function WicPill({ status }: { status: WicStatus }) { const color = status === 'Active' ? 'bg-[#84943f]/15 text-[#617129]' : status === 'Not authorized' ? 'bg-[#df7660]/15 text-[#a85142]' : 'bg-muted text-muted-foreground'; return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${color}`}>{status}</span>; }
function FilterSelect({ label, value, options, onChange, testId }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void; testId: string }) { return <label className="relative flex h-8 items-center gap-1.5 rounded-sm border border-input bg-background px-2 text-[10px] font-semibold"><span className="text-muted-foreground">{label}</span><select value={value} data-testid={testId} onChange={(event) => onChange(event.target.value)} className="max-w-[100px] appearance-none bg-transparent pr-3 text-[10px] font-semibold outline-none"><>{options.map((option) => <option value={option} key={option}>{option}</option>)}</></select><ChevronDown size={11} className="pointer-events-none absolute right-1 text-muted-foreground" /></label>; }

function Router() {
  return <ErrorBoundary resetKey={useLocation()[0]}><Switch><Route path="/" component={AppShell} /><Route path="/pilot-analysis" component={PilotAnalysis} /><Route component={() => <div className="p-12 font-serif text-xl">Page not found</div>} /></Switch></ErrorBoundary>;
}

const queryClient = new QueryClient();
function App() { return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>; }
export default App;
