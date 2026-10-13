'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, Code2, Globe2, Layers, Loader2, ShieldCheck } from 'lucide-react';
import type { AppCategory, OrbitApp } from '@/lib/types';
import { appIdPattern, networkName, networks, normalizeAppDomain, suggestAppId } from '@/lib/app-config';
import { AppIcon, Badge, CopyButton, Modal, api, type Workspace } from './ui';

const palette = [
  ['#157b72', 'Forest'], ['#8b79b7', 'Iris'], ['#d2934f', 'Amber'],
  ['#5f91ad', 'Sky'], ['#ae6c7d', 'Rose'], ['#7a8860', 'Olive'],
];

export function AppForm({ w, app, onClose }: { w: Workspace; app?: OrbitApp; onClose: () => void }) {
  const [form, setForm] = useState({ id: app?.id ?? '', name: app?.name ?? '', domain: app?.domain ?? '', category: app?.category ?? 'Other' as AppCategory, color: app?.color ?? palette[0][0], chainId: app?.chainId ?? 8453, description: app?.description ?? '', builderCode: app?.builderCode ?? '', archived: app?.archived ?? false });
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [customId, setCustomId] = useState(Boolean(app));
  const [customNetwork, setCustomNetwork] = useState(Boolean(app && !networks.some(n => n.id === app.chainId)));
  const [step, setStep] = useState<'details' | 'review' | 'success'>('details');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [created, setCreated] = useState<OrbitApp | null>(null);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (step !== 'details') stepHeading.current?.focus(); }, [step]);
  const id = app?.id ?? (customId ? form.id : suggestAppId(form.name, form.domain, w.apps.map(a => a.id)));
  let domain = ''; try { domain = normalizeAppDomain(form.domain); } catch { /* Inline validation appears on continue. */ }
  const preview: OrbitApp = { ...form, name: form.name.trim(), id, domain, createdAt: app?.createdAt ?? '' };
  const update = <K extends keyof typeof form>(key: K, value: typeof form[K]) => { setForm(f => ({ ...f, [key]: value })); setErrors(e => ({ ...e, [key]: '' })); setError(''); };
  const validate = () => {
    const issues: Record<string, string> = {};
    if (form.name.trim().length < 2) issues.name = 'Give your app a name with at least 2 characters.';
    try { normalizeAppDomain(form.domain); } catch (e) { issues.domain = e instanceof Error ? e.message : 'Enter a valid app URL.'; }
    if (!appIdPattern.test(id)) issues.id = 'Use 2–48 lowercase letters, numbers or hyphens, starting with a letter.';
    else if (!app && w.apps.some(a => a.id === id)) issues.id = 'This App ID is already in your workspace. Choose another one.';
    if (!Number.isInteger(form.chainId) || form.chainId < 1 || form.chainId > 2147483647) issues.chainId = 'Enter a valid positive EVM chain ID.';
    setErrors(issues); if (issues.id || issues.chainId) setAdvancedOpen(true);
    return !Object.keys(issues).length;
  };
  const openGuide = async () => {
    if (!created) return;
    setBusy(true); setError('');
    try { await w.reloadConfig(); w.setAppId(created.id); w.setView('Integration'); onClose(); }
    catch { setError('Your application is saved. We could not refresh the workspace yet. Try again in a moment.'); }
    finally { setBusy(false); }
  };
  return <Modal wide title={app ? 'Edit application' : 'Connect your next app'} description={app ? 'Keep your application details up to date.' : 'A few details now. A clearer picture of every interaction next.'} onClose={onClose} dismissible={!busy}>
    <form noValidate aria-label={app ? 'Edit application' : 'Connect application'} onSubmit={async e => {
      e.preventDefault(); if (busy || step === 'success') return;
      if (!validate()) { setStep('details'); return; }
      if (step === 'details') { setError(''); setStep('review'); return; }
      setBusy(true); setError('');
      try {
        await api('/api/apps', { method: app ? 'PATCH' : 'POST', body: JSON.stringify(preview) });
        if (app) { w.notify('Application updated.'); onClose(); try { await w.reloadConfig(); } catch { w.notify('Application saved. Refresh the workspace to see your changes.'); } }
        else { setCreated(preview); setStep('success'); w.notify('Application added to your workspace.'); try { await w.reloadConfig(); } catch { setError('Application saved. Open the integration guide to retry refreshing the workspace.'); } }
      } catch (e) { setError(e instanceof Error ? e.message : 'Could not save your application. Please try again.'); }
      finally { setBusy(false); }
    }}>
      {step !== 'success' ? <>
        <div className="connect-stepper" aria-label="Connection progress">{['App details', 'Review & finish'].map((label, i) => <span key={label} aria-current={(step === 'details' ? 0 : 1) === i ? 'step' : undefined} className={(step === 'details' ? 0 : 1) >= i ? 'current' : ''}><b>{i === 0 && step === 'review' ? <Check size={12} /> : i + 1}</b>{label}{i === 0 && <span className="stepper-line" />}</span>)}</div>
        <div className="connect-layout"><aside className="connect-aside"><div className="connect-aside-symbol"><Layers size={24} strokeWidth={1.4} /></div><span className="eyebrow">YOUR ECOSYSTEM</span><h3>Different apps.<br />One clear picture.</h3><p>Swaps, mints, forms and every meaningful action, together in your private workspace.</p><div className="connect-preview"><AppIcon app={preview} /><strong>{preview.name || 'Your application'}</strong><span>{domain || 'Your app domain'}</span><Badge>{networkName(form.chainId)}</Badge></div><div className="connect-assurance"><ShieldCheck size={16} /><span>Wallet identity only.<br />Thoughtful privacy defaults.</span></div></aside>
          <div className="connect-content">
            {step === 'details' ? <>
              <h3>Let’s start with your app.</h3><p className="connect-intro">Only a name and app URL are required. You can refine the rest below.</p>
              <label className="field" htmlFor="app-name">Application name<input id="app-name" autoFocus maxLength={60} placeholder="What is your app called?" autoComplete="off" value={form.name} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'app-name-error' : undefined} onChange={e => update('name', e.target.value)} />{errors.name && <small id="app-name-error" className="field-error">{errors.name}</small>}</label>
              <label className="field" htmlFor="app-url">App URL<div className="input-with-icon"><Globe2 size={16} /><input id="app-url" inputMode="url" maxLength={2048} placeholder="https://your-app.com" autoComplete="url" value={form.domain} aria-invalid={Boolean(errors.domain)} aria-describedby="app-url-hint" onChange={e => update('domain', e.target.value)} /></div><small id="app-url-hint" className={errors.domain ? 'field-error' : ''}>{errors.domain || (domain ? `We’ll store ${domain}. Paths and query strings are excluded.` : 'Paste your full URL or enter a domain. Only the domain is stored.')}</small></label>
              <div className="tracking-id-preview"><span><Code2 size={14} />Tracking ID</span><code>{id}</code><Badge>{app ? 'Fixed' : customId ? 'Custom' : 'Automatic'}</Badge></div>
              <details className="app-advanced" open={advancedOpen} onToggle={e => setAdvancedOpen(e.currentTarget.open)}><summary>Customize application<ChevronDown size={15} /></summary><div>
                <div className="form-grid"><label className="field">Category<select value={form.category} onChange={e => update('category', e.target.value as AppCategory)}>{['DeFi', 'Collectibles', 'Social', 'Commerce', 'Utility', 'Other'].map(c => <option key={c}>{c}</option>)}</select></label><label className="field">Network<select value={customNetwork ? 'custom' : String(form.chainId)} onChange={e => { const custom = e.target.value === 'custom'; setCustomNetwork(custom); if (!custom) update('chainId', Number(e.target.value)); }}>{networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}<option value="custom">Custom EVM network</option></select></label></div>
                {customNetwork && <label className="field">Custom chain ID<input type="number" min={1} max={2147483647} value={form.chainId || ''} onChange={e => update('chainId', Number(e.target.value))} aria-invalid={Boolean(errors.chainId)} />{errors.chainId && <small className="field-error">{errors.chainId}</small>}</label>}
                <label className="field">Tracking ID<input value={id} disabled={Boolean(app)} maxLength={48} spellCheck={false} autoComplete="off" aria-invalid={Boolean(errors.id)} onChange={e => { setCustomId(true); update('id', e.target.value.toLowerCase()); }} /><small className={errors.id ? 'field-error' : ''}>{errors.id || 'A permanent identifier used by your SDK.'}</small></label>
                {!app && customId && <button type="button" className="text-button" onClick={() => { setCustomId(false); setErrors(e => ({ ...e, id: '' })); }}>Use automatic ID</button>}
                <label className="field">Description <span className="optional">optional</span><input maxLength={240} placeholder="A short description of your app" value={form.description} onChange={e => update('description', e.target.value)} /></label>
                <label className="field">Builder Code <span className="optional">optional</span><input maxLength={100} placeholder="Your Base Builder Code" value={form.builderCode} onChange={e => update('builderCode', e.target.value)} /><small>Keep adding it to your onchain transactions as usual.</small></label>
                <fieldset className="palette"><legend>Application color</legend>{palette.map(([color, name]) => <button key={color} aria-label={name + ' app color'} aria-pressed={form.color === color} type="button" style={{ background: color }} className={form.color === color ? 'chosen' : ''} onClick={() => update('color', color)}>{form.color === color && <Check size={14} />}</button>)}</fieldset>
              </div></details>
            </> : <>
              <h3 ref={stepHeading} tabIndex={-1}>Everything look right?</h3><p className="connect-intro">Review the details before {app ? 'saving your changes' : 'adding your app to this workspace'}.</p>
              <div className="connect-review"><div><span>Application</span><strong>{preview.name}</strong></div><div><span>Domain</span><strong>{domain}</strong></div><div><span>Tracking ID</span><code>{id}</code></div><div><span>Category</span><strong>{form.category}</strong></div><div><span>Network</span><strong>{networkName(form.chainId)}</strong></div></div>
              {!app && <div className="connect-next"><Code2 size={19} /><div><strong>Next, add the SDK to your app.</strong><p>Your personalized guide will use this app’s ID and network. Events will appear after your integration sends them.</p></div></div>}
            </>}
            {error && <div className="form-error" role="alert">{error}{!w.config?.authenticated && <a href="/signin-with-chatgpt?return_to=/" target="_top">Sign in to your workspace</a>}</div>}
          </div></div>
        <div className="modal-footer connect-footer"><span><ShieldCheck size={14} />Private to your workspace</span><button type="button" className="button secondary" disabled={busy} onClick={() => step === 'review' ? setStep('details') : onClose()}>{step === 'review' ? <><ArrowLeft size={14} />Back</> : 'Cancel'}</button><button className="button primary" type="submit" disabled={busy}>{busy ? <><Loader2 size={15} className="spin" />Saving application…</> : step === 'details' ? <>Review application<ArrowRight size={15} /></> : app ? <>Save changes<Check size={15} /></> : <>Add application<ArrowRight size={15} /></>}</button></div>
      </> : <>
        <div className="connect-success"><span className="success-emblem"><CheckCircle2 size={32} strokeWidth={1.6} /></span><Badge tone="green">APPLICATION ADDED</Badge><h3 ref={stepHeading} tabIndex={-1}>{created?.name} is in your orbit.</h3><p>Your app is registered. Add the SDK and connect PostHog to start seeing real activity.</p><div className="success-app-id"><span>YOUR TRACKING ID</span><code>{created?.id}</code><CopyButton value={created?.id ?? ''} label="Copy ID" /></div><div className="success-next-steps"><div><b>1</b><span><strong>Open your integration guide</strong><small>Code tailored to your application.</small></span></div><div><b>2</b><span><strong>Configure PostHog and add the SDK</strong><small>One setup for all your apps.</small></span></div><div><b>3</b><span><strong>Watch your first events arrive</strong><small>Verify in PostHog, then refresh Orbit.</small></span></div></div>{error && <div className="form-error" role="alert">{error}</div>}</div>
        <div className="modal-footer"><button type="button" className="button secondary" disabled={busy} onClick={onClose}>Done for now</button><button type="button" className="button primary" disabled={busy} onClick={() => void openGuide()}>{busy ? <Loader2 size={15} className="spin" /> : <Code2 size={15} />}Open integration guide<ArrowRight size={15} /></button></div>
      </>}
    </form>
  </Modal>;
}
