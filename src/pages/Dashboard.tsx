import { useState, useEffect, FormEvent } from "react";
import { Loader2, PackageSearch, Clock, CheckCircle, FileText, MapPin, Plus, Edit2, ChevronRight, ArrowLeft, QrCode, Download, Users, CreditCard, Search, Send, MessageSquare, LayoutGrid, TrendingUp, Calendar, ChevronDown, Info } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { generateBagQrLabelPdf } from "../utils/pdf";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../firebase";
import { 
  collection, getDocs, getDoc, setDoc, updateDoc, doc, query, where, orderBy, limit 
} from "firebase/firestore";

const getDeliveryDayDescription = (deliveryTypeStr: string) => {
  const type = (deliveryTypeStr || 'Est\u00e1ndar').toLowerCase();
  // Express/expr\u00e9s/24h -> 1 day. Standard/est\u00e1ndar/48h -> 2 days.
  const daysToAdd = type.includes('24') || type.includes('expr') || type.includes('express') ? 1 : 2;
  
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);
  
  const daysOfWeek = [
    'Domingo', 'Lunes', 'Martes', 'Mi\u00e9rcoles', 'Jueves', 'Viernes', 'S\u00e1bado'
  ];
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  
  const dayName = daysOfWeek[deliveryDate.getDay()];
  const dayNum = deliveryDate.getDate();
  const monthName = months[deliveryDate.getMonth()];
  
  return `${dayName}, ${dayNum} de ${monthName}`;
};

const formatBagId = (id: string) => {
  if (!id) return '';
  // Convert "BOLSA-001" -> "Bolsa-001" and "SMS-124" -> "Sms-124" for friendly, non-all-caps rendering
  return id.replace(/^(bolsa|sms)/i, (match) => {
    return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
  });
};

// Helper to compute statistics changes compared to previous cycle and return absolute dynamic metrics
const getMetricsForRange = (
  ordersList: any[],
  customersList: any[],
  bagsList: any[],
  range: '7d' | '4w' | '6m' | 'all'
) => {
  const now = new Date();
  
  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date(2026, 0, 1);
    const safeStr = dateStr.includes(' ') ? dateStr.replace(' ', 'T') : dateStr;
    try {
      return new Date(safeStr);
    } catch (e) {
      return new Date();
    }
  };

  let currentPeriodStart = new Date();
  let previousPeriodStart = new Date();
  let periodLengthMs = 0;

  if (range === '7d') {
    periodLengthMs = 7 * 24 * 60 * 60 * 1000;
    currentPeriodStart = new Date(now.getTime() - periodLengthMs);
    previousPeriodStart = new Date(currentPeriodStart.getTime() - periodLengthMs);
  } else if (range === '4w') {
    periodLengthMs = 28 * 24 * 60 * 60 * 1000;
    currentPeriodStart = new Date(now.getTime() - periodLengthMs);
    previousPeriodStart = new Date(currentPeriodStart.getTime() - periodLengthMs);
  } else if (range === '6m') {
    periodLengthMs = 180 * 24 * 60 * 60 * 1000;
    currentPeriodStart = new Date(now.getTime() - periodLengthMs);
    previousPeriodStart = new Date(currentPeriodStart.getTime() - periodLengthMs);
  } else {
    periodLengthMs = 30 * 24 * 60 * 60 * 1000;
    currentPeriodStart = new Date(now.getTime() - periodLengthMs);
    previousPeriodStart = new Date(currentPeriodStart.getTime() - periodLengthMs);
  }

  const getTrend = (curr: number, prev: number) => {
    const diff = curr - prev;
    let percent = 0;
    if (prev > 0) {
      percent = Math.round((diff / prev) * 100);
    } else if (curr > 0) {
      percent = 100;
    }
    return {
      diff,
      percent,
      isPositive: diff >= 0
    };
  };

  const ordersInRange = range === 'all' ? ordersList : ordersList.filter(o => parseDate(o.createdAt) >= currentPeriodStart);
  const previousOrdersInRange = range === 'all' ? [] : ordersList.filter(o => {
    const d = parseDate(o.createdAt);
    return d >= previousPeriodStart && d < currentPeriodStart;
  });

  // 1. Active orders
  const curActive = ordersInRange.filter(o => o.status === 'pending' || o.status === 'processing').length;
  const prevActive = range === 'all'
    ? ordersList.filter(o => parseDate(o.createdAt) < currentPeriodStart && (o.status === 'pending' || o.status === 'processing')).length
    : previousOrdersInRange.filter(o => o.status === 'pending' || o.status === 'processing').length;

  // 2. Completed orders
  const curCompleted = ordersInRange.filter(o => o.status === 'completed').length;
  const prevCompleted = range === 'all'
    ? ordersList.filter(o => parseDate(o.createdAt) < currentPeriodStart && o.status === 'completed').length
    : previousOrdersInRange.filter(o => o.status === 'completed').length;

  // 3. Revenue
  const curRevenue = curCompleted * 150;
  const prevRevenue = prevCompleted * 150;

  // 4. Bags in rotation (linked to orders in date range)
  let currentBags = 0;
  if (range === 'all') {
    currentBags = bagsList.filter(b => b.status === 'assigned').length;
  } else {
    currentBags = new Set(ordersInRange.map(o => o.bagId).filter(Boolean)).size;
  }
  
  let prevBags = 0;
  if (range === 'all') {
    prevBags = bagsList.filter(b => b.status === 'assigned').length;
  } else {
    prevBags = new Set(previousOrdersInRange.map(o => o.bagId).filter(Boolean)).size;
  }

  // 5. Customer sign ups
  const curCustomersList = range === 'all' ? customersList : customersList.filter(c => parseDate(c.createdAt) >= currentPeriodStart);
  const prevCustomersInRange = range === 'all' ? [] : customersList.filter(c => {
    const d = parseDate(c.createdAt);
    return d >= previousPeriodStart && d < currentPeriodStart;
  });

  const curCusts = curCustomersList.length;
  const prevCusts = range === 'all'
    ? customersList.filter(c => parseDate(c.createdAt) < currentPeriodStart).length
    : prevCustomersInRange.length;

  // 6. Kilos carga procesada (assuming 5 kg of processed laundry per completed standard bag)
  const curKilos = Math.round(curCompleted * 5 * 10) / 10;
  const prevKilos = Math.round(prevCompleted * 5 * 10) / 10;

  // 7. Recurrent customers
  const getCustId = (o: any) => o.userPhone || o.userName;
  let curRecurrent = 0;
  let prevRecurrent = 0;

  if (range === 'all') {
    const counts: Record<string, number> = {};
    ordersList.forEach(o => {
      const cid = getCustId(o);
      if (cid) counts[cid] = (counts[cid] || 0) + 1;
    });
    curRecurrent = Object.values(counts).filter(c => c >= 2).length;

    const prevCounts: Record<string, number> = {};
    const previousOrders = ordersList.filter(o => parseDate(o.createdAt) < currentPeriodStart);
    previousOrders.forEach(o => {
      const cid = getCustId(o);
      if (cid) prevCounts[cid] = (prevCounts[cid] || 0) + 1;
    });
    prevRecurrent = Object.values(prevCounts).filter(c => c >= 2).length;
  } else {
    const currentCustIdsInPeriod = new Set(ordersInRange.map(getCustId));
    curRecurrent = Array.from(currentCustIdsInPeriod).filter(cid => {
      if (!cid) return false;
      return ordersList.some(o => getCustId(o) === cid && parseDate(o.createdAt) < currentPeriodStart);
    }).length;

    const prevCustIdsInPeriod = new Set(previousOrdersInRange.map(getCustId));
    prevRecurrent = Array.from(prevCustIdsInPeriod).filter(cid => {
      if (!cid) return false;
      return ordersList.some(o => getCustId(o) === cid && parseDate(o.createdAt) < previousPeriodStart);
    }).length;
  }

  let estandar = 0;
  let express = 0;
  let otros = 0;

  ordersInRange.forEach((o: any) => {
    const type = (o.deliveryType || 'Estándar').toLowerCase();
    if (type.includes('express') || type.includes('expr') || type.includes('24')) {
      express++;
    } else if (type.includes('est') || type.includes('stand') || type.includes('48') || type === 'estándar' || type === 'estandar') {
      estandar++;
    } else {
      otros++;
    }
  });

  const completedOrdersInRange = ordersInRange.filter(o => o.status === 'completed');
  const userCompletedCounts: Record<string, number> = {};
  
  completedOrdersInRange.forEach(o => {
    const cid = o.userId || o.userPhone || o.userName;
    if (cid) {
      userCompletedCounts[cid] = (userCompletedCounts[cid] || 0) + 1;
    }
  });

  let habitual = 0;
  let ocasional = 0;
  let enRiesgo = 0;

  // We should evaluate all registered customers to find those with 0 orders ("en riesgo").
  customersList.forEach(c => {
    // Try to match the customer using the same fields we used for the orders
    const cid = c.id || c.phone || c.name;
    const count = userCompletedCounts[cid] || userCompletedCounts[c.phone] || userCompletedCounts[c.name] || 0;

    if (count >= 2) {
      habitual++;
    } else if (count === 1) {
      ocasional++;
    } else {
      enRiesgo++;
    }
  });

  const activeCustIds = new Set(ordersInRange.map(getCustId).filter(Boolean));
  const activeCustomersCount = activeCustIds.size;
  const promedio = activeCustomersCount > 0 ? (ordersInRange.length / activeCustomersCount) : 0;

  return {
    active: { value: curActive, trend: getTrend(curActive, prevActive) },
    completed: { value: curCompleted, trend: getTrend(curCompleted, prevCompleted) },
    revenue: { value: curRevenue, trend: getTrend(curRevenue, prevRevenue) },
    bags: { value: currentBags, trend: getTrend(currentBags, prevBags) },
    customers: { value: range === 'all' ? customersList.length : curCusts, trend: getTrend(curCusts, prevCusts) },
    kilos: { value: curKilos, trend: getTrend(curKilos, prevKilos) },
    recurrent: { value: curRecurrent, trend: getTrend(curRecurrent, prevRecurrent) },
    servicePreferences: { estandar, express, otros },
    customerFrequency: { habitual, ocasional, enRiesgo, promedio, ordersCount: ordersInRange.length, activeCount: activeCustomersCount }
  };
};

interface ServicePreferenceChartProps {
  preferences: {
    estandar: number;
    express: number;
    otros: number;
  };
}

function ServicePreferenceChart({ preferences }: ServicePreferenceChartProps) {
  const { estandar, express, otros } = preferences;
  const total = estandar + express + otros;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-none border border-dashed border-slate-200">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke="#e2e8f0"
              strokeWidth="8"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-sm font-bold text-slate-400">0</span>
            <span className="text-[7px] uppercase font-bold text-slate-400 font-mono tracking-wider">Servicios</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-4 font-medium">No hay suficiente información en este período</p>
      </div>
    );
  }

  const estPct = (estandar / total) * 100;
  const expPct = (express / total) * 100;
  const otrPct = (otros / total) * 100;

  // Let's use radius = 38. Circumference = 2 * Math.PI * 38 = 238.76
  const r = 38;
  const circ = 2 * Math.PI * r;

  // Estandar Segment
  const estOffset = 0;
  const estDash = (estPct / 100) * circ;

  // Express Segment
  const expOffset = estDash;
  const expDash = (expPct / 100) * circ;

  // Otros Segment
  const otrOffset = estDash + expDash;
  const otrDash = (otrPct / 100) * circ;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
      {/* SVG Donut Center */}
      <div className="sm:col-span-4 flex justify-center">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
            {/* Background Base Ring */}
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="transparent"
              stroke="#f8fafc"
              strokeWidth="10"
            />
            
            {/* Estándar Segment (Blue) */}
            {estandar > 0 && (
              <circle
                cx="50"
                cy="50"
                r={r}
                fill="transparent"
                stroke="#3771e7"
                strokeWidth="10"
                strokeDasharray={`${estDash} ${circ - estDash}`}
                strokeDashoffset={-estOffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            )}

            {/* Express Segment (Emerald) */}
            {express > 0 && (
              <circle
                cx="50"
                cy="50"
                r={r}
                fill="transparent"
                stroke="#10b981"
                strokeWidth="10"
                strokeDasharray={`${expDash} ${circ - expDash}`}
                strokeDashoffset={-expOffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            )}

            {/* Otros Segment (Amber) */}
            {otros > 0 && (
              <circle
                cx="50"
                cy="50"
                r={r}
                fill="transparent"
                stroke="#f59e0b"
                strokeWidth="10"
                strokeDasharray={`${otrDash} ${circ - otrDash}`}
                strokeDashoffset={-otrOffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            )}
          </svg>

          {/* Central Summary Text */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-xl font-black text-slate-800 leading-none">{total}</span>
            <span className="text-[7px] uppercase font-bold text-slate-400 mt-0.5 font-mono tracking-widest">Servicios</span>
          </div>
        </div>
      </div>

      {/* Legend & Details */}
      <div className="sm:col-span-8 space-y-2">
        {/* Estándar progress & stats */}
        <div className="space-y-0.5">
          <div className="flex justify-between items-baseline">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-xs bg-[#3771e7] block shrink-0" />
              <span className="text-xs font-bold text-slate-700">Estándar (48 h)</span>
            </div>
            <div className="text-right font-mono text-xs font-semibold text-slate-500">
              {estandar} <span className="text-[10px] text-slate-400">({Math.round(estPct)}%)</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-xs overflow-hidden">
            <div className="bg-[#3771e7] h-full transition-all duration-500" style={{ width: `${estPct}%` }} />
          </div>
        </div>

        {/* Express progress & stats */}
        <div className="space-y-0.5">
          <div className="flex justify-between items-baseline">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-xs bg-[#10b981] block shrink-0" />
              <span className="text-xs font-bold text-slate-700">
                Express (24 h)
              </span>
            </div>
            <div className="text-right font-mono text-xs font-semibold text-slate-500">
              {express} <span className="text-[10px] text-slate-400">({Math.round(expPct)}%)</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-xs overflow-hidden">
            <div className="bg-[#10b981] h-full transition-all duration-500" style={{ width: `${expPct}%` }} />
          </div>
        </div>

        {/* Otros progress & stats (only if > 0) */}
        {otros > 0 && (
          <div className="space-y-0.5">
            <div className="flex justify-between items-baseline">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-[#f59e0b] block shrink-0" />
                <span className="text-xs font-bold text-slate-700">Otros / Personalizado</span>
              </div>
              <div className="text-right font-mono text-xs font-semibold text-slate-500">
                {otros} <span className="text-[10px] text-slate-400">({Math.round(otrPct)}%)</span>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-xs overflow-hidden">
              <div className="bg-[#f59e0b] h-full transition-all duration-500" style={{ width: `${otrPct}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface CustomerFrequencyChartProps {
  frequency: {
    habitual: number;
    ocasional: number;
    enRiesgo: number;
    promedio: number;
    ordersCount: number;
    activeCount: number;
  };
  range?: '7d' | '4w' | '6m' | 'all';
}

function CustomerFrequencyChart({ frequency, range = '7d' }: CustomerFrequencyChartProps) {
  const { habitual, ocasional, enRiesgo, promedio, ordersCount, activeCount } = frequency;
  const total = habitual + ocasional + enRiesgo;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-none border border-dashed border-slate-200">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#e2e8f0" strokeWidth="8" />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-sm font-bold text-slate-400">0</span>
            <span className="text-[7px] uppercase font-bold text-slate-400 font-mono tracking-wider">Clientes</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-4 font-medium">No hay suficiente información en este período</p>
      </div>
    );
  }

  const r = 38;
  const circ = 2 * Math.PI * r;

  const habPct = (habitual / total) * 100;
  const ocaPct = (ocasional / total) * 100;
  const enRPct = (enRiesgo / total) * 100;

  const habOffset = 0;
  const habDash = (habPct / 100) * circ;

  const ocaOffset = habDash;
  const ocaDash = (ocaPct / 100) * circ;

  const enROffset = habDash + ocaDash;
  const enRDash = (enRPct / 100) * circ;

  const getFrequencyUnitLabel = () => {
    switch (range) {
      case '7d':
        return 'pedidos/semana por cliente';
      case '4w':
        return 'pedidos/mes por cliente';
      case '6m':
        return 'pedidos/6 meses por cliente';
      default:
        return 'pedidos/período por cliente';
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        <div className="sm:col-span-4 flex justify-center">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
              <circle cx="50" cy="50" r={r} fill="transparent" stroke="#f8fafc" strokeWidth="10" />
              
              {habitual > 0 && (
                <circle cx="50" cy="50" r={r} fill="transparent" stroke="#10b981" strokeWidth="10" strokeDasharray={`${habDash} ${circ - habDash}`} strokeDashoffset={-habOffset} strokeLinecap="round" className="transition-all duration-500 ease-out" />
              )}
              {ocasional > 0 && (
                <circle cx="50" cy="50" r={r} fill="transparent" stroke="#f59e0b" strokeWidth="10" strokeDasharray={`${ocaDash} ${circ - ocaDash}`} strokeDashoffset={-ocaOffset} strokeLinecap="round" className="transition-all duration-500 ease-out" />
              )}
              {enRiesgo > 0 && (
                <circle cx="50" cy="50" r={r} fill="transparent" stroke="#f43f5e" strokeWidth="10" strokeDasharray={`${enRDash} ${circ - enRDash}`} strokeDashoffset={-enROffset} strokeLinecap="round" className="transition-all duration-500 ease-out" />
              )}
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xl font-black text-slate-800 leading-none">{total}</span>
              <span className="text-[7px] uppercase font-bold text-slate-400 mt-0.5 font-mono tracking-widest">Clientes</span>
            </div>
          </div>
        </div>

        <div className="sm:col-span-8 space-y-2">
          <div className="space-y-0.5">
            <div className="flex justify-between items-baseline">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-[#10b981] block shrink-0" />
                <span className="text-xs font-bold text-slate-700">Habituales</span>
              </div>
              <div className="text-right font-mono text-xs font-semibold text-slate-500">
                {habitual} <span className="text-[10px] text-slate-400">({Math.round(habPct)}%)</span>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-xs overflow-hidden">
              <div className="bg-[#10b981] h-full transition-all duration-500" style={{ width: `${habPct}%` }} />
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="flex justify-between items-baseline">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-[#f59e0b] block shrink-0" />
                <span className="text-xs font-bold text-slate-700">Ocasionales</span>
              </div>
              <div className="text-right font-mono text-xs font-semibold text-slate-500">
                {ocasional} <span className="text-[10px] text-slate-400">({Math.round(ocaPct)}%)</span>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-xs overflow-hidden">
              <div className="bg-[#f59e0b] h-full transition-all duration-500" style={{ width: `${ocaPct}%` }} />
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="flex justify-between items-baseline">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-[#f43f5e] block shrink-0" />
                <span className="text-xs font-bold text-slate-700">Ausentes</span>
              </div>
              <div className="text-right font-mono text-xs font-semibold text-slate-500">
                {enRiesgo} <span className="text-[10px] text-slate-400">({Math.round(enRPct)}%)</span>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-xs overflow-hidden">
              <div className="bg-[#f43f5e] h-full transition-all duration-500" style={{ width: `${enRPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2.5 mt-2 border-t border-slate-100/70 flex justify-between items-baseline font-sans">
        <div className="text-left animate-fade-in">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block">
            Promedio de pedidos por cliente
          </span>
        </div>
        <div className="text-right font-mono text-xs font-semibold text-slate-600">
          {promedio.toFixed(1)}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'general' | 'orders' | 'locations' | 'qrcodes' | 'customers'>('general');
  const [orders, setOrders] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [bags, setBags] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorObj, setErrorObj] = useState<string | null>(null);

  // Analytics & Trend Chart state
  const [timeRange, setTimeRange] = useState<'7d' | '4w' | '6m' | 'all'>('7d');
  const [metricType, setMetricType] = useState<'orders' | 'revenue'>('orders');
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);

  // Orders Filter and Search State
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'processing' | 'completed'>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState("");

  // Customers Management State
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [activeFrequencyTooltip, setActiveFrequencyTooltip] = useState<string | null>(null);
  const [activeMetricTooltip, setActiveMetricTooltip] = useState<string | null>(null);
  const [loadingCustOrders, setLoadingCustOrders] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [adjustingCredits, setAdjustingCredits] = useState("");

  // Location Modal State
  const [showLocModal, setShowLocModal] = useState(false);
  const [editingLoc, setEditingLoc] = useState<any>(null);
  const [savingLoc, setSavingLoc] = useState(false);

  // QR creation state
  const [creatingBag, setCreatingBag] = useState(false);
  const [selectedQRBag, setSelectedQRBag] = useState<any>(null);

  // View specific location
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  // Order status update state
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });

      // Find the current order details before fetching fresh list
      const orderObj = orders.find(o => o.id === orderId);
      await fetchData();

      if (newStatus === "completed" && orderObj) {
        // Pre-calculate suggested delivery day based on delivery preference & deliveryType
        const suggestedDay = getDeliveryDayDescription(orderObj.deliveryType || orderObj.deliveryPreference);
        const timeInput = orderObj.preferredTime || "17:00 - 19:00";
        const dCalle = orderObj.addressCalle || "";
        const dColonia = orderObj.addressColonia || "";
        const locationPart = dCalle ? `${dCalle}${dColonia ? `, Col. ${dColonia}` : ''}` : "Mostrador / Recoger presencial";

        const message = `\u00A1Hola, *${orderObj.userName}*! \u{1F9E7}\n\nTe comunicamos de *SOMOS lavander\u00EDa* que tu ropa de la *Bolsa ${orderObj.bagId}* (Orden *#${String(orderObj.id || '').padStart(4, '0')}*) ya est\u00E1 lista, limpia y doblada. \u{2705}\n\n\u{1F69A} *Programaci\u00F3n de Entrega:*\n\u{1F4C5} *D\u00EDa:* ${suggestedDay}\n\u{23F0} *Horario:* ${timeInput}\n\u{1F4CD} *Domicilio:* ${locationPart}\n\n\u00A1Muchas gracias por tu confianza! Si tienes alguna duda o necesitas cambiar el horario, av\u00EDsanos con un mensaje aqu\u00ED.`;
        
        let cleanPhone = (orderObj.userPhone || "").replace(/\D/g, "");
        // MX prefix support
        if (cleanPhone.length === 10) {
          cleanPhone = "52" + cleanPhone;
        }
        
        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, "_blank");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setErrorObj(null);
    try {
      // 1. Fetch collections from Firestore
      const [ordersSnap, locationsSnap, bagsSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, "orders")),
        getDocs(collection(db, "locations")),
        getDocs(collection(db, "bags")),
        getDocs(collection(db, "users"))
      ]);

      // 2. Map users/customers
      const usersList: any[] = [];
      const usersMap: Record<string, any> = {};
      usersSnap.forEach((snap) => {
        const u = snap.data();
        usersList.push(u);
        usersMap[u.id] = u;
      });

      // Sort users by name ASC
      usersList.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

      // 3. Map orders
      const rawOrdersList: any[] = [];
      ordersSnap.forEach((snap) => {
        rawOrdersList.push(snap.data());
      });

      // Sort orders by createdAt DESC
      rawOrdersList.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      const ordersData = rawOrdersList.map((ord) => {
        const u = ord.userId ? usersMap[ord.userId] : null;
        return {
          id: ord.id,
          userId: ord.userId,
          bagId: ord.bagId,
          status: ord.status,
          createdAt: ord.createdAt,
          deliveryType: ord.deliveryType,
          userName: u ? (u.name || "") : "Usuario no encontrado",
          userPhone: u ? (u.phone || "") : "",
          deliveryPreference: u ? (u.deliveryPreference || "") : "",
          addressCalle: u ? (u.addressCalle || "") : "",
          addressColonia: u ? (u.addressColonia || "") : "",
          preferredTime: u ? (u.preferredTime || "") : ""
        };
      });

      // 4. Map active geolocated branch locations
      const locationsData: any[] = [];
      locationsSnap.forEach((snap) => {
        const data = snap.data();
        if (data.isActive === 1 || data.isActive === true) {
          locationsData.push(data);
        }
      });

      // 5. Map bags with assigned owners
      const rawBagsList: any[] = [];
      bagsSnap.forEach((snap) => {
        rawBagsList.push(snap.data());
      });

      // Sort bags alphabetically by id
      rawBagsList.sort((a, b) => (a.id || "").localeCompare(b.id || ""));

      const bagsData = rawBagsList.map((bag) => {
        const u = bag.userId ? usersMap[bag.userId] : null;
        return {
          id: bag.id,
          status: bag.status,
          userId: bag.userId,
          userName: u ? (u.name || "") : ""
        };
      });

      // 6. Map customers with calculated transaction counts
      const customersData = usersList.map((u) => {
        let orderCount = 0;
        let activeOrderCount = 0;
        rawOrdersList.forEach((ord) => {
          if (ord.userId === u.id) {
            orderCount++;
            if (ord.status !== "completed") {
              activeOrderCount++;
            }
          }
        });

        return {
          ...u,
          orderCount,
          activeOrderCount
        };
      });

      setOrders(ordersData);
      setLocations(locationsData);
      setBags(bagsData);
      setCustomers(customersData);
    } catch (err: any) {
      console.error("Direct Firestore fetching failed on dashboard:", err);
      setErrorObj(err.message || 'Error de conexión');
      
      // Attempt using cached lists or default to empty on extreme failure
      setOrders(prev => prev || []);
      setLocations(prev => prev || []);
      setBags(prev => prev || []);
      setCustomers(prev => prev || []);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBag = async () => {
    setCreatingBag(true);
    try {
      const bagsSnap = await getDocs(collection(db, "bags"));
      let nextNum = bagsSnap.size + 1;
      let bagId = `BOLSA-${nextNum.toString().padStart(3, "0")}`;

      while (true) {
        const checkSnap = await getDoc(doc(db, "bags", bagId));
        if (!checkSnap.exists()) {
          break;
        }
        nextNum++;
        bagId = `BOLSA-${nextNum.toString().padStart(3, "0")}`;
      }

      await setDoc(doc(db, "bags", bagId), { id: bagId, status: "unassigned", userId: null });
      await fetchData();
    } catch (err) {
      console.error("Failed to create bag client-side in Firestore:", err);
    } finally {
      setCreatingBag(false);
    }
  };

  const handleSaveLocation = async (e: FormEvent) => {
    e.preventDefault();
    setSavingLoc(true);
    try {
      const { id, name, address, isActive } = editingLoc;
      if (id) {
        await updateDoc(doc(db, "locations", id), {
          name,
          address: address || null,
          isActive: isActive ? 1 : 0
        });
      } else {
        const newId = "loc_" + Date.now();
        await setDoc(doc(db, "locations", newId), {
          id: newId,
          name,
          address: address || null,
          isActive: isActive !== false ? 1 : 0
        });
      }
      setShowLocModal(false);
      await fetchData();
    } catch (err) {
      console.error("Failed to save location client-side in Firestore:", err);
    } finally {
      setSavingLoc(false);
    }
  };

  const handleExportBagLabelPdf = (bagId: string) => {
    const canvas = document.getElementById("qr-canvas-hidden") as HTMLCanvasElement;
    if (canvas) {
      const qrData = canvas.toDataURL("image/png");
      generateBagQrLabelPdf(bagId, qrData);
    }
  };

  const handleSelectCustomer = async (cust: any) => {
    setSelectedCustomer(cust);
    setLoadingCustOrders(true);
    try {
      const ordersSnap = await getDocs(collection(db, "orders"));
      const customerOrdersList: any[] = [];
      ordersSnap.forEach((oSnap) => {
        const o = oSnap.data();
        if (o.userId === cust.id) {
          customerOrdersList.push(o);
        }
      });

      // Sort by createdAt DESC
      customerOrdersList.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setCustomerOrders(customerOrdersList);
    } catch (err) {
      console.error("Failed to fetch customer orders client-side in Firestore:", err);
    } finally {
      setLoadingCustOrders(false);
    }
  };

  const handleSaveCustomerDetails = async (custDetails: any) => {
    setSavingCustomer(true);
    try {
      const { id, name, phone, deliveryPreference, addressColonia, addressCalle, addressNumero, preferredTime, addressReferences, credits } = custDetails;
      await updateDoc(doc(db, "users", id), {
        name,
        phone,
        deliveryPreference: deliveryPreference || "Estándar (48 h)",
        addressColonia: addressColonia || null,
        addressCalle: addressCalle || null,
        addressNumero: addressNumero || null,
        preferredTime: preferredTime || "",
        addressReferences: addressReferences || "",
        credits: credits !== undefined ? Number(credits) : 0
      });
      await fetchData(); // Refresh references and balances
      // Keep selected user with fresh updated values
      setSelectedCustomer(custDetails);
      setEditingCustomer(null);
    } catch (err) {
      console.error("Failed to save customer details client-side in Firestore:", err);
    } finally {
      setSavingCustomer(false);
    }
  };

  const filteredCustomers = customers.filter(cust => {
    const query = searchQuery.toLowerCase();
    return (cust.name || "").toLowerCase().includes(query) || (cust.phone || "").includes(query);
  });

  // Pre-calculate dynamic statistics for the dashboard metric cards based on the selected timeRange
  const metrics = getMetricsForRange(orders, customers, bags, timeRange);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-500">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col py-4 animate-in fade-in">
      {errorObj && (
        <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm">
          {errorObj}. Mostrando caché.
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-medium tracking-widest text-gray-900 uppercase">Administración</h1>
      </div>

      <div className="flex space-x-2 bg-gray-100/50 p-1 rounded-xl mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'general' 
              ? 'bg-white text-blue-700 shadow-sm border border-gray-200/50' 
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          General
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'orders' 
              ? 'bg-white text-blue-700 shadow-sm border border-gray-200/50' 
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          Órdenes
        </button>
        <button
          onClick={() => { setActiveTab('customers'); setSelectedCustomer(null); }}
          className={`px-4 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'customers' 
              ? 'bg-white text-blue-700 shadow-sm border border-gray-200/50' 
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
          }`}
        >
          <Users className="w-4 h-4" />
          Clientes
        </button>
        <button
          onClick={() => setActiveTab('locations')}
          className={`px-4 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'locations' 
              ? 'bg-white text-blue-700 shadow-sm border border-gray-200/50' 
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Puntos de Recolección
        </button>
        <button
          onClick={() => setActiveTab('qrcodes')}
          className={`px-4 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'qrcodes' 
              ? 'bg-white text-blue-700 shadow-sm border border-gray-200/50' 
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
          }`}
        >
          <QrCode className="w-4 h-4" />
          Gestión de Bolsas
        </button>
      </div>

      <div className="min-h-[420px] flex flex-col justify-start">
        <AnimatePresence mode="wait">
          {activeTab === 'general' && (
            <motion.div
              key="general"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="space-y-6 w-full text-left"
            >
              {/* Selector de Plazo de Tiempo como filtro compacto desplegable */}
              <div className="flex justify-end pt-1 pb-1">
                <div className="relative">
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as '7d' | '4w' | '6m' | 'all')}
                    className="appearance-none bg-white border border-gray-200 px-3 py-1.5 pr-8 rounded-lg text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs leading-none"
                  >
                    <option value="7d">Últimos 7 Días</option>
                    <option value="4w">Últimos 4 Semanas</option>
                    <option value="6m">Últimos 6 Meses</option>
                    <option value="all">Histórico Completo</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Dynamic stats cards responsive grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Metric 2: Completadas */}
                <div 
                  className="relative bg-white border border-gray-100 p-4 shadow-sm text-left flex flex-col justify-between min-h-[6.5rem] rounded-none cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setActiveMetricTooltip(activeMetricTooltip === 'completed' ? null : 'completed')}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Órdenes completadas</span>
                    <Info className={`w-3 h-3 transition-colors ${activeMetricTooltip === 'completed' ? 'text-blue-500' : 'text-slate-300'}`} />
                  </div>
                  <div className="mt-2 flex flex-col justify-end">
                    <span className="text-2xl font-black text-slate-900 leading-none">
                      {metrics.completed.value}
                    </span>
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-xs border ${
                        metrics.completed.trend.isPositive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {metrics.completed.trend.isPositive ? '▲' : '▼'} {metrics.completed.trend.percent}%
                      </span>
                    </div>
                  </div>
                  {activeMetricTooltip === 'completed' && (
                    <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-slate-800 p-2 shadow-lg border border-slate-700">
                      <p className="text-[10px] text-white leading-tight">Total de órdenes con estado "Completado" en el período seleccionado.</p>
                    </div>
                  )}
                </div>

                {/* Metric 2.5: Kilos Carga Procesada */}
                <div 
                  className="relative bg-white border border-gray-100 p-4 shadow-sm text-left flex flex-col justify-between min-h-[6.5rem] rounded-none cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setActiveMetricTooltip(activeMetricTooltip === 'kilos' ? null : 'kilos')}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Kilos procesados</span>
                    <Info className={`w-3 h-3 transition-colors ${activeMetricTooltip === 'kilos' ? 'text-blue-500' : 'text-slate-300'}`} />
                  </div>
                  <div className="mt-2 flex flex-col justify-end">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900 leading-none">
                        {metrics.kilos.value.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-500 font-semibold font-mono">
                        KG
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-xs border ${
                        metrics.kilos.trend.isPositive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {metrics.kilos.trend.isPositive ? '▲' : '▼'} {metrics.kilos.trend.percent}%
                      </span>
                    </div>
                  </div>
                  {activeMetricTooltip === 'kilos' && (
                    <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-slate-800 p-2 shadow-lg border border-slate-700">
                      <p className="text-[10px] text-white leading-tight">Equivalente estimado basado en órdenes completadas.</p>
                    </div>
                  )}
                </div>

                {/* Metric 3: Ingresos Est. */}
                <div 
                  className="relative bg-white border border-gray-100 p-4 shadow-sm text-left flex flex-col justify-between min-h-[6.5rem] rounded-none cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setActiveMetricTooltip(activeMetricTooltip === 'revenue' ? null : 'revenue')}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Ingresos</span>
                    <Info className={`w-3 h-3 transition-colors ${activeMetricTooltip === 'revenue' ? 'text-blue-500' : 'text-slate-300'}`} />
                  </div>
                  <div className="mt-2 flex flex-col justify-end">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-[#0f55d8] leading-none">
                        ${metrics.revenue.value.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-500 font-semibold font-mono">
                        MXN
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-xs border ${
                        metrics.revenue.trend.isPositive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {metrics.revenue.trend.isPositive ? '▲' : '▼'} {metrics.revenue.trend.percent}%
                      </span>
                    </div>
                  </div>
                  {activeMetricTooltip === 'revenue' && (
                    <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-slate-800 p-2 shadow-lg border border-slate-700">
                      <p className="text-[10px] text-white leading-tight">Valor monetario generado por las órdenes completadas.</p>
                    </div>
                  )}
                </div>

                {/* Metric 4: Bolsas Asignadas */}
                <div 
                  className="relative bg-white border border-gray-100 p-4 shadow-sm text-left flex flex-col justify-between min-h-[6.5rem] rounded-none cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setActiveMetricTooltip(activeMetricTooltip === 'bags' ? null : 'bags')}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Bolsas asignadas</span>
                    <Info className={`w-3 h-3 transition-colors ${activeMetricTooltip === 'bags' ? 'text-blue-500' : 'text-slate-300'}`} />
                  </div>
                  <div className="mt-2 flex flex-col justify-end">
                    <span className="text-2xl font-black text-slate-900 leading-none">
                      {metrics.bags.value}
                    </span>
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-xs border ${
                        metrics.bags.trend.isPositive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {metrics.bags.trend.isPositive ? '▲' : '▼'} {metrics.bags.trend.percent}%
                      </span>
                    </div>
                  </div>
                  {activeMetricTooltip === 'bags' && (
                    <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-slate-800 p-2 shadow-lg border border-slate-700">
                      <p className="text-[10px] text-white leading-tight">Bolsas actualmente en posesión de los clientes en este período o en general.</p>
                    </div>
                  )}
                </div>

                {/* Metric 5: Clientes */}
                <div 
                  className="relative bg-white border border-gray-100 p-4 shadow-sm text-left flex flex-col justify-between min-h-[6.5rem] rounded-none cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setActiveMetricTooltip(activeMetricTooltip === 'customers' ? null : 'customers')}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Clientes</span>
                    <Info className={`w-3 h-3 transition-colors ${activeMetricTooltip === 'customers' ? 'text-blue-500' : 'text-slate-300'}`} />
                  </div>
                  <div className="mt-2 flex flex-col justify-end">
                    <span className="text-2xl font-black text-slate-900 leading-none">
                      {metrics.customers.value}
                    </span>
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-xs border ${
                        metrics.customers.trend.isPositive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {metrics.customers.trend.isPositive ? '▲' : '▼'} {metrics.customers.trend.percent}%
                      </span>
                    </div>
                  </div>
                  {activeMetricTooltip === 'customers' && (
                    <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-slate-800 p-2 shadow-lg border border-slate-700">
                      <p className="text-[10px] text-white leading-tight">Nuevos clientes registrados vs el período anterior.</p>
                    </div>
                  )}
                </div>

                {/* Metric 6: Clientes Recurrentes */}
                <div 
                  className="relative bg-white border border-gray-100 p-4 shadow-sm text-left flex flex-col justify-between min-h-[6.5rem] rounded-none cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setActiveMetricTooltip(activeMetricTooltip === 'recurrentes' ? null : 'recurrentes')}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Recurrentes</span>
                    <Info className={`w-3 h-3 transition-colors ${activeMetricTooltip === 'recurrentes' ? 'text-blue-500' : 'text-slate-300'}`} />
                  </div>
                  <div className="mt-2 flex flex-col justify-end">
                    <span className="text-2xl font-black text-slate-900 leading-none">
                      {metrics.recurrent.value}
                    </span>
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-xs border ${
                        metrics.recurrent.trend.isPositive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {metrics.recurrent.trend.isPositive ? '▲' : '▼'} {metrics.recurrent.trend.percent}%
                      </span>
                    </div>
                  </div>
                  {activeMetricTooltip === 'recurrentes' && (
                    <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-slate-800 p-2 shadow-lg border border-slate-700">
                      <p className="text-[10px] text-white leading-tight">Clientes que han completado 2 o más órdenes.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                {/* Gráfico circular de preferencias de servicio */}
                <div 
                  className="relative bg-white border border-gray-100 px-5 py-3 shadow-sm rounded-none text-left flex flex-col justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setActiveMetricTooltip(activeMetricTooltip === 'services' ? null : 'services')}
                >
                  <div>
                    <div className="border-b border-gray-100 pb-1.5 mb-2.5 flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 text-[11px] uppercase font-mono tracking-wider">
                        Preferencias de Servicio
                      </h3>
                      <div className={`flex items-center gap-1 transition-colors ${activeMetricTooltip === 'services' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-600'}`}>
                        <span className="text-[9px] uppercase font-bold tracking-wider">Detalles</span>
                        <Info className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                  {activeMetricTooltip === 'services' && (
                    <div className="absolute z-10 left-5 right-5 top-12 mt-1 bg-slate-800 p-2 shadow-lg border border-slate-700">
                      <p className="text-[10px] text-white leading-tight">Distribución de los servicios completados según la preferencia de entrega en el período.</p>
                    </div>
                  )}
                  <div className="mt-2 w-full flex-1 flex flex-col justify-center">
                    <ServicePreferenceChart preferences={metrics.servicePreferences} />
                  </div>
                </div>

                {/* Cliente Frecuencia Frecuencia de Pedidos por Cliente */}
                <div 
                  className="relative bg-white border border-gray-100 px-5 py-3 shadow-sm rounded-none text-left flex flex-col justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setActiveMetricTooltip(activeMetricTooltip === 'frequencies' ? null : 'frequencies')}
                >
                  <div>
                    <div className="border-b border-gray-100 pb-1.5 mb-2.5 flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 text-[11px] uppercase font-mono tracking-wider">
                        Frecuencia de Pedidos
                      </h3>
                      <div className={`flex items-center gap-1 transition-colors ${activeMetricTooltip === 'frequencies' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-600'}`}>
                        <span className="text-[9px] uppercase font-bold tracking-wider">Detalles</span>
                        <Info className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                  {activeMetricTooltip === 'frequencies' && (
                    <div className="absolute z-10 left-5 right-5 top-12 mt-1 bg-slate-800 p-2 shadow-lg border border-slate-700">
                      <p className="text-[10px] text-white leading-tight">Clasificación de clientes según las órdenes completadas en este período.</p>
                    </div>
                  )}
                  <div className="mt-2 w-full flex-1 flex flex-col justify-center">
                    <CustomerFrequencyChart frequency={metrics.customerFrequency} range={timeRange} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'orders' && (() => {
            const countAll = orders.length;
            const countPending = orders.filter(o => o.status === 'pending').length;
            const countProcessing = orders.filter(o => o.status === 'processing').length;
            const countCompleted = orders.filter(o => o.status === 'completed').length;

            const filteredOrders = orders.filter(o => {
              const matchesFilter = orderFilter === 'all' || o.status === orderFilter;
              const matchesSearch = 
                (o.userName || "").toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                (o.id || "").toString().includes(orderSearchQuery) ||
                (o.bagId || "").toLowerCase().includes(orderSearchQuery.toLowerCase());
              return matchesFilter && matchesSearch;
            });

            return (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className="space-y-4 w-full"
              >
                {/* Selector de Estado como filtro compacto a la derecha sin tarjeta completa */}
                <div className="flex justify-end pt-1 pb-1">
                  <div className="relative">
                    <select
                      value={orderFilter}
                      onChange={(e) => setOrderFilter(e.target.value as any)}
                      className="appearance-none bg-white border border-gray-200 px-3 py-1.5 pr-8 rounded-lg text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs leading-none"
                    >
                      <option value="all">Todas ({countAll})</option>
                      <option value="pending">Pendientes ({countPending})</option>
                      <option value="processing">Procesando ({countProcessing})</option>
                      <option value="completed">Completadas ({countCompleted})</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-gray-400 space-y-4 py-16 bg-white border border-gray-100 rounded-none">
                    <PackageSearch className="w-12 h-12 opacity-20" />
                    <p className="text-sm">No se encontraron órdenes con estos filtros.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOrders.map((o) => (
                      <div 
                        key={o.id} 
                        className="p-4 bg-white hover:bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm transition-all rounded-none border border-slate-100 shadow-sm text-left"
                      >
                        <div className="space-y-2 text-left w-full sm:w-auto">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pb-0.5">
                            <p className="font-bold text-slate-800 text-[14px]">{o.userName}</p>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                                Orden #{String(o.id || '').padStart(4, '0')}
                              </span>
                              <div className="relative">
                                <select
                                  value={o.status}
                                  onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                  disabled={updatingOrderId === o.id}
                                  className={`text-[10px] uppercase font-bold px-2 py-0.5 pr-5.5 rounded-full border cursor-pointer appearance-none outline-none transition-all shadow-sm ${
                                    o.status === 'completed'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50'
                                      : o.status === 'processing'
                                      ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100/50'
                                      : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/50'
                                  }`}
                                >
                                  <option value="pending">● Pendiente</option>
                                  <option value="processing">● Procesando</option>
                                  <option value="completed">● Completada</option>
                                </select>
                                <div className={`pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-[7px] ${
                                  o.status === 'completed' ? 'text-emerald-500' : o.status === 'processing' ? 'text-sky-500' : 'text-amber-500'
                                }`}>
                                  ▼
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-slate-500 font-medium flex flex-wrap gap-x-3 gap-y-1">
                            <span><strong className="text-slate-600">Bolsa:</strong> {formatBagId(o.bagId)}</span>
                            <span className="text-slate-300">•</span>
                            <span translate="no" className="notranslate"><strong className="text-slate-600">Plan:</strong> {o.deliveryType || 'Estándar'}</span>
                          </div>
                        </div>
                        
                        <div className="text-left sm:text-right flex sm:flex-col justify-between sm:justify-center items-baseline sm:items-end gap-x-2 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0 mt-1 sm:mt-0 pct-100 shrink-0">
                          <span className="text-slate-550 font-mono text-xs">
                            {new Date(o.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })()}

          {activeTab === 'locations' && !selectedLocation && (
            <motion.div
              key="locations-list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="space-y-4 w-full"
            >
              <div className="flex justify-between items-center bg-white border border-gray-100 rounded-none p-4 shadow-sm">
                <div>
                  <h3 className="font-semibold text-gray-900 text-left">Sucursales Activas</h3>
                  <p className="text-xs text-gray-500 text-left">Administra los puntos de recolección</p>
                </div>
                <button
                  onClick={() => { setEditingLoc({ name: '', address: '', isActive: true }); setShowLocModal(true); }}
                  className="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  <Plus className="w-4 h-4" />
                  <span className="inline">Nuevo Punto</span>
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {locations.map((loc) => (
                  <div 
                    key={loc.id} 
                    className="bg-white border text-left border-gray-100 rounded-none p-4 shadow-sm flex items-center justify-between cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group"
                    onClick={() => setSelectedLocation(loc)}
                  >
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        {loc.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">{loc.address}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingLoc(loc); setShowLocModal(true); }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors ml-2" />
                    </div>
                  </div>
                ))}
              </div>

              {showLocModal && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                  <div className="bg-white rounded-none w-full max-w-md p-6 animate-in slide-in-from-bottom flex flex-col items-stretch text-left">
                    <h2 className="text-xl font-bold mb-4">{editingLoc?.id ? 'Editar Punto' : 'Nuevo Punto de Recolección'}</h2>
                    <form onSubmit={handleSaveLocation} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Nombre</label>
                        <input
                          required
                          type="text"
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm"
                          value={editingLoc?.name || ''}
                          onChange={(e) => setEditingLoc({ ...editingLoc, name: e.target.value })}
                          placeholder="Ej. Sucursal Roma"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Dirección</label>
                        <input
                          required
                          type="text"
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm"
                          value={editingLoc?.address || ''}
                          onChange={(e) => setEditingLoc({ ...editingLoc, address: e.target.value })}
                          placeholder="Ej. Álvaro Obregón 123"
                        />
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <label className="text-sm font-medium text-gray-700">Punto Activo</label>
                        <input
                          type="checkbox"
                          checked={editingLoc?.isActive === true || editingLoc?.isActive === 1}
                          onChange={(e) => setEditingLoc({ ...editingLoc, isActive: e.target.checked })}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowLocModal(false)}
                          className="flex-1 p-4 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={savingLoc}
                          className="flex-1 p-4 rounded-xl font-bold bg-[#0f55d8] text-white hover:bg-[#0d4bc0] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {savingLoc && <Loader2 className="w-4 h-4 animate-spin" />}
                          Guardar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'locations' && selectedLocation && (
            <motion.div
              key="location-detail"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="space-y-4 w-full"
            >
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    {selectedLocation.name}
                  </h3>
                  <p className="text-xs text-gray-500">{selectedLocation.address}</p>
                </div>
              </div>
              
              <div className="bg-white border border-gray-100 rounded-none p-5 shadow-sm space-y-4">
                <h4 className="font-medium text-sm text-gray-700 border-b border-gray-50 pb-2 text-left">
                  Órdenes en esta ubicación (Simulado)
                </h4>
                
                {orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-gray-400 space-y-4 py-8">
                    <PackageSearch className="w-10 h-10 opacity-20" />
                    <p className="text-sm">No hay órdenes registradas.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                     {orders.map((o) => (
                      <div key={o.id} className="card p-3 flex flex-col sm:flex-row sm:items-center justify-between border border-gray-100 bg-gray-50/50 rounded-none gap-4">
                        <div className="space-y-1 text-left">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 text-sm">{o.userName}</p>
                            <div className="relative">
                              <select
                                value={o.status}
                                onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                disabled={updatingOrderId === o.id}
                                className={`text-[10px] font-bold border px-1.5 py-0.5 pr-5.5 rounded tracking-wide capitalize cursor-pointer appearance-none outline-none transition-all shadow-sm ${
                                  o.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50'
                                    : o.status === 'processing'
                                    ? 'bg-sky-50 text-sky-700 border-sky-100 hover:bg-sky-100/50'
                                    : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100/50'
                                }`}
                              >
                                <option value="pending">⏳ Pendiente</option>
                                <option value="processing">⚙️ Procesando</option>
                                <option value="completed">✅ Completado</option>
                              </select>
                              <div className={`pointer-events-none absolute inset-y-0 right-1 flex items-center text-[7px] ${
                                o.status === 'completed' ? 'text-emerald-500' : o.status === 'processing' ? 'text-sky-500' : 'text-amber-500'
                              }`}>
                                ▼
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                            <span>{o.bagId}</span>
                            <span>•</span>
                            <span>{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>•</span>
                            <span translate="no" className="notranslate">{o.deliveryType || 'Estándar'}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 self-start sm:self-auto">
                          <span className="text-xs text-gray-400 font-mono">
                            Orden #{String(o.id || '').padStart(4, '0')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'qrcodes' && (
            <motion.div
              key="qrcodes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="space-y-6 pb-12 w-full"
            >
              <div className="flex justify-between items-center bg-white border border-gray-100 rounded-none p-4 shadow-sm">
                <div>
                  <h3 className="font-semibold text-gray-900 text-left">Generador de QR para Bolsas</h3>
                  <p className="text-xs text-gray-500 text-left">Imprime los siguientes códigos para pegarlos en las bolsas físicas.</p>
                </div>
                <button
                  onClick={handleCreateBag}
                  disabled={creatingBag}
                  className="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50 flex-shrink-0 ml-4"
                >
                  {creatingBag ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span className="inline">Nueva Bolsa</span>
                </button>
              </div>

              <div className="bg-white border border-gray-100 rounded-none p-5 shadow-sm space-y-4">
                <h4 className="font-medium text-gray-800 text-left border-b border-gray-100 pb-2">Bolsas Sin Asignar</h4>
                {bags.filter(b => b.status === "unassigned").length === 0 ? (
                  <p className="text-sm text-gray-400 text-left py-4">No hay bolsas sin asignar.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-2">
                    {bags.filter(b => b.status === "unassigned").map((bag) => {
                      const qrUrl = `${window.location.origin}/bolsa/${bag.id}`;
                      return (
                        <div key={bag.id} onClick={() => setSelectedQRBag(bag)} className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-none bg-gray-50 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-200">
                          <div className="p-2 bg-white rounded-none shadow-sm mb-2 pointer-events-none">
                            <QRCodeSVG value={qrUrl} size={80} />
                          </div>
                          <span className="font-mono text-xs font-semibold text-gray-800">{bag.id}</span>
                          <span className="text-[10px] text-gray-500 mt-1 uppercase">Sin Asignar</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-100 rounded-none p-5 shadow-sm space-y-4">
                <h4 className="font-medium text-gray-800 text-left border-b border-gray-100 pb-2">Bolsas Asignadas</h4>
                {bags.filter(b => b.status === "assigned").length === 0 ? (
                  <p className="text-sm text-gray-400 text-left py-4">No hay bolsas asignadas a órdenes actualmente.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-2 cursor-pointer">
                    {bags.filter(b => b.status === "assigned").map((bag) => {
                      const qrUrl = `${window.location.origin}/bolsa/${bag.id}`;
                      return (
                        <div key={bag.id} onClick={() => setSelectedQRBag(bag)} className="flex flex-col items-center justify-center p-4 border border-blue-50 rounded-none bg-blue-50/30 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-200">
                          <div className="p-2 bg-white rounded-none shadow-sm mb-2 pointer-events-none">
                            <QRCodeSVG value={qrUrl} size={80} />
                          </div>
                          <span className="font-mono text-xs font-semibold text-gray-800">{bag.id}</span>
                          <span className="text-[10px] text-blue-600 mt-1 uppercase font-medium">Asignada</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'customers' && !selectedCustomer && (
            <motion.div
              key="customers-list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="space-y-4 w-full"
            >


              {/* Table / Cards container */}
              {filteredCustomers.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-gray-400 py-12 bg-white border border-gray-100">
                  <Users className="w-12 h-12 opacity-25 mb-3" />
                  <p className="text-sm">No se encontraron clientes.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCustomers.map((cust) => (
                    <div 
                      key={cust.id} 
                      onClick={() => handleSelectCustomer(cust)}
                      className="group p-4 bg-white hover:bg-slate-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm transition-all rounded-xl border border-slate-100 shadow-sm hover:shadow-md cursor-pointer text-left"
                    >
                      {/* Left: Monogram and Client info */}
                      <div className="flex items-center gap-3.5 text-left w-full sm:flex-1 min-w-0">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-slate-50 border border-slate-150/75 flex items-center justify-center font-bold text-slate-600 text-xs tracking-wider select-none transition-colors group-hover:bg-white group-hover:border-slate-200">
                          {cust.name ? cust.name.substring(0, 2).toUpperCase() : "CL"}
                        </div>
                        <div className="space-y-1 text-left min-w-0 flex-1">
                          <p className="font-bold text-slate-800 text-[14px] leading-tight tracking-tight truncate">
                            {cust.name}
                          </p>
                          <div className="flex items-start gap-1.5 text-xs text-slate-500 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="text-slate-600 break-words leading-normal">
                              {cust.addressCalle ? (
                                `${cust.addressCalle} ${cust.addressNumero || ""} ${cust.addressColonia ? `• Col. ${cust.addressColonia}` : ""}`
                              ) : (
                                <span className="text-slate-400 italic font-normal">Mostrador / Entrega en sucursal</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Interactive CTA element */}
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 select-none pt-2 sm:pt-0 border-t sm:border-0 border-slate-100/50 w-full sm:w-auto justify-end">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-md transition-colors group-hover:bg-slate-100/60 group-hover:text-slate-700 font-mono">
                          VER HISTORIAL
                        </span>
                        <div className="p-1.5 rounded-full border border-slate-100 bg-slate-50 text-slate-400 transition-all duration-200 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900">
                          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'customers' && selectedCustomer && (
            <motion.div
              key="customer-detail"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="space-y-6 w-full text-left pb-10"
            >
              {/* Back button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <span className="text-[9px] uppercase font-bold text-blue-600 font-mono tracking-wider">Historial de Cliente</span>
                  <h3 className="font-semibold text-lg text-gray-905 leading-none">
                    {selectedCustomer.name}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* LEFT COLUMN: Profile details, saved refs & credits adjustment */}
                <div className="md:col-span-5 space-y-6">
                  {/* Profile Address */}
                  <div className="bg-white border border-gray-100 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <h4 className="font-semibold text-xs text-gray-500 uppercase tracking-widest font-mono">Datos de Cliente</h4>
                      <button
                        onClick={() => setEditingCustomer(selectedCustomer)}
                        className="text-xs font-bold text-[#0f55d8] hover:text-blue-800 flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        Editar Datos
                      </button>
                    </div>
                    <div className="space-y-3 text-[13px] text-slate-700">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 font-mono block">Contacto:</span>
                        <span className="font-mono text-gray-900 font-medium">{selectedCustomer.phone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 font-mono block">Calle y cruzamientos:</span>
                        <span className="text-gray-900 font-bold">{selectedCustomer.addressCalle || 'Sin calle registrada'}</span>
                        <span className="text-gray-500 block text-xs mt-0.5">Colonia: {selectedCustomer.addressColonia || 'Mostrador / General'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 font-mono block">Preferencia de Entrega:</span>
                        <span 
                          translate="no" 
                          className={`notranslate ${selectedCustomer.orderCount === 0 ? "text-gray-400 italic text-xs block font-medium" : "text-gray-950 font-semibold"}`}
                        >
                          {selectedCustomer.orderCount === 0 ? 'No seleccionada aún (Pendiente de visita al punto)' : (selectedCustomer.deliveryPreference || 'Estándar (48 h)')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 font-mono block">Horario de Entrega:</span>
                        <span className={selectedCustomer.orderCount === 0 ? "text-gray-400 italic text-xs block font-medium" : "text-gray-950 font-semibold"}>
                          {selectedCustomer.orderCount === 0 ? 'No especificado (Pendiente de visita al punto)' : (selectedCustomer.preferredTime || 'No especificado')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: History list */}
                <div className="md:col-span-7 bg-white border border-gray-100 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h4 className="font-semibold text-xs text-gray-700 uppercase tracking-wider font-mono">
                      Historial de Órdenes ({customerOrders.length})
                    </h4>
                  </div>
                  
                  {loadingCustOrders ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                  ) : customerOrders.length === 0 ? (
                    <div className="text-center text-gray-400 py-12 italic text-sm">
                      Este cliente no tiene órdenes registradas aún.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customerOrders.map((o) => (
                        <div 
                          key={o.id} 
                          className="p-4 border border-gray-150/80 bg-slate-50/50 hover:bg-slate-50/90 hover:border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm transition-all rounded-xl shadow-sm"
                        >
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                Orden #{String(o.id || '').padStart(4, '0')}
                              </span>
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                                o.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : o.status === 'processing'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {o.status === 'completed' ? '● Completada' : o.status === 'processing' ? '● Procesando' : '● Pendiente'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 font-medium flex flex-wrap gap-x-3 gap-y-1">
                              <span><strong className="text-slate-600">Bolsa:</strong> {formatBagId(o.bagId)}</span>
                              <span className="text-slate-300">•</span>
                              <span translate="no" className="notranslate"><strong className="text-slate-600">Plan:</strong> {o.deliveryType || 'Estándar'}</span>
                            </div>
                          </div>
                          <div className="text-left sm:text-right flex sm:flex-col justify-between sm:justify-center items-baseline sm:items-end gap-x-2 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0 mt-1 sm:mt-0">
                            <span className="text-slate-550 font-mono text-xs">
                              {new Date(o.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Editing Customer Modal */}
              {editingCustomer && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                  <div className="bg-white rounded-none w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 flex flex-col items-stretch text-left">
                    <h2 className="text-sm font-bold mb-4 font-mono uppercase tracking-widest text-slate-800">Editar Perfil de Cliente</h2>
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        await handleSaveCustomerDetails(editingCustomer);
                      }} 
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Nombre</label>
                        <input
                          required
                          type="text"
                          className="w-full px-3 py-2 border border-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-slate-50 focus:bg-white"
                          value={editingCustomer.name || ''}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Teléfono</label>
                        <input
                          required
                          type="text"
                          className="w-full px-3 py-2 border border-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-slate-50 focus:bg-white"
                          value={editingCustomer.phone || ''}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Calle y Número</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-slate-50 focus:bg-white"
                          value={editingCustomer.addressCalle || ''}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, addressCalle: e.target.value })}
                          placeholder=""
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Colonia</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-slate-50 focus:bg-white"
                          value={editingCustomer.addressColonia || ''}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, addressColonia: e.target.value })}
                          placeholder=""
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <button
                          type="button"
                          onClick={() => setEditingCustomer(null)}
                          className="flex-1 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={savingCustomer}
                          className="flex-1 py-2 rounded-xl bg-[#0f55d8] text-white hover:bg-[#0d4bc0] text-xs font-bold font-mono transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {savingCustomer && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Guardar Perfil
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {selectedQRBag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setSelectedQRBag(null)}>
          <div className="bg-white rounded-none w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center justify-center space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 font-mono tracking-tight">{selectedQRBag.id}</h2>
              <div className="p-6 bg-white border border-gray-100 rounded-none shadow-sm relative">
                <QRCodeSVG value={`${window.location.origin}/bolsa/${selectedQRBag.id}`} size={240} />
                {/* Hidden high-res canvas used for generating crisp PDF vector graphics */}
                <div style={{ display: "none" }}>
                  <QRCodeCanvas 
                    id="qr-canvas-hidden" 
                    value={`${window.location.origin}/bolsa/${selectedQRBag.id}`} 
                    size={400} 
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>
              <div className="flex flex-col items-center space-y-1">
                <span className={`text-sm font-medium uppercase tracking-wider ${selectedQRBag.status === 'assigned' ? 'text-blue-600' : 'text-gray-500'}`}>
                  {selectedQRBag.status === 'assigned' ? 'Asignada' : 'Sin Asignar'}
                </span>
                {selectedQRBag.status === 'assigned' ? (
                  <p className="text-sm font-semibold text-gray-800 text-center px-4">
                    {selectedQRBag.userName || 'Cliente Asignado'}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 text-center px-4">
                    Sin cliente asignado
                  </p>
                )}
              </div>
              
              <div className="w-full space-y-2 mt-4">
                <button
                  onClick={() => handleExportBagLabelPdf(selectedQRBag.id)}
                  className="w-full py-3 bg-[#0f55d8] text-white font-bold rounded-xl hover:bg-[#0d4bc0] transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md text-sm"
                >
                  <Download className="w-4 h-4" />
                  Descargar Etiqueta PDF
                </button>
                <button
                  onClick={() => setSelectedQRBag(null)}
                  className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors text-sm"
                  autoFocus
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
