import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const { transformSync } = require('next/dist/build/swc');
const url = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const timingUrl = url(await read('app/lib/bookingTiming.js'));
const timing = await import(timingUrl);
const validation = await import(url((await read('app/lib/bookingValidation.js')).replace("'./bookingTiming'", JSON.stringify(timingUrl))));
const price = await import(url(await read('app/lib/bookingPrice.js')));
const spanish = await import(url(await read('app/components/spanish.js')));
const source = process.env.TTOD_RENDER_SOURCE
  ? await readFile(process.env.TTOD_RENDER_SOURCE, 'utf8')
  : await read('app/components/TowBooking.js');
const mainSource = source.slice(source.indexOf('export default function TowBooking'));
const stateNames = [...mainSource.matchAll(/const\s*\[\s*(\w+)\s*,[^\]]*\]\s*=\s*useState\(/g)].map(match => match[1]);
const compiled = transformSync(source, {
  filename: 'TowBooking.jsx',
  jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } }, target: 'es2022' },
  module: { type: 'commonjs' },
}).code;

function renderBooking(overrides, locale) {
  let stateIndex = 0;
  const hooks = { ...React,
    useState: initial => {
      const name = stateNames[stateIndex++];
      return [Object.hasOwn(overrides, name) ? overrides[name] : typeof initial === 'function' ? initial() : initial, () => {}];
    },
    useEffect() {}, useMemo: fn => fn(), useRef: initial => ({ current: initial }),
  };
  const imports = {
    react: hooks, 'react/jsx-runtime': require('react/jsx-runtime'),
    '../lib/bookingTiming': timing, '../lib/bookingValidation': validation,
    '../lib/bookingPrice': price, './spanish': spanish,
    './PickupPinMap': { default: () => null },
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => {
    if (!Object.hasOwn(imports, name)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  }, module, module.exports);
  return renderToStaticMarkup(React.createElement(module.exports.default, { locale }));
}

const fixture = {
  pickup: '200 Texas St, Fort Worth, TX', dropoff: 'Dallas, TX',
  route: { exactMiles: 10, billedMiles: 10 }, showQuote: true,
  scheduledDate: '2099-10-23', scheduledTime: '14:30',
  customerName: 'Test Customer', customerPhone: '2108062061', vehicleDetails: 'Toyota Camry',
};
for (const locale of ['en', 'es']) {
  for (const timing of ['ASAP', 'Schedule for later']) {
    test(`${locale} ${timing}: actual quote screen renders with price breakdown`, () => {
      const html = renderBooking({ ...fixture, timing }, locale);
      assert.ok(html.includes(locale === 'es' ? 'Desglose del precio' : 'Price breakdown'));
      assert.match(html, /100/);
      assert.ok(html.includes(locale === 'es' ? 'RESERVAR ESTA GRÚA' : 'BOOK THIS TOW'));
    });
  }
  test(`${locale}: scheduled checkout and receipt render with selected timing`, () => {
    const checkout = renderBooking({ ...fixture, timing: 'Schedule for later', booked: true, requestSubmitted: false }, locale);
    assert.match(checkout, /2099-10-23 14:30/);
    assert.ok(checkout.includes(locale === 'es' ? 'Pago al recoger' : 'Pay at pickup'));
    const receipt = renderBooking({ ...fixture, timing: 'Schedule for later', booked: true, requestSubmitted: true }, locale);
    assert.match(receipt, /2099-10-23 14:30/);
    assert.ok(receipt.includes(locale === 'es' ? 'Solicitud recibida' : 'Tow request received'));
    assert.ok(receipt.includes(locale === 'es' ? 'antes de enviar la grúa' : 'before dispatch'));
  });
}
