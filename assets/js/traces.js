/* ------------------------------------------------------------------
   traces.js — les tracés ECG et les courbes de spirométrie, dessinés
   dans la page au lieu d'être des images.

   Le HTML ne porte qu'une étiquette :
     <span class="trace" data-trace="ecg-esv" role="img" aria-label="…"></span>
   et ce script y dessine un SVG. Un tracé est une somme d'ondes simples
   posées battement par battement : on règle exactement ce qui manque ou
   ce qui change (onde P, PR, QRS, ST…). Papier : 25 mm/s, 10 mm/mV.
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  var VIT = 25, GAIN = 10, PAS = 0.004, L = 80, H = 22;
  var NS = 'http://www.w3.org/2000/svg';
  var POLICE = 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
  var compteur = 0;

  /* ------------------------------------------------ les ondes */
  function g(t, mu, s, a) { var x = (t - mu) / s; return a * Math.exp(-0.5 * x * x); }
  function sig(x) { return x < -40 ? 0 : x > 40 ? 1 : 1 / (1 + Math.exp(-x)); }

  /* b : p = 'n' normale · 'd' différente · null absente ; pr ; q = 'f' fin ·
     'l' large · 'b' bloc de branche · null (P bloquée) ; st = '+' ou '-' ;
     n = onde Q de nécrose ; e = écart R → T ; ta = amplitude de T */
  function battement(t, tR, b) {
    var v = 0, pr = b.pr != null ? b.pr : 0.16, p = b.p === undefined ? 'n' : b.p;
    if (p === 'n') v += g(t, tR - pr, 0.024, 0.15);
    else if (p === 'd') v += g(t, tR - pr, 0.016, 0.22) - g(t, tR - pr + 0.03, 0.012, 0.06);
    var q = b.q === undefined ? 'f' : b.q;
    if (q === null) return v;
    var e = b.e != null ? b.e : 0.30, ta = b.ta != null ? b.ta : 0.30;
    if (q === 'f') {
      v += b.n ? g(t, tR - 0.032, 0.014, -0.42) + g(t, tR, 0.011, 0.62)
               : g(t, tR - 0.026, 0.008, -0.10) + g(t, tR, 0.011, 1.0);
      v += g(t, tR + 0.026, 0.009, -0.24) + g(t, tR + e, 0.055, ta);
    } else if (q === 'l') {
      v += g(t, tR, 0.032, 1.05) + g(t, tR + 0.075, 0.03, -0.45) + g(t, tR + 0.34, 0.075, -0.38);
    } else if (q === 'b') {
      v += g(t, tR - 0.045, 0.014, 0.72) + g(t, tR + 0.055, 0.016, 0.95) + g(t, tR + 0.005, 0.016, 0.18)
         + g(t, tR + 0.10, 0.012, -0.12) + g(t, tR + 0.38, 0.065, -0.20);
    }
    if (b.st) {
      var niv = b.st === '+' ? 0.24 : -0.17, d = tR + 0.04, f = tR + e - 0.02;
      v += niv * sig((t - d) / 0.006) * sig((f - t) / 0.03);
      if (b.st === '-') v -= g(t, tR + e, 0.055, ta * 0.7);
    }
    return v;
  }

  function signal(bats, fond) {
    return function (t) {
      var v = fond ? fond(t) : 0;
      for (var i = 0; i < bats.length; i++) {
        var dt = t - bats[i][0];
        if (dt > -0.6 && dt < 0.7) v += battement(t, bats[i][0], bats[i][1]);
      }
      return v;
    };
  }

  function reguliers(rr, debut, b) {
    var out = [];
    for (var t = debut; t < 3.5; t += rr) out.push([t, b || {}]);
    return out;
  }

  function premature(tp, b, pause) {
    var out = [[0.3, {}], [1.1, {}], [tp, b]];
    for (var t = 2.7 + (pause || 0); t < 3.6; t += 0.8) out.push([t, {}]);
    return out;
  }

  var PI2 = 2 * Math.PI;
  var FONDS = {
    flutter: function (t) { var x = (t / 0.2) % 1; return x < 0.8 ? 0.10 - 0.30 * x : -0.14 + 1.2 * (x - 0.8); },
    fa: function (t) {
      return 0.045 * Math.sin(PI2 * 6.1 * t) + 0.035 * Math.sin(PI2 * 8.7 * t + 1.3)
           + 0.03 * Math.sin(PI2 * 4.3 * t + 0.4) + 0.02 * Math.sin(PI2 * 11.3 * t + 2.1);
    }
  };

  /* ------------------------------------------------ les tracés du cours */
  function ecg(nom) {
    var S = null, M = [], dec = 0.45, duree = 3.2, vit = VIT, i, t, k;
    switch (nom) {
      case 'sinusal': S = signal(reguliers(0.8, 0.35)); M = [[0.17, 'P'], [0.39, 'QRS'], [0.66, 'T']]; break;
      case 'tachy': S = signal(reguliers(0.48, 0.25, { e: 0.22, ta: 0.26 })); break;
      case 'brady': S = signal(reguliers(1.33, 0.4)); break;
      case 'arythmie-sinusale':
        S = signal([[0.3, {}], [1.25, {}], [2.05, {}], [2.7, {}], [3.25, {}]]); break;
      case 'esa': S = signal(premature(1.62, { p: 'd', pr: 0.14 })); M = [[1.48, 'P ≠']]; break;
      case 'esn': S = signal(premature(1.62, { p: null })); break;
      case 'esv': S = signal(premature(1.58, { p: null, q: 'l' }, 0.24)); M = [[1.58, 'ESV']]; break;
      case 'bigeminisme':
        var big = [];
        for (k = 0, t = 0.3; k < 6; k++) { big.push([t, k % 2 ? { p: null, q: 'l' } : {}]); t += k % 2 ? 0.75 : 0.5; }
        S = signal(big); break;
      case 'tsv':
        var tsv = [[0.3, {}], [1.1, {}]];
        for (k = 0; k < 6; k++) tsv.push([1.55 + 0.33 * k, { p: 'd', pr: 0.12, e: 0.2, ta: 0.22 }]);
        S = signal(tsv); M = [[1.55, 'début brutal']]; break;
      case 'tv':
        var tv = [];
        for (k = 0; k < 10; k++) tv.push([0.3 + 0.34 * k, { p: null, q: 'l' }]);
        S = signal(tv); dec = 0.5; break;
      case 'flutter-a':
        var fl = [];
        for (k = 0; k < 5; k++) fl.push([0.27 + 0.8 * k, { p: null }]);
        S = signal(fl, FONDS.flutter); break;
      case 'fa':
        S = signal([0.25, 0.83, 1.18, 1.92, 2.31, 2.62, 3.12].map(function (r) { return [r, { p: null }]; }),
                   FONDS.fa); break;
      case 'flutter-v': S = function (t) { return 0.85 * Math.sin(PI2 * 4.8 * t); }; dec = 0.5; break;
      case 'fv':
        S = function (t) {
          var a = 0.45 + 0.25 * Math.sin(PI2 * 0.7 * t) + 0.12 * Math.sin(PI2 * 1.9 * t + 1);
          return a * (Math.sin(PI2 * 5.3 * t) + 0.5 * Math.sin(PI2 * 7.9 * t + 0.8) + 0.3 * Math.sin(PI2 * 3.1 * t + 2.2));
        };
        dec = 0.5; break;
      case 'bloc-sa': S = signal([[0.3, {}], [1.1, {}], [2.7, {}], [3.5, {}]]); M = [[1.9, 'cycle absent']]; break;
      case 'bav1': S = signal(reguliers(0.9, 0.45, { pr: 0.30 })); M = [[0.30, 'PR long']]; break;
      case 'mobitz1':
        var w = [], prs = [0.16, 0.25, 0.33, null, 0.16], tp = 0.12;
        for (i = 0; i < prs.length; i++) {
          w.push(prs[i] === null ? [tp + 0.16, { q: null }] : [tp + prs[i], { pr: prs[i] }]);
          tp += 0.72;
        }
        S = signal(w); M = [[2.28, 'P bloquée']]; break;
      case 'mobitz2':
        var m2 = [];
        for (k = 0, tp = 0.12; k < 5; k++, tp += 0.72) m2.push([tp + 0.16, k === 2 ? { q: null } : {}]);
        S = signal(m2); M = [[1.72, 'P bloquée']]; break;
      case 'bav3':
        var b3 = [[0.55, { p: null, q: 'l' }], [2.05, { p: null, q: 'l' }]];
        for (k = 0; k < 6; k++) b3.push([0.31 + 0.64 * k, { q: null }]);
        for (k = 0; k < 5; k++) M.push([0.15 + 0.64 * k, 'P']);
        S = signal(b3); break;
      case 'branche':
        S = signal(reguliers(0.85, 0.3, { q: 'b' })); duree = 1.6; vit = 50; M = [[0.25, 'R'], [0.36, "R'"]]; break;
      case 'ischemie': S = signal(reguliers(0.85, 0.4, { st: '-' })); M = [[0.6, 'ST ↓']]; break;
      case 'lesion': S = signal(reguliers(0.85, 0.4, { st: '+' })); M = [[0.6, 'ST ↑']]; break;
      case 'necrose': S = signal(reguliers(0.85, 0.4, { n: true })); M = [[0.37, 'Q']]; break;
      default: return null;
    }
    var y0 = H * (1 - dec), pts = [];
    for (t = 0; t <= duree + 1e-9; t += PAS) {
      var x = t * vit;
      if (x > L) break;
      var y = Math.max(0.6, Math.min(H - 0.6, y0 - S(t) * GAIN));
      pts.push(x.toFixed(2) + ',' + y.toFixed(2));
    }
    var id = 'grille' + (++compteur);
    var marques = M.map(function (m) {
      return '<text x="' + (m[0] * vit).toFixed(1) + '" y="2.9" text-anchor="middle">' + m[1] + '</text>';
    }).join('');
    return '<svg xmlns="' + NS + '" viewBox="0 0 ' + L + ' ' + H + '" width="100%" height="100%" aria-hidden="true">'
      + '<defs><pattern id="' + id + '" width="5" height="5" patternUnits="userSpaceOnUse">'
      + '<path d="M1 0V5M2 0V5M3 0V5M4 0V5M0 1H5M0 2H5M0 3H5M0 4H5" stroke="#f6d3dc" stroke-width="0.12"/>'
      + '<path d="M0 0V5M0 0H5" stroke="#e9a3b5" stroke-width="0.22"/></pattern></defs>'
      + '<rect width="' + L + '" height="' + H + '" fill="#fff8fa"/>'
      + '<rect width="' + L + '" height="' + H + '" fill="url(#' + id + ')" stroke="#e9a3b5" stroke-width="0.3"/>'
      + '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#1b1e27" stroke-width="0.32" '
      + 'stroke-linejoin="round" stroke-linecap="round"/>'
      + '<g font-family="' + POLICE + '" font-size="2.2" font-weight="700" fill="#c2185b">' + marques + '</g></svg>';
  }

  /* ------------------------------------------------ petits outils SVG */
  var ENCRE = '#1b1e27', GRIS = '#7a8392', CLAIR = '#d5d9e0';
  var VERT = '#2e7d32', ROUGE = '#c62828', BLEU = '#1565c0';
  function txt(x, y, s, o) {
    o = o || {};
    return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" font-size="' + (o.t || 2.1) + '" fill="'
      + (o.c || GRIS) + '"' + (o.a ? ' text-anchor="' + o.a + '"' : '') + (o.g ? ' font-weight="700"' : '')
      + '>' + s + '</text>';
  }
  function ligne(x1, y1, x2, y2, c, ep, tirets) {
    return '<line x1="' + x1.toFixed(2) + '" y1="' + y1.toFixed(2) + '" x2="' + x2.toFixed(2) + '" y2="'
      + y2.toFixed(2) + '" stroke="' + (c || ENCRE) + '" stroke-width="' + (ep || 0.25) + '"'
      + (tirets ? ' stroke-dasharray="' + tirets + '"' : '') + '/>';
  }
  function poly(pts, c, ep) {
    return '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + c + '" stroke-width="' + (ep || 0.4)
      + '" stroke-linejoin="round"/>';
  }
  function svg(l, h, corps) {
    return '<svg xmlns="' + NS + '" viewBox="0 0 ' + l + ' ' + h + '" width="100%" height="100%" aria-hidden="true">'
      + '<rect width="' + l + '" height="' + h + '" fill="#fff"/><g font-family="' + POLICE + '">' + corps + '</g></svg>';
  }
  /* axes : origine (x0, y0) en bas à gauche, longueur l, hauteur h */
  function axes(x0, y0, l, h, tx, ty) {
    return ligne(x0, y0, x0 + l, y0, ENCRE, 0.25) + ligne(x0, y0, x0, y0 - h, ENCRE, 0.25)
      + '<path d="M' + (x0 + l) + ' ' + y0 + 'l-1.4 -0.6v1.2z M' + x0 + ' ' + (y0 - h) + 'l-0.6 1.4h1.2z" fill="' + ENCRE + '"/>'
      + txt(x0 + l, y0 + 4.2, tx, { a: 'end' }) + txt(x0 + 1, y0 - h + 1.2, ty);
  }
  function legende(x, y, items, pas) {
    return items.map(function (it, k) {
      var yy = y + k * (pas || 2.6);
      return ligne(x, yy, x + 3.5, yy, it[1], 0.5) + txt(x + 4.3, yy + 0.7, it[0], { c: it[1], t: 2 });
    }).join('');
  }

  /* ------------------------------------------------ spirométrie */
  /* seul : 'normal' | 'obst' | 'rest' → une seule courbe, sans légende
     (pour une question où il faut la reconnaître) */
  function debitVolume(seul) {
    var W = 86, Hh = 48, x0 = 9, y0 = Hh - 11, l = W - 14, h = Hh - 14, vmax = 5.6, dmax = 9;
    var X = function (v) { return x0 + v / vmax * l; }, Y = function (q) { return y0 - q / dmax * h; };
    var c = axes(x0, y0, l, h, 'volume expiré (L)', 'débit (L/s)');
    for (var v = 1; v <= 5; v++) c += ligne(X(v), y0 - 0.4, X(v), y0 + 0.4) + txt(X(v), y0 + 2.2, v, { a: 'middle', t: 2 });
    var profils = { normal: [5.0, 8.4, 0.45, 1.0, VERT], obst: [4.2, 5.2, 0.35, 2.6, ROUGE],
                    rest: [3.0, 6.6, 0.38, 1.0, BLEU] };
    var liste = seul ? [profils[seul]] : [profils.normal, profils.obst, profils.rest];
    if (seul) liste[0] = liste[0].slice(0, 4).concat([ENCRE]);
    liste.forEach(function (k) {
      var pts = [];
      for (var i = 0; i <= 80; i++) {
        var vv = k[0] * i / 80, q;
        q = vv <= k[2] ? k[1] * Math.pow(Math.sin(Math.PI / 2 * vv / k[2]), 0.8)
                       : k[1] * Math.pow(1 - (vv - k[2]) / (k[0] - k[2]), k[3]);
        pts.push(X(vv).toFixed(2) + ',' + Y(q).toFixed(2));
      }
      c += poly(pts, k[4]);
    });
    if (!seul) {
      c += txt(X(0.62) + 0.8, Y(8.4) + 1.8, '← DEP (débit de pointe)', { t: 1.9 });
      c += legende(W - 33, 6, [['normal', VERT], ['obstructif : creusée', ROUGE], ['restrictif : petite', BLEU]]);
    }
    return svg(W, Hh, c);
  }

  function volumeTemps() {
    var W = 86, Hh = 48, x0 = 9, y0 = Hh - 11, l = W - 14, h = Hh - 14, tmax = 7, vmax = 5.6;
    var X = function (t) { return x0 + t / tmax * l; }, Y = function (v) { return y0 - v / vmax * h; };
    var c = axes(x0, y0, l, h, 'temps (s)', 'volume (L)');
    for (var t = 1; t <= 6; t++) c += ligne(X(t), y0 - 0.4, X(t), y0 + 0.4) + txt(X(t), y0 + 2.2, t, { a: 'middle', t: 2 });
    c += ligne(X(1), y0, X(1), y0 - h * 0.95, CLAIR, 0.3, '0.8 0.6') + txt(X(1) + 0.6, y0 - 0.8, '1 s', { t: 2 });
    [[5.0, 4.0, VERT], [4.2, 2.1, ROUGE], [3.0, 2.6, BLEU]].forEach(function (k) {
      var kk = -Math.log(1 - k[1] / k[0]), pts = [];
      for (var i = 0; i <= 140; i++) {
        var tt = tmax * i / 140;
        pts.push(X(tt).toFixed(2) + ',' + Y(k[0] * (1 - Math.exp(-kk * tt))).toFixed(2));
      }
      c += poly(pts, k[2]) + '<circle cx="' + X(1).toFixed(2) + '" cy="' + Y(k[1]).toFixed(2) + '" r="0.5" fill="' + k[2] + '"/>';
    });
    c += legende(W - 41, y0 - h * 0.36, [['normal : 4,0 / 5,0 = 80 %', VERT], ['obstructif : 2,1 / 4,2 = 50 %', ROUGE],
                                        ['restrictif : 2,6 / 3,0 = 87 %', BLEU]], 2.4);
    c += txt(x0, Hh - 1, 'point = VEMS (expiré en 1 s) · plateau = CVF (≥ 6 s)', { t: 1.9 });
    return svg(W, Hh, c);
  }

  function volumes() {
    var W = 84, Hh = 46, x0 = 3, y0 = Hh - 4, l = 46, h = Hh - 12;
    var vr = 0.22, crf = 0.45, vt = 0.58, cpt = 1.0;
    var Y = function (f) { return y0 - f * h; };
    var calme = function (u) { return crf + (vt - crf) * (0.5 - 0.5 * Math.cos(PI2 * u)); };
    var segs = [[0.12, calme], [0.12, calme],
      [0.13, function (u) { return crf + (cpt - crf) * Math.sin(Math.PI / 2 * u); }],
      [0.20, function (u) { return cpt - (cpt - vr) * (0.5 - 0.5 * Math.cos(Math.PI * u)); }],
      [0.11, function (u) { return vr + (crf - vr) * Math.sin(Math.PI / 2 * u); }],
      [0.12, calme], [0.12, calme]];
    var tot = segs.reduce(function (s, x) { return s + x[0]; }, 0), pts = [], x = x0;
    segs.forEach(function (s) {
      var w = s[0] / tot * l;
      for (var k = 0; k <= 40; k++) pts.push((x + k / 40 * w).toFixed(2) + ',' + Y(s[1](k / 40)).toFixed(2));
      x += w;
    });
    var c = ligne(x0, Y(0), x0 + l, Y(0), GRIS, 0.2);
    [vr, crf, vt, cpt].forEach(function (f) { c += ligne(x0, Y(f), W - 1, Y(f), CLAIR, 0.2, '0.5 0.5'); });
    c += poly(pts, ENCRE, 0.32);
    function acc(xx, f1, f2, s, col) {
      var a = Y(f1) - 0.25, b = Y(f2) + 0.25;
      return ligne(xx, a, xx, b, col, 0.25) + ligne(xx - 0.4, a, xx + 0.4, a, col, 0.25)
        + ligne(xx - 0.4, b, xx + 0.4, b, col, 0.25) + txt(xx + 0.6, (a + b) / 2 + 0.7, s, { c: col, t: 1.9 });
    }
    var xa = x0 + l + 1;
    c += acc(xa, vt, cpt, 'VRI', ENCRE) + acc(xa, crf, vt, 'Vt', ENCRE) + acc(xa, vr, crf, 'VRE', ENCRE)
      + acc(xa, 0, vr, 'VR', ENCRE) + acc(xa + 9, vr, cpt, 'CV', BLEU) + acc(xa + 9, 0, crf, 'CRF', VERT)
      + acc(xa + 18, 0, cpt, 'CPT', ROUGE);
    c += txt(x0, 2.8, 'CV = VRI + Vt + VRE · CRF = VRE + VR · CPT = CV + VR', { t: 1.9 });
    return svg(W, Hh, c);
  }

  /* ------------------------------------------------ électrodes */
  function electrodes() {
    var W = 62, Hh = 52, cx = 30, haut = 6, bas = Hh - 6, ROSE = '#c2185b';
    var c = '<polygon points="' + [cx - 24, haut, cx + 24, haut, cx + 27, bas, cx - 27, bas].join(' ')
      + '" fill="#faf6f2" stroke="' + GRIS + '" stroke-width="0.25"/>'
      + '<rect x="' + (cx - 2.2) + '" y="' + (haut + 2) + '" width="4.4" height="30" fill="#ece6df" stroke="' + GRIS
      + '" stroke-width="0.2"/>'
      + ligne(cx - 2.5, haut + 2, cx - 20, haut + 4, GRIS, 0.3) + ligne(cx + 2.5, haut + 2, cx + 20, haut + 4, GRIS, 0.3);
    var y4 = haut + 22, y5 = haut + 28, lmc = cx + 11, laa = cx + 18, lam = cx + 23.5;
    c += ligne(cx - 24, y4, cx + 25, y4, CLAIR, 0.25, '0.6 0.5') + ligne(cx - 24, y5, cx + 25, y5, CLAIR, 0.25, '0.6 0.5');
    [lmc, laa, lam].forEach(function (x) { c += ligne(x, y4 - 9, x, y5 + 8, CLAIR, 0.2, '0.4 0.5'); });
    var P = [['V1', cx - 3.6, y4, -2.4], ['V2', cx + 3.6, y4, -2.4], ['V3', (cx + 3.6 + lmc) / 2, (y4 + y5) / 2, -2.4],
             ['V4', lmc, y5, 4.6], ['V5', laa, y5, 4.6], ['V6', lam, y5, 4.6]];
    P.forEach(function (p) {
      c += '<circle cx="' + p[1].toFixed(2) + '" cy="' + p[2].toFixed(2) + '" r="1.5" fill="' + ROSE
        + '" stroke="#fff" stroke-width="0.2"/>' + txt(p[1], p[2] + p[3], p[0], { c: ROSE, a: 'middle', g: 1, t: 2 });
    });
    c += txt(cx - 22, bas - 2, 'droite du patient', { t: 1.8 }) + txt(cx + 22, bas - 2, 'gauche', { t: 1.8, a: 'end' });
    return svg(W, Hh, c);
  }

  var AUTRES = { 'spiro-debit-volume': function () { return debitVolume(); },
                 'spiro-dv-normal': function () { return debitVolume('normal'); },
                 'spiro-dv-obst': function () { return debitVolume('obst'); },
                 'spiro-dv-rest': function () { return debitVolume('rest'); },
                 'spiro-volume-temps': volumeTemps, 'volumes': volumes, 'electrodes': electrodes };

  /* ------------------------------------------------ pose */
  function dessiner() {
    var cibles = document.querySelectorAll('[data-trace]');
    for (var i = 0; i < cibles.length; i++) {
      var el = cibles[i], nom = el.getAttribute('data-trace'), s = null;
      if (el.firstChild) continue;
      if (nom.indexOf('ecg-') === 0) s = ecg(nom.slice(4));
      else if (AUTRES[nom]) s = AUTRES[nom]();
      if (s) el.innerHTML = s;
    }
  }
  /* les questions d'un quiz sont créées après le chargement : on dessine
     aussi ce qui arrive ensuite dans la page */
  function surveiller() {
    dessiner();
    if (!('MutationObserver' in window)) return;
    var attente = false;
    new MutationObserver(function () {
      if (attente) return;
      attente = true;
      (window.requestAnimationFrame || window.setTimeout)(function () { attente = false; dessiner(); });
    }).observe(document.body, { childList: true, subtree: true });
  }
  window.dessinerTraces = dessiner;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', surveiller);
  else surveiller();
})();
