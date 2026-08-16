#!/usr/bin/env node
// build-standalone.mjs — ui-kit-playground.html 을 외부 참조 0개의 단일 HTML 한 장으로 굽는다.
//
// 무엇을 하나:
//   1) Google Fonts <link> → @font-face + woff2(base64 data URI) 인라인 <style> 로 치환
//   2) lucide CDN <script> → 실제 사용된 아이콘 SVG 만 박은 인라인 shim 으로 치환
//      (window.lucide.createIcons API 를 그대로 흉내 내어 정적/동적 아이콘 모두 동작)
//   3) dist/ui-kit.html 로 출력 → 그대로 복사해 어디서 열어도 참조가 깨지지 않음
//
// 실행:  node tools/build-standalone.mjs
// 요구:  Node 18+ (전역 fetch). npm 의존성 없음. 빌드 타임에만 네트워크 필요.
//
// 설계 원칙: 자원별로 fail-soft 하되, 하나라도 인라인에 실패하면 "완전 self-contained 가
//           아님" 을 경고하고 종료 코드 1 로 끝낸다 — 조용히 깨진 산출물을 내지 않기 위해.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'ui-kit-playground.html');
const OUT_DIR = join(ROOT, 'dist');
const OUT = join(OUT_DIR, 'ui-kit.html');

// 데스크톱 Chrome UA — Google Fonts 가 woff2(가장 작은 포맷)를 내려주게 한다.
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// lucide 아이콘 SVG 출처 — 버전 핀(@latest 회피, breaking change 차단).
const LUCIDE_VERSION = '0.469.0';
const lucideIconUrl = (name) =>
  `https://unpkg.com/lucide-static@${LUCIDE_VERSION}/icons/${name}.svg`;

// lucide 가 버전업하며 개명한 아이콘들. 원본 HTML 의 data-lucide(구명)는 그대로 두고,
// 다운로드만 신명으로 폴백한다(키는 구명 유지 → 원본 무수정).
const LUCIDE_ALIASES = {
  'alert-triangle': 'triangle-alert',
  'alert-circle': 'circle-alert',
  'alert-octagon': 'octagon-alert',
  'home': 'house',
  'more-horizontal': 'ellipsis',
  'more-vertical': 'ellipsis-vertical',
};

const warnings = [];
const warn = (m) => { warnings.push(m); console.warn('  ⚠ ' + m); };

async function fetchText(url, headers = {}) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, ...headers } });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.text();
}
async function fetchBase64(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return Buffer.from(await res.arrayBuffer()).toString('base64');
}

// ── 1) 폰트 인라인 ─────────────────────────────────────────────────────────
// Google Fonts CSS 의 모든 @font-face 를 가져와 woff2 url(...) 을 data URI 로 바꾼다.
async function inlineFonts(html) {
  const linkRe =
    /<link[^>]*href="(https:\/\/fonts\.googleapis\.com\/css2[^"]*)"[^>]*>/i;
  const m = html.match(linkRe);
  if (!m) { warn('Google Fonts <link> 를 찾지 못함 — 폰트 인라인 건너뜀'); return html; }

  let css;
  try {
    css = await fetchText(m[1]);
  } catch (e) {
    warn(`폰트 CSS 다운로드 실패(${e.message}) — <link> 원본 유지`);
    return html;
  }

  const urls = [...new Set([...css.matchAll(/url\((https:\/\/[^)]+\.woff2)\)/g)].map((x) => x[1]))];
  let inlined = 0;
  for (const url of urls) {
    try {
      const b64 = await fetchBase64(url);
      css = css.split(url).join(`data:font/woff2;base64,${b64}`);
      inlined++;
    } catch (e) {
      warn(`woff2 다운로드 실패(${e.message}) — 해당 글리프는 폴백됨`);
    }
  }
  console.log(`  · 폰트: @font-face ${inlined}/${urls.length} 개 woff2 인라인`);

  const styleBlock =
    '<style id="inlined-fonts">\n/* IBM Plex Sans/Mono — woff2 base64 인라인(외부 참조 제거) */\n' +
    css + '\n</style>';

  // preconnect 2줄 제거 + stylesheet link → 인라인 style 로 치환
  return html
    .replace(/[\t ]*<link rel="preconnect"[^>]*>\n?/gi, '')
    .replace(linkRe, styleBlock);
}

// ── 2) lucide 인라인 ───────────────────────────────────────────────────────
// 실제 사용된 아이콘만 SVG 로 박고, createIcons() API 를 흉내 내는 shim 을 주입한다.
async function inlineLucide(html) {
  const scriptRe = /<script src="https:\/\/unpkg\.com\/lucide[^"]*">\s*<\/script>/i;
  if (!scriptRe.test(html)) { warn('lucide <script> 를 찾지 못함 — lucide 인라인 건너뜀'); return html; }

  const names = [...new Set([...html.matchAll(/data-lucide="([^"]+)"/g)].map((x) => x[1]))].sort();
  const icons = {};
  let ok = 0;
  for (const name of names) {
    try {
      // 내려받은 SVG 의 외곽 <svg ...> 태그는 shim 이 다시 만들므로 내부 path 만 보관.
      // 구명이 404 면 alias(신명)로 한 번 더 시도.
      let svg;
      try {
        svg = await fetchText(lucideIconUrl(name));
      } catch (e1) {
        if (!LUCIDE_ALIASES[name]) throw e1;
        svg = await fetchText(lucideIconUrl(LUCIDE_ALIASES[name]));
      }
      const inner = svg.replace(/<svg[^>]*>/i, '').replace(/<\/svg>\s*$/i, '').trim();
      icons[name] = inner;
      ok++;
    } catch (e) {
      warn(`아이콘 '${name}' 다운로드 실패(${e.message}) — 해당 아이콘은 빈 칸으로 렌더됨`);
    }
  }
  console.log(`  · lucide: 아이콘 ${ok}/${names.length} 종 인라인 (lucide-static@${LUCIDE_VERSION})`);

  // shim: <i data-lucide="name"> 을 lucide 와 동일한 <svg class="lucide lucide-name"> 로 치환.
  // createIcons() 는 여러 번 호출되며(동적 토스트 등), 이미 치환된 svg 는 data-lucide 가
  // 없어 재처리되지 않으므로 멱등하다 — 원본 lucide 동작과 동일.
  const shim =
    '<script id="inlined-lucide">\n' +
    '(function () {\n' +
    '  var ICONS = ' + JSON.stringify(icons) + ';\n' +
    '  var ATTRS = "0 0 24 24"; // lucide viewBox\n' +
    '  function svgFor(name) {\n' +
    '    var inner = ICONS[name]; if (inner == null) return null;\n' +
    '    var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");\n' +
    '    s.setAttribute("xmlns", "http://www.w3.org/2000/svg");\n' +
    '    s.setAttribute("width", "24"); s.setAttribute("height", "24");\n' +
    '    s.setAttribute("viewBox", ATTRS);\n' +
    '    s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor");\n' +
    '    s.setAttribute("stroke-width", "2");\n' +
    '    s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round");\n' +
    '    s.setAttribute("class", "lucide lucide-" + name);\n' +
    '    s.innerHTML = inner;\n' +
    '    return s;\n' +
    '  }\n' +
    '  function createIcons() {\n' +
    '    var els = document.querySelectorAll("[data-lucide]");\n' +
    '    for (var i = 0; i < els.length; i++) {\n' +
    '      var el = els[i], name = el.getAttribute("data-lucide");\n' +
    '      var svg = svgFor(name); if (!svg) continue;\n' +
    '      // 원본 <i> 의 클래스/사이즈/스타일 속성 이관(아이콘 크기 CSS 호환)\n' +
    '      el.classList.forEach(function (c) { svg.classList.add(c); });\n' +
    '      ["width", "height", "stroke-width", "color", "style"].forEach(function (a) {\n' +
    '        if (el.hasAttribute(a)) svg.setAttribute(a, el.getAttribute(a));\n' +
    '      });\n' +
    '      el.replaceWith(svg);\n' +
    '    }\n' +
    '  }\n' +
    '  window.lucide = { createIcons: createIcons };\n' +
    '})();\n' +
    '</script>';

  return html.replace(scriptRe, shim);
}

// ── 빌드 ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('▸ ui-kit-playground.html → dist/ui-kit.html (단일 자족 파일)');
  let html = await readFile(SRC, 'utf8');

  html = await inlineFonts(html);
  html = await inlineLucide(html);

  // 검증: src/href/url() 에 남은 외부 http(s) 참조가 없어야 한다.
  const leftover = [...html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"|url\((https?:\/\/[^)]+)\)/g)]
    .map((m) => m[1] || m[2]);
  if (leftover.length) {
    leftover.forEach((u) => warn(`남은 외부 참조: ${u}`));
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT, html, 'utf8');

  const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(0);
  console.log(`\n✓ 출력: dist/ui-kit.html (${kb} KB)`);
  console.log(`  남은 외부 참조: ${leftover.length}개`);

  if (warnings.length) {
    console.log(`\n경고 ${warnings.length}건 — 완전한 self-contained 가 아닐 수 있음.`);
    process.exit(1);
  }
  console.log('  외부 참조 0개 — 그대로 복사해 어디서든 열림.');
}

main().catch((e) => { console.error('빌드 실패:', e); process.exit(1); });
