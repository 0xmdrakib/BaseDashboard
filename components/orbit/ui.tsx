'use client';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X, Copy, Check, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, Inbox, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { OrbitApp, OrbitEvent, ConfigResponse, DataResponse } from '@/lib/types';
import { toCsv } from '@/lib/analytics';
export type View = 'Overview' | 'Apps' | 'Events' | 'Transactions' | 'Funnels' | 'Retention' | 'Acquisition' | 'Integration' | 'Settings';
export type Workspace = { apps: OrbitApp[]; events: OrbitEvent[]; allEvents: OrbitEvent[]; previous: OrbitEvent[]; days: number; appId: string; config: ConfigResponse | null; data: DataResponse | null; loading: boolean; setView: (v: View) => void; setAppId: (id: string) => void; reloadConfig: () => Promise<void>; refresh: () => Promise<void>; notify: (message: string) => void; onAddApp: () => void; };
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) { return <section className={`card ${className}`}>{children}</section>; }
export function CardHead({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) { return <div className="card-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>; }
export function AppIcon({ app, small = false }: { app?: OrbitApp; small?: boolean }) { return <span className={`app-icon ${small ? 'small' : ''}`} style={{ background: (app?.color ?? '#157b72') + '14', color: app?.color ?? '#157b72' }}>{[...(app?.name.trim() || 'O')][0]}<span className="app-icon-orbit" /></span>; }
export function AppName({ id, apps }: { id: string; apps: OrbitApp[] }) { const app = apps.find(a => a.id === id); return <span className="app-name"><AppIcon app={app} small /><span>{app?.name ?? id}</span></span>; }
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'green' | 'orange' | 'red' | 'blue' }) { return <span className={`badge ${tone}`}>{children}</span>; }
export function Delta({ value }: { value: number | null }) { return <span className={`delta ${value === null || value >= 0 ? 'positive' : 'negative'}`}>{value === null ? 'New' : <>{value >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{Math.abs(value).toFixed(1)}%</>}</span>; }
export function Empty({ title = 'No activity yet', description = 'Events will appear here after you connect an app.', action }: { title?: string; description?: string; action?: ReactNode }) { return <div className="empty-state"><span className="empty-icon"><Inbox size={25} /></span><h3>{title}</h3><p>{description}</p>{action}</div>; }
export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return <button type="button" className="button small secondary" aria-live="polite" title={state === 'failed' ? 'Clipboard is unavailable. Select the text and copy it manually.' : undefined} onClick={async () => {
    if (timer.current) clearTimeout(timer.current);
    try { await navigator.clipboard.writeText(value); setState('copied'); } catch { setState('failed'); }
    timer.current = setTimeout(() => setState('idle'), 2500);
  }}>{state === 'copied' ? <Check size={14} /> : <Copy size={14} />}{state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy unavailable' : label}</button>;
}
export function CodeBlock({ code, label }: { code: string; label?: string }) { return <div className="code-block"><div className="code-top"><span>{label ?? 'TypeScript'}</span><CopyButton value={code} /></div><pre><code>{code}</code></pre></div>; }
export function Modal({ title, description, children, onClose, wide = false, dismissible = true }: { title: string; description?: string; children: ReactNode; onClose: () => void; wide?: boolean; dismissible?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId(); const descriptionId = useId();
  useEffect(() => { const d = dialog.current; d?.showModal(); d?.querySelector<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled])')?.focus(); return () => { if (d?.open) d.close(); }; }, []);
  return <dialog ref={dialog} className={`modal ${wide ? 'wide' : ''}`} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} onCancel={e => { e.preventDefault(); if (dismissible) onClose(); }} onClick={e => { if (dismissible && e.target === dialog.current) onClose(); }}><div className="modal-head"><div><h2 id={titleId}>{title}</h2>{description && <p id={descriptionId}>{description}</p>}</div><button type="button" className="icon-button" disabled={!dismissible} aria-label="Close dialog" onClick={onClose}><X size={20} /></button></div>{children}</dialog>;
}
export function Pagination({ page, count, size, onPage }: { page: number; count: number; size: number; onPage: (p: number) => void }) { const pages = Math.max(1, Math.ceil(count / size)); return <div className="pagination"><span>{count ? `${page * size + 1}–${Math.min((page + 1) * size, count)}` : '0'} of {count.toLocaleString()} results</span><div><button className="icon-button" disabled={page === 0} aria-label="Previous page" onClick={() => onPage(page - 1)}><ChevronLeft size={16} /></button><span>{page + 1} / {pages}</span><button className="icon-button" disabled={page + 1 >= pages} aria-label="Next page" onClick={() => onPage(page + 1)}><ChevronRight size={16} /></button></div></div>; }
export function downloadCsv(filename: string, rows: Record<string, unknown>[]) { const blob = new Blob(['\uFEFF' + toCsv(rows)], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export async function api<T>(path: string, options?: RequestInit): Promise<T> { const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } }); if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('The server is temporarily unavailable. Please refresh and try again.'); const body: unknown = await response.json(); if (!response.ok) throw new Error(body && typeof body === 'object' && 'error' in body ? String(body.error) : 'Request failed. Please try again.'); return body as T; }
export function SubmitButton({ busy, children }: { busy: boolean; children: ReactNode }) { return <button className="button primary" type="submit" disabled={busy}>{busy && <Loader2 size={15} className="spin" />}{children}</button>; }
export function timeAgo(timestamp: string) { const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(timestamp)) / 1000)); if (seconds < 60) return `${seconds}s ago`; if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`; if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`; return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }); }
