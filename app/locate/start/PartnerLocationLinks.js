'use client';

import { useEffect, useState } from 'react';

export default function PartnerLocationLinks() {
  const [number, setNumber] = useState('');
  const [locale, setLocale] = useState('en');
  const [copied, setCopied] = useState(false);
  const digits = number.replace(/\D/g, '');
  const phone = digits.length === 10 ? '+1' + digits : (digits.length === 11 && digits.startsWith('1') ? '+' + digits : '');
  const [previewOrigin, setPreviewOrigin] = useState('');
  useEffect(() => { setPreviewOrigin(window.location.origin); }, []);
  const suffix = phone ? '/locate?to=' + encodeURIComponent(phone) + (locale === 'es' ? '&lang=es' : '') : '';
  const isPreview = previewOrigin && previewOrigin !== 'https://www.towtruckondemand.com';
  // Use the preview hostname already approved in Google Cloud for the Maps browser key.
  const approvedPreviewOrigin = 'https://tow-truck-on-demand-7vcwj3nhi-towing.vercel.app';
  const url = phone ? (isPreview ? approvedPreviewOrigin : 'https://www.towtruckondemand.com') + suffix : '';
  const previewUrl = isPreview ? url : '';

  async function copy() {
    if (!url) return;
    try { await navigator.clipboard.writeText(url); setCopied(true); } catch { setCopied(false); }
  }

  return (
    <main style={{ padding: '30px 16px' }}>
      <section style={{ maxWidth: 520, margin: '0 auto', background: '#fff', padding: 26, borderRadius: 18, border: '1px solid #e5eaf0' }}>
        <strong style={{ color: '#075fe6' }}>TowTruckOnDemand · Partner tool</strong>
        <h1 style={{ fontSize: 28 }}>Create your location link</h1>
        <p style={{ lineHeight: 1.5, color: '#536072' }}>Enter the mobile number where you want customers to text their location. Keep the resulting link for future calls and send it from your regular messaging app.</p>
        <label htmlFor="partnerPhone">Your mobile number (US)</label>
        <input id="partnerPhone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(817) 555-0123" value={number} onChange={e => { setNumber(e.target.value); setCopied(false); }} />
        <label htmlFor="language">Customer page language</label>
        <select id="language" value={locale} onChange={e => { setLocale(e.target.value); setCopied(false); }}>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
        {url ? <div style={{ marginTop: 18, overflowWrap: 'anywhere' }}>
          <strong>{isPreview ? 'TEST customer link — use this for testing' : 'Customer link'}</strong>
          <p style={{ fontSize: 13, lineHeight: 1.5 }}>{url}</p>
          <button type="button" onClick={copy} style={{ width: '100%', padding: 14, background: '#075fe6', border: 0, borderRadius: 10, color: 'white', fontWeight: 800, cursor: 'pointer' }}>{copied ? 'Copied — paste into your SMS' : (isPreview ? 'Copy WORKING TEST link' : 'Copy customer link')}</button>
          {previewUrl && <div style={{ marginTop: 16, padding: 12, border: '1px solid #d4e2f7', borderRadius: 10, background: '#f3f8ff' }}>
            <strong style={{ fontSize: 13 }}>Testing only</strong>
            <p style={{ fontSize: 12, lineHeight: 1.5 }}>The blue Copy button now copies the working test link. It uses the Vercel test domain approved for Google Maps. Do not send a towtruckondemand.com/locate link until the feature is published to the live site.</p>
            <a href={previewUrl} target="_blank" rel="noreferrer" style={{ color: '#075fe6', overflowWrap: 'anywhere', fontSize: 13 }}>Open customer locator preview</a>
          </div>}
        </div> : <p style={{ color: '#657084', fontSize: 13, marginTop: 18 }}>Enter a valid 10-digit US mobile number to create the link.</p>}
        <p style={{ color: '#657084', fontSize: 12, borderTop: '1px solid #e5eaf0', marginTop: 24, paddingTop: 14, lineHeight: 1.5 }}>The link contains the destination number and may be forwarded. This partner generator requires an access code. The customer link itself can be forwarded and contains the destination number. Customers must confirm their pin and personally send the text.</p>
      </section>
    </main>
  );
}
