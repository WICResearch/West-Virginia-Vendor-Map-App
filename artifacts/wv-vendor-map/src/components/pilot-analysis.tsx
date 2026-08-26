import { useState } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  Info,
  MapPinned,
  Menu,
  Route,
  Target,
  Users,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { analysisData } from '@/analysis-data';
import wicLogo from '@assets/wic_logo__1787710051410.png';
import dohLogo from '@assets/New_Dept_of_Health_Logo_horz_RGB_1787710060679.jpg';

type Candidate = (typeof analysisData.priorityLocations)[number];

const navItems = [
  { label: 'Map overview', icon: MapPinned, href: '/' },
  { label: 'Pilot analysis', icon: BarChart3, href: '/pilot-analysis' },
  { label: 'Opportunity gaps', icon: Route, href: '/' },
  { label: 'Data & methods', icon: BookOpen, href: '/' },
];

function formatMiles(value: number) {
  return value > 0 ? `${value.toFixed(value < 10 ? 1 : 1)} mi` : 'No savings';
}

function PercentBar({ value, color = 'bg-primary' }: { value: number; color?: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#e3e0d5]">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${Math.max(3, Math.min(value, 100))}%` }} />
    </div>
  );
}

function RuralityBars() {
  const rows = [
    { label: 'Urban / Metro', value: analysisData.ruralityBreakdown['Urban/Metro'], color: 'bg-primary' },
    { label: 'Isolated Rural', value: analysisData.ruralityBreakdown['Isolated Rural'], color: 'bg-[#d8a629]' },
    { label: 'Large Rural / Micropolitan', value: analysisData.ruralityBreakdown['Large Rural/Micropolitan'], color: 'bg-[#84943f]' },
    { label: 'Small Rural / Small Town', value: analysisData.ruralityBreakdown['Small Rural/Small Town'], color: 'bg-[#df7660]' },
    { label: 'Not classified', value: analysisData.ruralityBreakdown['Not classified'], color: 'bg-[#9ca39a]' },
  ];
  const largest = Math.max(...rows.map((row) => row.value));

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.label} data-testid={`row-rurality-${row.label.toLowerCase().replace(/[\s/]+/g, '-')}`}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px]">
            <span className="font-semibold text-foreground">{row.label}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{row.value}</span>
          </div>
          <PercentBar value={(row.value / largest) * 100} color={row.color} />
        </div>
      ))}
    </div>
  );
}

function CandidateCard({ candidate, selected, onSelect }: { candidate: Candidate; selected: boolean; onSelect: () => void }) {
  const score = candidate['Provisional  Overall Pilot Priority Score'];
  return (
    <button
      type="button"
      onClick={onSelect}
      data-testid={`button-candidate-${candidate['Priority Rank']}`}
      className={`group w-full border p-4 text-left transition-transform hover:-translate-y-0.5 ${selected ? 'border-primary bg-primary text-primary-foreground shadow-md' : 'border-border bg-card hover:border-primary/50'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`font-mono text-[10px] ${selected ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>0{candidate['Priority Rank']}</span>
        <span className={`rounded-full px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[.1em] ${selected ? 'bg-primary-foreground/15 text-primary-foreground' : 'bg-accent/25 text-[#765d18]'}`}>
          {candidate['Pilot Tier']}
        </span>
      </div>
      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <p className="font-serif text-[20px] font-bold leading-none">{candidate['DG City']}</p>
          <p className={`mt-1 text-[11px] ${selected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{candidate.County} County</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[21px] font-bold leading-none">{score.toFixed(1)}</p>
          <p className={`mt-1 font-mono text-[8px] uppercase tracking-[.1em] ${selected ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>priority</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-current/10 pt-3 text-[10px]">
        <span className={selected ? 'text-primary-foreground/70' : 'text-muted-foreground'}>{candidate['Meets USDA Rural 10-Mi Access Gap?'] === 'Yes' ? 'Access gap' : 'Near existing access'}</span>
        <ArrowUpRight size={14} className={selected ? 'text-accent' : 'text-primary opacity-0 transition-opacity group-hover:opacity-100'} />
      </div>
    </button>
  );
}

function ScoreComponent({ label, value, description, color }: { label: string; value: number; description: string; color: string }) {
  return (
    <div className="border border-border bg-card p-4" data-testid={`card-score-component-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="max-w-[150px] text-[12px] font-bold leading-tight">{label}</p>
        <span className="font-mono text-[19px] font-bold">{value.toFixed(1)}</span>
      </div>
      <div className="mt-4"><PercentBar value={value} color={color} /></div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

export function PilotAnalysis() {
  const [, setLocation] = useLocation();
  const [mobileNav, setMobileNav] = useState(false);
  const [selectedRank, setSelectedRank] = useState(1);
  const candidates = analysisData.priorityLocations.slice(0, 8);
  const selected = candidates.find((candidate) => candidate['Priority Rank'] === selectedRank) ?? candidates[0];
  const candidateCount = analysisData.summary.pilotYes;
  const gapShare = Math.round((analysisData.summary.accessGapYes / analysisData.summary.storeCount) * 100);
  const ruralShare = Math.round((analysisData.summary.rural / analysisData.summary.storeCount) * 100);
  const averageScore = candidates.reduce((total, candidate) => total + candidate['Provisional  Overall Pilot Priority Score'], 0) / candidates.length;
  const countyLeaders = analysisData.countyPriority.slice(0, 5);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="flex min-h-[100dvh]">
        <aside className={`${mobileNav ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 flex w-[258px] flex-col bg-sidebar text-sidebar-foreground shadow-xl transition-transform duration-300 md:relative md:translate-x-0`}>
          <div className="flex h-[84px] items-center gap-3 border-b border-sidebar-border px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-sidebar-primary text-sidebar-primary-foreground"><BarChart3 size={20} strokeWidth={2.5} /></div>
            <div><p className="font-serif text-[17px] font-bold tracking-tight">Fieldline</p><p className="font-mono text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/55">WV vendor map</p></div>
          </div>
          <div className="px-4 pt-7">
            <p className="px-3 pb-2 font-mono text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/40">Research workspace</p>
            <nav className="space-y-1">
              {navItems.map(({ label, icon: Icon, href }) => (
                <button
                  type="button"
                  key={label}
                  data-testid={`button-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => { setMobileNav(false); if (href === '/pilot-analysis') return; setLocation(href); }}
                  className={`flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-[13px] transition-colors ${label === 'Pilot analysis' ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}
                >
                  <Icon size={16} strokeWidth={1.8} />
                  {label}
                  {label === 'Pilot analysis' && <span className="ml-auto rounded-full bg-sidebar-primary px-1.5 py-0.5 font-mono text-[9px] font-bold text-sidebar-primary-foreground">NEW</span>}
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
              <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[.12em] text-sidebar-foreground/45"><span>Source status</span><span className="flex items-center gap-1.5 text-sidebar-primary"><span className="h-1.5 w-1.5 rounded-full bg-sidebar-primary" /> Workbook loaded</span></div>
              <p className="mt-2 text-[11px] leading-relaxed text-sidebar-foreground/55">Pilot ranking is provisional. Validate store operations and local conditions before outreach.</p>
            </div>
          </div>
        </aside>
        {mobileNav && <button type="button" aria-label="Close navigation" data-testid="button-close-analysis-navigation" onClick={() => setMobileNav(false)} className="fixed inset-0 z-30 bg-foreground/30 md:hidden" />}

        <main className="min-w-0 flex-1">
          <header className="flex min-h-[84px] items-center justify-between border-b border-border bg-card/90 px-4 py-4 backdrop-blur md:px-8">
            <div className="flex items-center gap-3">
              <button type="button" data-testid="button-open-analysis-navigation" onClick={() => setMobileNav(true)} className="rounded-sm p-2 text-muted-foreground hover:bg-muted md:hidden"><Menu size={20} /></button>
              <div><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> West Virginia / pilot briefing</div><h1 className="mt-1 font-serif text-[22px] font-bold tracking-tight md:text-[25px]">Pilot analysis</h1></div>
            </div>
            <img src={dohLogo} alt="West Virginia Department of Health" className="hidden h-8 w-auto max-w-[170px] object-contain sm:block" />
          </header>

          <div className="mx-auto max-w-[1500px] space-y-6 p-4 md:p-7">
            <section className="relative overflow-hidden border border-primary bg-primary px-5 py-7 text-primary-foreground shadow-md md:px-9 md:py-10">
              <div className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full border-[36px] border-accent/20" />
              <div className="pointer-events-none absolute -bottom-36 left-[43%] h-72 w-72 rounded-full border border-primary-foreground/10" />
              <div className="relative max-w-[920px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-accent px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[.14em] text-accent-foreground">Provisional analysis</span>
                  <span className="font-mono text-[9px] uppercase tracking-[.14em] text-primary-foreground/55">Dollar General pilot workbook · 318 stores</span>
                </div>
                <h2 className="mt-6 max-w-[830px] font-serif text-[34px] font-bold leading-[1.04] tracking-[-.03em] md:text-[53px]">Where one new WIC partner could change the trip.</h2>
                <p className="mt-5 max-w-[710px] text-[14px] leading-relaxed text-primary-foreground/75 md:text-[15px]">This briefing turns the workbook’s pilot ranking into a field-ready read: which Dollar General locations rise to the top, why they rise, and what still needs to be checked before a recommendation becomes a commitment.</p>
              </div>
              <div className="relative mt-8 grid max-w-[850px] gap-5 border-t border-primary-foreground/15 pt-5 sm:grid-cols-3">
                <div><p className="font-mono text-[27px] font-bold text-accent">{candidateCount}</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-primary-foreground/55">recommended candidates</p></div>
                <div><p className="font-mono text-[27px] font-bold text-accent">{analysisData.summary.accessGapYes}</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-primary-foreground/55">meet the access-gap flag</p></div>
                <div><p className="font-mono text-[27px] font-bold text-accent">{analysisData.summary.participants.toLocaleString()}</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-primary-foreground/55">active WIC participants represented</p></div>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="border border-border bg-card p-4"><div className="flex items-center justify-between"><p className="font-mono text-[9px] uppercase tracking-[.15em] text-muted-foreground">Workbook universe</p><Target size={16} className="text-primary" /></div><p className="mt-4 font-serif text-[30px] font-bold leading-none">{analysisData.summary.storeCount}</p><p className="mt-2 text-[11px] text-muted-foreground">Dollar General stores assessed</p></div>
              <div className="border border-border bg-card p-4"><div className="flex items-center justify-between"><p className="font-mono text-[9px] uppercase tracking-[.15em] text-muted-foreground">Potential reach</p><Users size={16} className="text-[#84943f]" /></div><p className="mt-4 font-serif text-[30px] font-bold leading-none">{analysisData.summary.eligible.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p><p className="mt-2 text-[11px] text-muted-foreground">estimated WIC-eligible people</p></div>
              <div className="border border-border bg-card p-4"><div className="flex items-center justify-between"><p className="font-mono text-[9px] uppercase tracking-[.15em] text-muted-foreground">Rural footprint</p><MapPinned size={16} className="text-[#d8a629]" /></div><p className="mt-4 font-serif text-[30px] font-bold leading-none">{ruralShare}%</p><p className="mt-2 text-[11px] text-muted-foreground">{analysisData.summary.rural} stores classified rural</p></div>
              <div className="border border-border bg-card p-4"><div className="flex items-center justify-between"><p className="font-mono text-[9px] uppercase tracking-[.15em] text-muted-foreground">Top score</p><BarChart3 size={16} className="text-[#df7660]" /></div><p className="mt-4 font-serif text-[30px] font-bold leading-none">{candidates[0]['Provisional  Overall Pilot Priority Score'].toFixed(1)}</p><p className="mt-2 text-[11px] text-muted-foreground">provisional priority score</p></div>
            </section>

            <section className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,.7fr)]">
              <div className="border border-border bg-card p-5 md:p-7">
                <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[9px] uppercase tracking-[.17em] text-[#765d18]">Read the signal</p><h2 className="mt-2 max-w-[600px] font-serif text-[28px] font-bold leading-[1.08] tracking-tight">The strongest candidates are not simply the busiest stores.</h2></div><Info size={18} className="shrink-0 text-muted-foreground" /></div>
                <p className="mt-5 max-w-[720px] text-[13px] leading-relaxed text-muted-foreground">A high score means a location combines several useful signals: people already connected to WIC, weaker nearby retail access, and a community context that may benefit from another authorized option. It is a way to focus the first conversation, not a prediction of store performance or a finding of eligibility.</p>
                <div className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
                  <div><p className="font-serif text-[24px] font-bold">19.3 mi</p><p className="mt-1 text-[11px] font-semibold">possible trip reduction</p><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">at the top-ranked Chapmanville site</p></div>
                  <div><p className="font-serif text-[24px] font-bold">{gapShare}%</p><p className="mt-1 text-[11px] font-semibold">flagged for access gap</p><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">32 of 318 stores in this workbook</p></div>
                  <div><p className="font-serif text-[24px] font-bold">61</p><p className="mt-1 text-[11px] font-semibold">without another grocery option</p><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">a separate, stronger access signal</p></div>
                </div>
              </div>
              <div className="border border-[#d5cfae] bg-[#e8e5d5] p-5 md:p-7">
                <div className="flex items-center gap-2"><CircleAlert size={16} className="text-[#a85142]" /><p className="font-mono text-[9px] uppercase tracking-[.17em] text-[#765d18]">Important context</p></div>
                <h2 className="mt-5 font-serif text-[25px] font-bold leading-tight">Treat “Yes” as a lead, not a verdict.</h2>
                <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">The access-gap flag describes modeled distance and vendor coverage. It does not confirm inventory, operating hours, transportation, or a store’s willingness to seek WIC authorization.</p>
                <div className="mt-5 flex items-start gap-2 border-t border-[#cfc8a6] pt-4 text-[11px] font-semibold leading-relaxed"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#84943f]" /> Validate the top sites with regional staff and store-level outreach.</div>
              </div>
            </section>

            <section className="border border-border bg-card">
              <div className="flex flex-col gap-3 border-b border-border p-5 md:flex-row md:items-end md:justify-between md:px-7">
                <div><p className="font-mono text-[9px] uppercase tracking-[.17em] text-[#765d18]">01 / Candidate set</p><h2 className="mt-2 font-serif text-[28px] font-bold leading-none">Start with the first conversation</h2><p className="mt-2 text-[12px] text-muted-foreground">The workbook recommends {candidateCount} sites. These are the eight highest-ranked locations.</p></div>
                <p className="font-mono text-[10px] uppercase tracking-[.1em] text-muted-foreground">Mean of top eight · {averageScore.toFixed(1)}</p>
              </div>
              <div className="grid gap-5 p-5 md:p-7 xl:grid-cols-[minmax(0,1fr)_minmax(300px,.72fr)]">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {candidates.map((candidate) => <CandidateCard key={candidate['Priority Rank']} candidate={candidate} selected={candidate['Priority Rank'] === selectedRank} onSelect={() => setSelectedRank(candidate['Priority Rank'] as number)} />)}
                </div>
                <div className="border border-primary bg-primary p-5 text-primary-foreground md:p-6" data-testid="card-selected-candidate">
                  <div className="flex items-center justify-between"><p className="font-mono text-[9px] uppercase tracking-[.16em] text-primary-foreground/55">Selected candidate</p><span className="font-mono text-[10px] text-accent">RANK #{selected['Priority Rank']}</span></div>
                  <h3 className="mt-5 font-serif text-[30px] font-bold leading-none">{selected['DG City']}</h3>
                  <p className="mt-2 text-[12px] text-primary-foreground/70">{selected.County} County · {selected['WIC Region']} region · {selected['RUCA Classification']}</p>
                  <div className="mt-6 flex items-end gap-3"><p className="font-mono text-[46px] font-bold leading-none text-accent">{selected['Provisional  Overall Pilot Priority Score'].toFixed(1)}</p><p className="mb-1 text-[10px] uppercase tracking-[.12em] text-primary-foreground/55">priority<br />score</p></div>
                  <div className="mt-6 space-y-3 border-t border-primary-foreground/15 pt-5">
                    <div className="flex justify-between text-[11px]"><span className="text-primary-foreground/65">Potential miles saved</span><strong>{formatMiles(selected['Potential Miles Saved'])}</strong></div>
                    <div className="flex justify-between text-[11px]"><span className="text-primary-foreground/65">Current WIC vendors within 10 mi</span><strong>{selected['Current WIC Vendors Within 10 Mi']}</strong></div>
                    <div className="flex justify-between text-[11px]"><span className="text-primary-foreground/65">Estimated WIC eligible</span><strong>{selected['Estimated WIC Eligible - ZIP'].toFixed(1)}</strong></div>
                    <div className="flex justify-between text-[11px]"><span className="text-primary-foreground/65">Access-gap flag</span><strong className="text-accent">{selected['Meets USDA Rural 10-Mi Access Gap?']}</strong></div>
                  </div>
                  <p className="mt-6 text-[11px] leading-relaxed text-primary-foreground/65">Nearest current vendor: {selected['Nearest Current WIC Vendor']} at {selected['Nearest WIC Vendor Miles'].toFixed(1)} miles.</p>
                </div>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <div className="border border-border bg-card p-5 md:p-7">
                <div className="flex items-start justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.17em] text-[#765d18]">02 / Access landscape</p><h2 className="mt-2 font-serif text-[27px] font-bold leading-tight">Distance is the clearest opening.</h2></div><Route size={18} className="text-primary" /></div>
                <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">Thirty-two locations meet the workbook’s modeled USDA rural 10-mile access-gap flag. Sixty-one report no other grocery shopping option, making the access story bigger than WIC vendor count alone.</p>
                <div className="mt-6 space-y-5">
                  <div><div className="mb-2 flex justify-between text-[11px]"><span className="font-semibold">Meets access-gap flag</span><strong className="font-mono">{analysisData.summary.accessGapYes} / {analysisData.summary.storeCount}</strong></div><PercentBar value={gapShare} color="bg-[#df7660]" /></div>
                  <div><div className="mb-2 flex justify-between text-[11px]"><span className="font-semibold">No other grocery option</span><strong className="font-mono">{analysisData.summary.noGroceryYes} / {analysisData.summary.storeCount}</strong></div><PercentBar value={(analysisData.summary.noGroceryYes / analysisData.summary.storeCount) * 100} color="bg-[#d8a629]" /></div>
                </div>
                <div className="mt-6 border-l-2 border-accent bg-accent/10 px-3 py-3 text-[11px] leading-relaxed">The top access story is Chapmanville: one current WIC vendor within 10 miles, a 21.2-mile nearest route, and a modeled 19.3 miles saved.</div>
              </div>
              <div className="border border-border bg-card p-5 md:p-7">
                <div className="flex items-start justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.17em] text-[#765d18]">03 / Place matters</p><h2 className="mt-2 font-serif text-[27px] font-bold leading-tight">A rurality-aware shortlist.</h2></div><MapPinned size={18} className="text-primary" /></div>
                <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">The workbook spans different market contexts. Rural classifications are not a quality judgment; they help teams interpret distance, density, and the practical shape of a pilot.</p>
                <div className="mt-6"><RuralityBars /></div>
                <div className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground"><Info size={14} className="mt-0.5 shrink-0 text-primary" /> {analysisData.ruralityBreakdown['Not classified']} records still need a usable rurality classification.</div>
              </div>
            </section>

            <section className="border border-border bg-card">
              <div className="border-b border-border p-5 md:px-7 md:py-6"><p className="font-mono text-[9px] uppercase tracking-[.17em] text-[#765d18]">04 / Weighted score components</p><div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><h2 className="font-serif text-[28px] font-bold leading-none">Three lenses, one provisional priority.</h2><p className="max-w-[420px] text-[11px] leading-relaxed text-muted-foreground">Higher values indicate a stronger signal within each workbook component. The source file does not include a published weight schedule.</p></div></div>
              <div className="grid gap-3 p-5 md:grid-cols-3 md:p-7">
                <ScoreComponent label="WIC participation" value={selected['WIC Participation Score']} color="bg-primary" description="Existing WIC families and participants connected to the target ZIP or community." />
                <ScoreComponent label="Retail access" value={selected['Retail Access Score']} color="bg-[#d8a629]" description="The local distance and coverage signal: nearby vendors, routes, and potential miles saved." />
                <ScoreComponent label="Community need" value={selected['Community Need Score']} color="bg-[#df7660]" description="A modeled need signal that adds local context beyond the store’s immediate trade area." />
              </div>
              <div className="mx-5 mb-5 flex flex-col gap-3 border-t border-border pt-5 text-[11px] text-muted-foreground md:mx-7 md:mb-7 md:flex-row md:items-center md:justify-between"><span className="flex items-center gap-2"><BarChart3 size={14} className="text-primary" /> Final value shown above: <strong className="font-mono text-foreground">{selected['Provisional  Overall Pilot Priority Score'].toFixed(1)}</strong></span><span className="flex items-center gap-2"><CircleAlert size={14} className="text-[#a85142]" /> Confirm component definitions and weights before publication.</span></div>
            </section>

            <section className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,.9fr)]">
              <div className="border border-border bg-card p-5 md:p-7">
                <div className="flex items-start justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.17em] text-[#765d18]">05 / County context</p><h2 className="mt-2 font-serif text-[27px] font-bold leading-tight">Where county pressure surfaces</h2></div><Users size={18} className="text-primary" /></div>
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[570px] text-left text-[11px]">
                    <thead className="border-y border-border bg-muted/35 font-mono text-[9px] uppercase tracking-[.1em] text-muted-foreground"><tr><th className="px-3 py-3 font-normal">County</th><th className="px-3 py-3 font-normal">Active families</th><th className="px-3 py-3 font-normal">Families / retailer</th><th className="px-3 py-3 font-normal">Need tier</th></tr></thead>
                    <tbody className="divide-y divide-border">{countyLeaders.map((county) => <tr key={county.County} data-testid={`row-county-${county.County.toLowerCase()}`}><td className="px-3 py-3.5 font-semibold">{county.County}</td><td className="px-3 py-3.5 font-mono">{county['Active WIC Families'].toLocaleString()}</td><td className="px-3 py-3.5 font-mono">{county['WIC Families per Retailer'].toFixed(1)}</td><td className="px-3 py-3.5"><span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${county['Need Tier'].includes('High') ? 'bg-[#df7660]/15 text-[#a85142]' : 'bg-muted text-muted-foreground'}`}>{county['Need Tier'].replace('Tier ', 'T')}</span></td></tr>)}</tbody>
                  </table>
                </div>
              </div>
              <div className="border border-[#d5cfae] bg-[#e8e5d5] p-5 md:p-7">
                <div className="flex items-center gap-2"><BookOpen size={16} className="text-[#765d18]" /><p className="font-mono text-[9px] uppercase tracking-[.17em] text-[#765d18]">Before a pilot decision</p></div>
                <h2 className="mt-5 font-serif text-[25px] font-bold leading-tight">Use this ranking to ask better questions.</h2>
                <ul className="mt-5 space-y-3 text-[12px] leading-relaxed text-muted-foreground">
                  <li className="flex gap-2"><span className="font-mono text-[#a85142]">01</span><span>Can the store carry the required WIC food package with dependable fresh and staple inventory?</span></li>
                  <li className="flex gap-2"><span className="font-mono text-[#a85142]">02</span><span>Does the modeled route reflect how families actually travel, including terrain and transportation constraints?</span></li>
                  <li className="flex gap-2"><span className="font-mono text-[#a85142]">03</span><span>Are the ZIP-level estimates and current authorization records current enough for outreach?</span></li>
                </ul>
                <div className="mt-6 border-t border-[#cfc8a6] pt-4 text-[10px] uppercase tracking-[.1em] text-[#765d18]">Next step · validate top tier with regional teams</div>
              </div>
            </section>

            <footer className="flex flex-col gap-2 border-t border-border pt-4 text-[10px] leading-relaxed text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span><strong className="text-foreground">Fieldline / WV Vendor Map</strong> · West Virginia WIC pilot briefing</span><span className="flex items-center gap-2 font-mono uppercase tracking-[.1em]"><CircleAlert size={12} /> Provisional · workbook analysis · verify before publication</span>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}