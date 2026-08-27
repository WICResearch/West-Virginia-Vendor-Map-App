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
  Menu,
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
import wvCountyMap from '@assets/image_1787709763540.png';
import wicLogo from '@assets/wic_logo__1787710051410.png';
import dohLogo from '@assets/New_Dept_of_Health_Logo_horz_RGB_1787710060679.jpg';
import wicEmbellishmentOne from '@assets/WIC_Embellishments_01_1787710072092.png';
import wicEmbellishmentTwo from '@assets/WIC_Embellishments_02_1787710074118.png';
import wicColorLogo from '@assets/WIC-Color_1787710077940.jpg';
import wicColorLogoAlt from '@assets/WIC-Color_1787710081535.jpg';

type VendorType = 'Dollar General' | 'Grocery' | 'Pharmacy' | 'Farmers market';
type Rurality = 'Rural' | 'Micropolitan' | 'Metro';
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
};

const representativeVendors: Vendor[] = [
  { id: 'dg-mingo', name: 'Dollar General — Williamson', type: 'Dollar General', county: 'Mingo', city: 'Williamson', rurality: 'Rural', wic: 'Not authorized', mapX: 101, mapY: 305, lat: 37.674, lng: -82.278, distance: '18.4 mi', note: 'Only mapped food retailer within a 15-mile drive.' },
  { id: 'dg-mccdowell', name: 'Dollar General — Welch', type: 'Dollar General', county: 'McDowell', city: 'Welch', rurality: 'Rural', wic: 'Not authorized', mapX: 154, mapY: 272, lat: 37.432, lng: -81.584, distance: '22.1 mi', note: 'High-need service area; nearest full grocery is outside county.' },
  { id: 'dg-raleigh', name: 'Dollar General — Beckley', type: 'Dollar General', county: 'Raleigh', city: 'Beckley', rurality: 'Micropolitan', wic: 'Unknown', mapX: 213, mapY: 258, lat: 37.778, lng: -81.188, distance: '9.2 mi', note: 'Potential partner location near I-64 corridor.' },
  { id: 'dg-kanawha', name: 'Dollar General — Charleston', type: 'Dollar General', county: 'Kanawha', city: 'Charleston', rurality: 'Metro', wic: 'Not authorized', mapX: 278, mapY: 194, lat: 38.350, lng: -81.633, distance: '3.7 mi', note: 'Urban comparison site for statewide baseline.' },
  { id: 'dg-upshur', name: 'Dollar General — Buckhannon', type: 'Dollar General', county: 'Upshur', city: 'Buckhannon', rurality: 'Micropolitan', wic: 'Active', mapX: 341, mapY: 166, lat: 39.00, lng: -80.232, distance: '6.1 mi', note: 'Active WIC vendor in a small-city trade area.' },
  { id: 'dg-monongalia', name: 'Dollar General — Morgantown', type: 'Dollar General', county: 'Monongalia', city: 'Morgantown', rurality: 'Metro', wic: 'Unknown', mapX: 397, mapY: 112, lat: 39.629, lng: -79.956, distance: '2.6 mi', note: 'University-adjacent location; dense comparison market.' },
  { id: 'dg-berkeley', name: 'Dollar General — Martinsburg', type: 'Dollar General', county: 'Berkeley', city: 'Martinsburg', rurality: 'Metro', wic: 'Not authorized', mapX: 520, mapY: 91, lat: 39.456, lng: -77.964, distance: '4.9 mi', note: 'Eastern panhandle comparison; fast-growing population.' },
  { id: 'grocery-harrison', name: 'Save-A-Lot — Clarksburg', type: 'Grocery', county: 'Harrison', city: 'Clarksburg', rurality: 'Micropolitan', wic: 'Active', mapX: 316, mapY: 135, lat: 39.281, lng: -80.344, distance: '7.8 mi', note: 'Full-service grocery and active WIC authorization.' },
  { id: 'grocery-greenbrier', name: 'Kroger — Lewisburg', type: 'Grocery', county: 'Greenbrier', city: 'Lewisburg', rurality: 'Rural', wic: 'Active', mapX: 242, mapY: 299, lat: 37.801, lng: -80.445, distance: '11.3 mi', note: 'Regional grocery anchor serving surrounding rural communities.' },
  { id: 'pharmacy-preston', name: 'Preston Family Pharmacy', type: 'Pharmacy', county: 'Preston', city: 'Kingwood', rurality: 'Rural', wic: 'Unknown', mapX: 407, mapY: 174, lat: 39.472, lng: -79.684, distance: '14.8 mi', note: 'Community pharmacy; food inventory not verified.' },
  { id: 'market-monroe', name: 'Monroe Farmers Market', type: 'Farmers market', county: 'Monroe', city: 'Union', rurality: 'Rural', wic: 'Not authorized', mapX: 205, mapY: 329, lat: 37.589, lng: -80.543, distance: '26.4 mi', note: 'Seasonal outlet; WIC redemption opportunity to assess.' },
  { id: 'market-tucker', name: 'Mountain Harvest Market', type: 'Farmers market', county: 'Tucker', city: 'Davis', rurality: 'Rural', wic: 'Unknown', mapX: 434, mapY: 155, lat: 39.133, lng: -79.467, distance: '31.0 mi', note: 'Seasonal market in a high-tourism rural county.' },
];

function imageMapPoint(vendor: Vendor) {
  // The source map has a little white margin around the county artwork.
  // Use the record's geographic coordinates so imported points land in the
  // same place as the representative locations.
  return {
    x: 53 + ((vendor.lng + 82.6) * 511) / 4.9,
    y: 392 - ((vendor.lat - 37) * 378) / 3.7,
  };
}

function AppShell() {
  return <Dashboard />;
}

function Dashboard() {
  const [vendors, setVendors] = useState<Vendor[]>(dgLocations as Vendor[]);
  const [selectedId, setSelectedId] = useState('dg-mingo');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | VendorType>('All');
  const [ruralFilter, setRuralFilter] = useState<'All' | Rurality>('All');
  const [wicFilter, setWicFilter] = useState<'All' | WicStatus>('All');
  const [mapLayer, setMapLayer] = useState<'All vendors' | 'WIC gap'>('All vendors');
  const [activeNav, setActiveNav] = useState('Map overview');
  const [mobileNav, setMobileNav] = useState(false);
  const [importNotice, setImportNotice] = useState('');
  const [mapZoom, setMapZoom] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  const filteredVendors = useMemo(() => vendors.filter((vendor) => {
    const matchesSearch = `${vendor.name} ${vendor.city} ${vendor.county}`.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'All' || vendor.type === typeFilter;
    const matchesRural = ruralFilter === 'All' || vendor.rurality === ruralFilter;
    const matchesWic = wicFilter === 'All' || vendor.wic === wicFilter;
    const matchesLayer = mapLayer === 'All vendors' || vendor.wic !== 'Active';
    return matchesSearch && matchesType && matchesRural && matchesWic && matchesLayer;
  }), [vendors, search, typeFilter, ruralFilter, wicFilter, mapLayer]);

  const selected = vendors.find((vendor) => vendor.id === selectedId) ?? filteredVendors[0] ?? vendors[0];
  const ruralCount = vendors.filter((vendor) => vendor.rurality === 'Rural').length;
  const gapCount = vendors.filter((vendor) => vendor.wic !== 'Active').length;
  const activeCount = vendors.filter((vendor) => vendor.wic === 'Active').length;

  function resetFilters() {
    setSearch('');
    setTypeFilter('All');
    setRuralFilter('All');
    setWicFilter('All');
    setMapLayer('All vendors');
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
        <aside className={`${mobileNav ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 flex w-[258px] flex-col bg-sidebar text-sidebar-foreground shadow-xl transition-transform duration-300 md:relative md:translate-x-0`}>
          <div className="flex h-[84px] items-center gap-3 border-b border-sidebar-border px-6">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-sm bg-sidebar-primary text-sidebar-primary-foreground">
              <MapIcon size={21} strokeWidth={2.5} />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-accent" />
            </div>
            <div>
              <p className="font-serif text-[17px] font-bold tracking-tight">Fieldline</p>
              <p className="font-mono text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/55">WV vendor map</p>
            </div>
          </div>
          <div className="px-4 pt-7">
            <p className="px-3 pb-2 font-mono text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/40">Research workspace</p>
            <nav className="space-y-1">
              {[
                { label: 'Map overview', icon: MapIcon },
                { label: 'Pilot analysis', icon: BarChart3 },
                { label: 'Opportunity gaps', icon: Activity },
                { label: 'Data & methods', icon: Database },
              ].map(({ label, icon: Icon }) => (
                <button
                  type="button"
                  key={label}
                  data-testid={`button-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => { setMobileNav(false); if (label === 'Pilot analysis') { setLocation('/pilot-analysis'); return; } setActiveNav(label); }}
                  className={`flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-[13px] transition-colors ${activeNav === label ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}
                >
                  <Icon size={16} strokeWidth={1.8} />
                  {label}
                  {label === 'Opportunity gaps' && <span className="ml-auto rounded-full bg-accent px-1.5 py-0.5 font-mono text-[9px] font-bold text-accent-foreground">{gapCount}</span>}
                </button>
              ))}
            </nav>
          </div>
          <div className="mt-auto px-6 pb-6">
             <div className="mb-5 border-t border-sidebar-border pt-5">
               <p className="font-mono text-[9px] uppercase tracking-[.12em] text-sidebar-foreground/40">Program partner</p>
               <img src={wicLogo} alt="West Virginia WIC — Nourishing the Future" className="mt-3 w-[174px] rounded-sm bg-white object-contain p-1" />
             </div>
            <div className="border-t border-sidebar-border pt-5">
              <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[.12em] text-sidebar-foreground/45">
                <span>Source status</span>
                <span className="flex items-center gap-1.5 text-sidebar-primary"><span className="h-1.5 w-1.5 rounded-full bg-sidebar-primary" /> Local data</span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-sidebar-foreground/55">Representative locations for planning conversations. Verify before publication.</p>
            </div>
          </div>
        </aside>
        {mobileNav && <button type="button" aria-label="Close navigation" data-testid="button-close-navigation" onClick={() => setMobileNav(false)} className="fixed inset-0 z-30 bg-foreground/30 md:hidden" />}

        <main className="min-w-0 flex-1">
          <header className="flex min-h-[84px] items-center justify-between border-b border-border bg-card/90 px-4 py-4 backdrop-blur md:px-8">
            <div className="flex items-center gap-3">
              <button type="button" data-testid="button-open-navigation" onClick={() => setMobileNav(true)} className="rounded-sm p-2 text-muted-foreground hover:bg-muted md:hidden"><Menu size={20} /></button>
              <div>
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> West Virginia / statewide view</div>
                <h1 className="mt-1 font-serif text-[22px] font-bold tracking-tight md:text-[25px]">{activeNav}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <img src={dohLogo} alt="West Virginia Department of Health" className="mr-2 hidden h-8 w-auto max-w-[170px] object-contain xl:block" />
              <input ref={fileInputRef} type="file" accept=".csv,.json,application/json,text/csv" onChange={handleFile} className="hidden" data-testid="input-import-file" />
              <button type="button" data-testid="button-import-vendors" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 rounded-sm border border-border bg-background px-3 py-2 text-[12px] font-semibold text-foreground transition-colors hover:border-primary hover:bg-muted"><Upload size={15} /> <span className="hidden sm:inline">Import list</span></button>
              <button type="button" data-testid="button-export-vendors" onClick={() => { const blob = new Blob([JSON.stringify(vendors, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'wv-vendor-map.json'; anchor.click(); URL.revokeObjectURL(url); }} className="flex items-center gap-2 rounded-sm bg-primary px-3 py-2 text-[12px] font-semibold text-primary-foreground transition-transform hover:-translate-y-px"><ArrowDownToLine size={15} /> <span className="hidden sm:inline">Export view</span></button>
            </div>
          </header>

          <div className="mx-auto max-w-[1600px] space-y-5 p-4 md:p-7">
            {importNotice && <div role="status" data-testid="status-import-notice" className="animate-rise flex items-center justify-between border border-accent/50 bg-accent/15 px-4 py-3 text-[12px] font-semibold text-foreground"><span className="flex items-center gap-2"><Check size={15} className="text-[#6f7f31]" /> {importNotice}</span><button type="button" aria-label="Dismiss import notice" data-testid="button-dismiss-import-notice" onClick={() => setImportNotice('')}><X size={15} /></button></div>}

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Vendors mapped" value={vendors.length.toString()} detail="Across 22 counties" icon={<Store size={16} />} accent="yellow" />
              <Metric label="Rural locations" value={`${ruralCount}/${vendors.length}`} detail={`${Math.round((ruralCount / Math.max(vendors.length, 1)) * 100)}% of mapped vendors`} icon={<Navigation size={16} />} accent="teal" />
              <Metric label="WIC opportunity" value={gapCount.toString()} detail="Not active or unknown" icon={<Activity size={16} />} accent="coral" />
              <Metric label="Active WIC vendors" value={activeCount.toString()} detail="Known authorizations" icon={<Check size={16} />} accent="green" />
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,.75fr)]">
              <div className="min-w-0 overflow-hidden border border-border bg-card shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5 md:px-5">
                  <div>
                    <h2 className="font-serif text-[17px] font-bold">Vendor geography</h2>
                     <p className="mt-0.5 text-[11px] text-muted-foreground">Point locations shown against a county-level West Virginia map</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-sm border border-border bg-muted/50 p-1">
                    {(['All vendors', 'WIC gap'] as const).map((layer) => <button type="button" key={layer} data-testid={`button-layer-${layer.toLowerCase().replace(/\s+/g, '-')}`} onClick={() => setMapLayer(layer)} className={`rounded-sm px-2.5 py-1.5 text-[10px] font-semibold transition-colors ${mapLayer === layer ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{layer}</button>)}
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
                    <LegendDot color="#e0ad2d" label="Dollar General" />
                    <LegendDot color="#2c615d" label="Grocery" />
                    <LegendDot color="#df7660" label="Pharmacy" />
                    <LegendDot color="#8a9c4e" label="Market" />
                  </div>
                   <svg viewBox="0 0 620 410" className="h-full w-full transition-transform duration-500" style={{ transform: `scale(${mapZoom})` }} role="img" aria-label="West Virginia county map with vendor locations">
                     <image href={wvCountyMap} x="37" y="0" width="546" height="410" preserveAspectRatio="none" />
                    {filteredVendors.map((vendor) => {
                      const active = selected?.id === vendor.id;
                      const color = vendor.type === 'Dollar General' ? '#d8a629' : vendor.type === 'Grocery' ? '#2c615d' : vendor.type === 'Pharmacy' ? '#df7660' : '#84943f';
                       const point = imageMapPoint(vendor);
                       return <g key={vendor.id} className="vendor-pin" onClick={() => setSelectedId(vendor.id)} data-testid={`map-pin-${vendor.id}`} role="button" aria-label={`Select ${vendor.name}`} tabIndex={0}>
                         {active && <circle cx={point.x} cy={point.y} r="13" fill="none" stroke={color} strokeWidth="2" opacity=".6" className="focus-ring" />}
                         <circle cx={point.x} cy={point.y} r={active ? 7 : 5.5} fill={color} stroke="#f7f2e6" strokeWidth="2" />
                         {active && <circle cx={point.x} cy={point.y} r="2" fill="#f7f2e6" />}
                      </g>;
                    })}
                  </svg>
                </div>
                <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5 font-mono text-[9px] uppercase tracking-[.1em] text-muted-foreground md:px-5">
                  <span>{filteredVendors.length} visible locations</span><span>Data view · {mapLayer}</span>
                </div>
              </div>

              <SelectedPanel vendor={selected} onClear={() => setSelectedId('')} />
            </section>

            <section className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,.8fr)]">
               <div className="relative overflow-hidden border border-border bg-card p-5 md:p-6">
                 <img src={wicEmbellishmentOne} alt="" aria-hidden="true" className="pointer-events-none absolute -right-10 -top-4 w-[230px] opacity-[.11]" />
                 <img src={wicEmbellishmentTwo} alt="" aria-hidden="true" className="pointer-events-none absolute -bottom-14 right-24 w-[190px] opacity-[.07]" />
                <div className="flex items-start justify-between gap-4">
                   <div className="relative z-[1]"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-accent-foreground/70">Reading the map</p><h2 className="mt-2 max-w-[550px] font-serif text-[24px] font-bold leading-[1.1] tracking-tight md:text-[29px]">Access is a distance problem before it is a store problem.</h2></div>
                  <CircleHelp size={19} className="shrink-0 text-muted-foreground" />
                </div>
                 <p className="relative z-[1] mt-4 max-w-[720px] text-[13px] leading-relaxed text-muted-foreground">In rural West Virginia, a vendor can be physically present and still be functionally out of reach. This working map layers vendor type, rurality, and WIC authorization to surface where a familiar retail footprint may represent a practical partnership opportunity.</p>
                 <div className="relative z-[1] mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
                  <StoryStat value="11" label="rural counties represented" detail="in this working set" />
                  <StoryStat value="18.4 mi" label="longest observed trip" detail="to a mapped vendor" />
                  <StoryStat value="5" label="locations to validate" detail="before outreach" />
                </div>
              </div>
               <div className="relative overflow-hidden border border-border bg-[#e8e5d5] p-5 md:p-6">
                 <div className="flex items-center justify-between"><div className="flex items-center gap-2"><img src={wicColorLogo} alt="WIC" className="h-7 w-7 rounded-full object-cover" /><p className="font-mono text-[9px] uppercase tracking-[.18em] text-muted-foreground">Signal to watch</p></div><BarChart3 size={17} className="text-primary" /></div>
                <p className="mt-6 font-serif text-[39px] font-bold leading-none text-primary">4 in 10</p>
                <p className="mt-2 text-[13px] font-semibold text-foreground">mapped sites sit in a WIC opportunity window</p>
                <div className="mt-5 h-2 overflow-hidden bg-background/70"><div className="h-full bg-accent transition-all duration-500" style={{ width: `${(gapCount / Math.max(vendors.length, 1)) * 100}%` }} /></div>
                 <div className="mt-3 flex items-end justify-between gap-3"><p className="text-[11px] leading-relaxed text-muted-foreground">Not authorized or authorization status not yet confirmed. Treat this as a lead list, not a compliance finding.</p><img src={wicColorLogoAlt} alt="WIC" className="h-8 w-8 shrink-0 rounded-full object-cover" /></div>
              </div>
            </section>

            <section id="location-index" className="border border-border bg-card">
              <div className="flex flex-col gap-4 border-b border-border p-4 md:flex-row md:items-center md:justify-between md:px-5">
                <div><h2 className="font-serif text-[18px] font-bold">Location index</h2><p className="mt-1 text-[11px] text-muted-foreground">Select a row to inspect the field context.</p></div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative"><Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search county or city" data-testid="input-search-vendors" className="h-8 w-full rounded-sm border border-input bg-background pl-8 pr-3 text-[11px] outline-none transition-colors placeholder:text-muted-foreground focus:border-primary sm:w-[180px]" /></div>
                  <FilterSelect label="Type" value={typeFilter} options={['All', 'Dollar General', 'Grocery', 'Pharmacy', 'Farmers market'] as const} onChange={(value) => setTypeFilter(value as typeof typeFilter)} testId="select-vendor-type" />
                  <FilterSelect label="Rurality" value={ruralFilter} options={['All', 'Rural', 'Micropolitan', 'Metro'] as const} onChange={(value) => setRuralFilter(value as typeof ruralFilter)} testId="select-rurality" />
                  <FilterSelect label="WIC" value={wicFilter} options={['All', 'Active', 'Not authorized', 'Unknown'] as const} onChange={(value) => setWicFilter(value as typeof wicFilter)} testId="select-wic-status" />
                  {(search || typeFilter !== 'All' || ruralFilter !== 'All' || wicFilter !== 'All' || mapLayer !== 'All vendors') && <button type="button" data-testid="button-reset-filters" onClick={resetFilters} className="flex h-8 items-center gap-1.5 px-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground"><RotateCcw size={13} /> Reset</button>}
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
            <footer className="flex flex-col gap-2 border-t border-border pt-4 text-[10px] leading-relaxed text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span><strong className="text-foreground">Fieldline / WV Vendor Map</strong> · A working instrument for public health teams</span><span className="font-mono uppercase tracking-[.1em]">Representative data · Updated 06 Feb 2025</span>
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

function SelectedPanel({ vendor, onClear }: { vendor?: Vendor; onClear: () => void }) {
  if (!vendor) return <div className="flex min-h-[390px] items-center justify-center border border-border bg-card p-6 text-center"><div><Store size={26} className="mx-auto text-muted-foreground/50" /><p className="mt-3 font-serif text-lg font-bold">Select a location</p><p className="mt-1 text-[12px] text-muted-foreground">Choose a map point or table row to inspect it.</p></div></div>;
  return <div className="animate-rise border border-border bg-card shadow-sm">
    <div className="flex items-start justify-between border-b border-border bg-primary px-5 py-5 text-primary-foreground"><div><p className="font-mono text-[9px] uppercase tracking-[.16em] text-primary-foreground/60">Selected location</p><h2 className="mt-2 font-serif text-[22px] font-bold leading-tight">{vendor.city}</h2><p className="mt-1 text-[12px] text-primary-foreground/70">{vendor.county} County, West Virginia</p></div><button type="button" aria-label="Clear selected location" data-testid="button-clear-selection" onClick={onClear} className="rounded-sm p-1 text-primary-foreground/60 hover:bg-primary-foreground/10 hover:text-primary-foreground"><X size={17} /></button></div>
    <div className="space-y-5 p-5">
      <div className="flex items-center justify-between gap-3"><div><p className="text-[13px] font-semibold">{vendor.name}</p><p className="mt-1 text-[10px] text-muted-foreground">{vendor.lat.toFixed(3)}, {vendor.lng.toFixed(3)}</p></div><TypePill type={vendor.type} /></div>
      <div className="grid grid-cols-2 gap-2"><InfoCell label="Rurality" value={vendor.rurality} /><InfoCell label="WIC status" value={vendor.wic} accent={vendor.wic !== 'Active'} /></div>
      <div className="border-l-2 border-accent bg-accent/10 px-3 py-3"><p className="font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground">Field note</p><p className="mt-2 text-[12px] leading-relaxed text-foreground">{vendor.note}</p></div>
      <div className="flex items-center justify-between border-t border-border pt-4"><span className="text-[11px] text-muted-foreground">Nearest mapped route</span><strong className="font-mono text-[12px]">{vendor.distance}</strong></div>
      <button type="button" data-testid="button-focus-location" onClick={() => document.getElementById('location-index')?.scrollIntoView({ behavior: 'smooth' })} className="flex w-full items-center justify-center gap-2 border border-border py-2.5 text-[11px] font-bold transition-colors hover:bg-muted"><Navigation size={14} /> Add to field brief</button>
    </div>
  </div>;
}

function InfoCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) { return <div className="rounded-sm border border-border bg-muted/35 px-3 py-2.5"><p className="font-mono text-[9px] uppercase tracking-[.1em] text-muted-foreground">{label}</p><p className={`mt-1.5 text-[12px] font-semibold ${accent ? 'text-[#b95d4c]' : ''}`}>{value}</p></div>; }
function StoryStat({ value, label, detail }: { value: string; label: string; detail: string }) { return <div><p className="font-serif text-[24px] font-bold">{value}</p><p className="mt-1 text-[11px] font-semibold">{label}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{detail}</p></div>; }
function LegendDot({ color, label }: { color: string; label: string }) { return <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />{label}</span>; }
function TypePill({ type }: { type: VendorType }) { const color = type === 'Dollar General' ? 'bg-accent/30 text-[#765d18]' : type === 'Grocery' ? 'bg-primary/10 text-primary' : type === 'Pharmacy' ? 'bg-[#df7660]/15 text-[#a85142]' : 'bg-[#84943f]/15 text-[#617129]'; return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${color}`}>{type}</span>; }
function WicPill({ status }: { status: WicStatus }) { const color = status === 'Active' ? 'bg-[#84943f]/15 text-[#617129]' : status === 'Not authorized' ? 'bg-[#df7660]/15 text-[#a85142]' : 'bg-muted text-muted-foreground'; return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${color}`}>{status}</span>; }
function FilterSelect({ label, value, options, onChange, testId }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void; testId: string }) { return <label className="relative flex h-8 items-center gap-1.5 rounded-sm border border-input bg-background px-2 text-[10px] font-semibold"><span className="text-muted-foreground">{label}</span><select value={value} data-testid={testId} onChange={(event) => onChange(event.target.value)} className="max-w-[100px] appearance-none bg-transparent pr-3 text-[10px] font-semibold outline-none"><>{options.map((option) => <option value={option} key={option}>{option}</option>)}</></select><ChevronDown size={11} className="pointer-events-none absolute right-1 text-muted-foreground" /></label>; }

function Router() {
  return <ErrorBoundary resetKey={useLocation()[0]}><Switch><Route path="/" component={AppShell} /><Route path="/pilot-analysis" component={PilotAnalysis} /><Route component={() => <div className="p-12 font-serif text-xl">Page not found</div>} /></Switch></ErrorBoundary>;
}

const queryClient = new QueryClient();
function App() { return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>; }
export default App;
