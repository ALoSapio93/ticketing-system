import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StatsService } from '../../core/services/stats.service';
import { TicketService } from '../../core/services/ticket.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStats, Ticket, TicketStatus, TicketPriority } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="dashboard">
  <!-- Stats Grid -->
  <div class="stats-grid" *ngIf="stats">
    <div class="stat-card">
      <div class="stat-icon" style="background:#EEF2FF">📋</div>
      <div class="stat-info">
        <div class="stat-value">{{ stats.totalTickets }}</div>
        <div class="stat-label">Ticket Totali</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:#DBEAFE">🔵</div>
      <div class="stat-info">
        <div class="stat-value" style="color:var(--info)">{{ stats.openTickets }}</div>
        <div class="stat-label">Aperti</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:#FEF3C7">⚡</div>
      <div class="stat-info">
        <div class="stat-value" style="color:#D97706">{{ stats.inProgressTickets }}</div>
        <div class="stat-label">In Lavorazione</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:#D1FAE5">✅</div>
      <div class="stat-info">
        <div class="stat-value" style="color:var(--success)">{{ stats.resolvedTickets }}</div>
        <div class="stat-label">Risolti</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:#EDE9FE">🔥</div>
      <div class="stat-info">
        <div class="stat-value" style="color:var(--critical)">{{ stats.criticalOpen }}</div>
        <div class="stat-label">Critici Aperti</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:#FEE2E2">⏰</div>
      <div class="stat-info">
        <div class="stat-value" style="color:var(--danger)">{{ stats.overdueTickets }}</div>
        <div class="stat-label">Scaduti</div>
      </div>
    </div>
  </div>

  <!-- Charts Row -->
  <div class="charts-row">
    <!-- Status donut -->
    <div class="card chart-card">
      <h3 class="chart-title">Ticket per Stato</h3>
      <div class="donut-chart" *ngIf="stats">
        <svg viewBox="0 0 200 200" class="donut-svg">
          <ng-container *ngFor="let seg of statusSegments; let i=index">
            <circle cx="100" cy="100" r="70"
              [attr.stroke]="seg.color"
              stroke-width="28"
              fill="none"
              [attr.stroke-dasharray]="seg.dashArray"
              [attr.stroke-dashoffset]="seg.dashOffset"
              transform="rotate(-90 100 100)"/>
          </ng-container>
          <text x="100" y="105" text-anchor="middle" class="donut-center">
            {{ stats.totalTickets }}
          </text>
        </svg>
        <div class="donut-legend">
          <div class="legend-item" *ngFor="let s of statusSegments">
            <span class="legend-dot" [style.background]="s.color"></span>
            <span>{{ s.label }}: <strong>{{ s.value }}</strong></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Priority bar chart -->
    <div class="card chart-card">
      <h3 class="chart-title">Ticket Aperti per Priorità</h3>
      <div class="bar-chart" *ngIf="stats">
        <div class="bar-item" *ngFor="let p of priorityBars">
          <div class="bar-label">{{ p.label }}</div>
          <div class="bar-track">
            <div class="bar-fill" [style.width.%]="p.pct" [style.background]="p.color"></div>
          </div>
          <div class="bar-value">{{ p.value }}</div>
        </div>
      </div>
    </div>

    <!-- Type distribution -->
    <div class="card chart-card">
      <h3 class="chart-title">Distribuzione per Tipo</h3>
      <div class="type-list" *ngIf="stats">
        <div class="type-item" *ngFor="let t of typeItems">
          <span class="type-icon">{{ t.icon }}</span>
          <div class="type-info">
            <div class="type-name">{{ t.label }}</div>
            <div class="type-bar">
              <div class="type-fill" [style.width.%]="t.pct" [style.background]="t.color"></div>
            </div>
          </div>
          <span class="type-count">{{ t.value }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Trend -->
  <div class="card" style="margin-top:24px" *ngIf="stats && stats.trend.length">
    <h3 class="chart-title" style="margin-bottom:16px">Andamento Ultimi 30 Giorni</h3>
    <div class="trend-chart">
      <svg [attr.viewBox]="'0 0 ' + trendW + ' ' + trendH" class="trend-svg">
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#4F46E5" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#4F46E5" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path [attr.d]="trendArea" fill="url(#trendGrad)"/>
        <path [attr.d]="trendLine" fill="none" stroke="#4F46E5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <circle *ngFor="let p of trendPoints" [attr.cx]="p.x" [attr.cy]="p.y" r="4" fill="#4F46E5"/>
      </svg>
    </div>
  </div>

  <!-- Recent Tickets -->
  <div class="card" style="margin-top:24px">
    <div class="flex items-center justify-between" style="margin-bottom:16px">
      <h3 style="font-size:16px;font-weight:700">Ticket Recenti</h3>
      <a routerLink="/tickets" class="btn btn-ghost btn-sm">Vedi tutti →</a>
    </div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Numero</th><th>Titolo</th><th>Tipo</th>
            <th>Priorità</th><th>Stato</th><th>Reporter</th><th>Data</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let t of recentTickets" style="cursor:pointer" [routerLink]="['/tickets', t.id]">
            <td><code style="font-family:'JetBrains Mono',monospace;font-size:12px;background:var(--bg);padding:2px 6px;border-radius:4px">{{ t.ticketNumber }}</code></td>
            <td class="truncate" style="max-width:220px">{{ t.title }}</td>
            <td><span class="badge badge-type-{{t.type}}">{{ typeLabel(t.type) }}</span></td>
            <td><span class="badge badge-priority-{{t.priority}}">{{ priorityLabel(t.priority) }}</span></td>
            <td><span class="badge badge-status-{{t.status}}">{{ statusLabel(t.status) }}</span></td>
            <td>{{ t.reporter.fullName }}</td>
            <td class="text-muted text-sm">{{ t.createdAt | date:'dd/MM/yy' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div *ngIf="!recentTickets.length" class="empty-state">
      <div class="icon">🎫</div>
      <h3>Nessun ticket ancora</h3>
      <p>Crea il primo ticket per iniziare</p>
      <a routerLink="/tickets/new" class="btn btn-primary">Nuovo Ticket</a>
    </div>
  </div>

  <div *ngIf="loading" style="display:flex;justify-content:center;padding:60px">
    <div class="spinner"></div>
  </div>
</div>`,
  styles: [`
    .dashboard { display: flex; flex-direction: column; gap: 0; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .charts-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .chart-card { }
    .chart-title { font-size: 15px; font-weight: 700; margin-bottom: 20px; }

    .donut-chart { display: flex; align-items: center; gap: 20px; }
    .donut-svg { width: 140px; height: 140px; flex-shrink: 0; }
    .donut-center { font-size: 22px; font-weight: 800; fill: var(--text); }
    .donut-legend { display: flex; flex-direction: column; gap: 8px; font-size: 13px; }
    .legend-item { display: flex; align-items: center; gap: 8px; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

    .bar-chart { display: flex; flex-direction: column; gap: 16px; }
    .bar-item { display: grid; grid-template-columns: 80px 1fr 40px; align-items: center; gap: 10px; }
    .bar-label { font-size: 13px; font-weight: 600; }
    .bar-track { height: 8px; background: var(--bg); border-radius: 999px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 999px; transition: width .5s; }
    .bar-value { font-size: 14px; font-weight: 700; text-align: right; }

    .type-list { display: flex; flex-direction: column; gap: 12px; }
    .type-item { display: flex; align-items: center; gap: 10px; }
    .type-icon { font-size: 18px; width: 28px; text-align: center; }
    .type-info { flex: 1; }
    .type-name { font-size: 12px; font-weight: 600; margin-bottom: 4px; }
    .type-bar { height: 6px; background: var(--bg); border-radius: 999px; overflow: hidden; }
    .type-fill { height: 100%; border-radius: 999px; transition: width .5s; }
    .type-count { font-size: 14px; font-weight: 700; min-width: 28px; text-align: right; }

    .trend-chart { overflow: hidden; }
    .trend-svg { width: 100%; height: 120px; }

    @media (max-width: 900px) { .charts-row { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  recentTickets: Ticket[] = [];
  loading = true;

  trendW = 800; trendH = 120;
  trendLine = ''; trendArea = '';
  trendPoints: {x: number; y: number}[] = [];

  statusSegments: any[] = [];
  priorityBars: any[] = [];
  typeItems: any[] = [];

  constructor(
    private statsService: StatsService,
    private ticketService: TicketService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.statsService.getDashboard().subscribe({
      next: s => {
        this.stats = s;
        this.buildCharts(s);
        this.loading = false;
      },
      error: () => this.loading = false
    });

    this.ticketService.getTickets({ page: 0, size: 8, sortBy: 'createdAt', sortDir: 'desc' }).subscribe(p => {
      this.recentTickets = p.content;
    });
  }

  buildCharts(s: DashboardStats) {
    // Status donut
    const statusColors: Record<string, string> = {
      OPEN:'#3B82F6', IN_PROGRESS:'#F59E0B', PENDING:'#6B7280',
      RESOLVED:'#10B981', CLOSED:'#9CA3AF', REJECTED:'#EF4444'
    };
    const statusLabels: Record<string, string> = {
      OPEN:'Aperto', IN_PROGRESS:'In Lavorazione', PENDING:'In Attesa',
      RESOLVED:'Risolto', CLOSED:'Chiuso', REJECTED:'Rifiutato'
    };
    const total = s.totalTickets || 1;
    const circ = 2 * Math.PI * 70;
    let offset = 0;
    this.statusSegments = Object.entries(s.byStatus || {}).map(([k, v]) => {
      const pct = (v / total);
      const seg = { label: statusLabels[k] || k, value: v, color: statusColors[k] || '#ccc',
        dashArray: `${pct * circ} ${circ}`, dashOffset: -offset * circ };
      offset += pct;
      return seg;
    });

    // Priority bars
    const pColors: Record<string, string> = {
      LOW:'#10B981', MEDIUM:'#3B82F6', HIGH:'#F59E0B', CRITICAL:'#7C3AED'
    };
    const pLabels: Record<string, string> = { LOW:'Bassa', MEDIUM:'Media', HIGH:'Alta', CRITICAL:'Critica' };
    const maxP = Math.max(...Object.values(s.byPriority || {1: 1}), 1);
    this.priorityBars = Object.entries(s.byPriority || {}).map(([k, v]) => ({
      label: pLabels[k] || k, value: v, color: pColors[k] || '#ccc', pct: (v / maxP) * 100
    }));

    // Type items
    const tIcons: Record<string, string> = {
      BUG:'🐛', FEATURE_REQUEST:'✨', SUPPORT:'🆘', INCIDENT:'🚨', CHANGE_REQUEST:'🔄', TASK:'📌'
    };
    const tColors: Record<string, string> = {
      BUG:'#EF4444', FEATURE_REQUEST:'#3B82F6', SUPPORT:'#10B981',
      INCIDENT:'#7C3AED', CHANGE_REQUEST:'#F59E0B', TASK:'#6B7280'
    };
    const tLabels: Record<string, string> = {
      BUG:'Bug', FEATURE_REQUEST:'Feature', SUPPORT:'Supporto',
      INCIDENT:'Incidente', CHANGE_REQUEST:'Richiesta Modifica', TASK:'Task'
    };
    const maxT = Math.max(...Object.values(s.byType || {1: 1}), 1);
    this.typeItems = Object.entries(s.byType || {}).map(([k, v]) => ({
      label: tLabels[k] || k, value: v, icon: tIcons[k] || '📋',
      color: tColors[k] || '#ccc', pct: (v / maxT) * 100
    }));

    // Trend line
    if (s.trend && s.trend.length > 1) {
      const maxV = Math.max(...s.trend.map(t => t.count), 1);
      const pad = 10;
      this.trendPoints = s.trend.map((t, i) => ({
        x: pad + (i / (s.trend.length - 1)) * (this.trendW - 2 * pad),
        y: this.trendH - pad - ((t.count / maxV) * (this.trendH - 2 * pad))
      }));
      this.trendLine = this.trendPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
      const areaClose = `L${this.trendPoints[this.trendPoints.length-1].x},${this.trendH} L${this.trendPoints[0].x},${this.trendH} Z`;
      this.trendArea = this.trendLine + ' ' + areaClose;
    }
  }

  typeLabel(t: string): string {
    const m: Record<string, string> = { BUG:'Bug', FEATURE_REQUEST:'Feature', SUPPORT:'Supporto', INCIDENT:'Incidente', CHANGE_REQUEST:'Modifica', TASK:'Task' };
    return m[t] || t;
  }
  statusLabel(s: string): string {
    const m: Record<string, string> = { OPEN:'Aperto', IN_PROGRESS:'In Lavorazione', PENDING:'In Attesa', RESOLVED:'Risolto', CLOSED:'Chiuso', REJECTED:'Rifiutato' };
    return m[s] || s;
  }
  priorityLabel(p: string): string {
    const m: Record<string, string> = { LOW:'Bassa', MEDIUM:'Media', HIGH:'Alta', CRITICAL:'Critica' };
    return m[p] || p;
  }
}
