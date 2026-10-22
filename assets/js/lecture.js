/* ------------------------------------------------------------------
   lecture.js — confort de lecture, sur tout le site (avec lecture.css).

   Le script reconnaît le genre de page et n'en fait jamais trop :

     fiche, antisèche, annale   barre de lecture, bouton « haut de page »,
                                blocs qui entrent en douceur, schémas qui
                                se déroulent étape par étape ;
     page d'accueil             cartes qui arrivent en cascade, bouton ;
     glossaire                  barre de lecture et bouton ;
     quiz                       bouton seulement : rien ne bouge pendant
                                qu'on répond.

   Le HTML ne cache jamais rien d'avance : sans ce script, à l'impression
   ou quand le système demande moins d'animations, tout reste affiché.
   Ce qui est déjà sous les yeux au chargement n'est jamais animé.
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  var doc = document;
  var racine = doc.documentElement;

  /* durées en millisecondes — à garder en phase avec lecture.css */
  var APPARITION = 600;
  var PAS_SCHEMA = 70;
  var PAS_FRISE = 110;
  var PAS_CASCADE = 70;
  var MAX_PAS = 12;
  var MAX_CASCADE = 6;

  var CARTES = '.year-card, .archive-card, .card, .course-link, .src-item, .infini-appel, .section-head';

  function calme() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
  }

  /* ------------------------------------------- quel genre de page ? */
  function genreDePage() {
    if (doc.querySelector('.quiz-head, .infini-entete')) return 'quiz';
    if (doc.querySelector('.glo-outils')) return 'glossaire';
    if (doc.querySelector('article.fiche')) return 'lecture';
    var chemin = window.location.pathname || '';
    if (/(^|\/)(accueil-[^\/]*|index)\.html$/.test(chemin) || /\/$/.test(chemin)) return 'accueil';
    if (doc.querySelector('main')) return 'lecture';
    return '';
  }

  /* ------------------------------------------- barre de lecture */
  function barre() {
    var b = doc.createElement('div');
    b.className = 'lecture-barre';
    b.setAttribute('aria-hidden', 'true');
    doc.body.appendChild(b);
    return function (part) { b.style.transform = 'scaleX(' + part.toFixed(4) + ')'; };
  }

  /* ------------------------------------------- bouton haut de page */
  function bouton() {
    var haut = doc.createElement('button');
    haut.type = 'button';
    haut.className = 'haut-de-page';
    haut.setAttribute('aria-label', 'Revenir en haut de la page');
    haut.title = 'Revenir en haut';
    haut.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
                     '<path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/></svg>';
    haut.addEventListener('click', function () {
      try { window.scrollTo({ top: 0, behavior: calme() ? 'auto' : 'smooth' }); }
      catch (e) { window.scrollTo(0, 0); }
    });
    doc.body.appendChild(haut);
    return function (y) {
      haut.classList.toggle('visible', y > Math.max(480, window.innerHeight * 0.8));
    };
  }

  function suivreLeDefilement(avecBarre) {
    var montrerBarre = avecBarre ? barre() : null;
    var montrerBouton = bouton();
    var attente = false;
    function suivre() {
      attente = false;
      var max = Math.max(racine.scrollHeight, doc.body.scrollHeight) - window.innerHeight;
      var y = window.pageYOffset || racine.scrollTop || 0;
      if (montrerBarre) montrerBarre(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0);
      montrerBouton(y);
    }
    function demander() {
      if (attente) return;
      attente = true;
      (window.requestAnimationFrame || window.setTimeout)(suivre);
    }
    window.addEventListener('scroll', demander, { passive: true });
    window.addEventListener('resize', demander);
    suivre();
  }

  /* ------------------------------------------- les blocs à faire entrer */
  function blocsDeLecture(corps) {
    var blocs = [];
    var ecran = window.innerHeight || 800;
    (function parcourir(parent) {
      for (var i = 0; i < parent.children.length; i++) {
        var e = parent.children[i];
        if (/^(SCRIPT|STYLE|BR|TEMPLATE|NAV)$/.test(e.tagName)) continue;
        /* une section, ou une grande carte plus haute que l'écran (les
           antisèches) : on fait entrer ce qu'elle contient, pas le bloc entier */
        if (e.tagName === 'SECTION' ||
            (/^(DIV|ARTICLE|ASIDE)$/.test(e.tagName) && e.children.length >= 2 &&
             !e.classList.contains('table-wrap') &&
             e.getBoundingClientRect().height > ecran * 0.9)) {
          parcourir(e);
          continue;
        }
        blocs.push(e);
      }
    })(corps);
    return blocs;
  }

  function cartesDAccueil() {
    var cartes = [].slice.call(doc.querySelectorAll(CARTES));
    /* une carte posée dans une autre carte entre avec elle */
    return cartes.filter(function (c) {
      return !cartes.some(function (autre) { return autre !== c && autre.contains(c); });
    });
  }

  function genreDeBloc(e) {
    if (e.tagName === 'UL' && (e.classList.contains('branches') || e.classList.contains('galerie'))) {
      return 'schema';                       // une voie, une image après l'autre
    }
    if (e.tagName !== 'OL') return '';
    if (e.classList.contains('schema')) return 'schema';
    if (e.classList.contains('etapes')) return 'frise';
    return '';
  }

  function echelonner(e, pas) {
    var items = e.children;
    for (var i = 0; i < items.length; i++) items[i].style.setProperty('--i', Math.min(i, MAX_PAS));
    return Math.min(items.length, MAX_PAS + 1) * pas;
  }

  /* une fois l'entrée jouée, le bloc retrouve ses styles ordinaires :
     ses survols et ses transitions propres reprennent la main */
  function ranger(e, duree) {
    window.setTimeout(function () {
      e.classList.remove('apparition', 'deroule', 'vu');
      e.style.removeProperty('--retard');
      if (!e.getAttribute('style')) e.removeAttribute('style');
      for (var i = 0; i < e.children.length; i++) {
        var c = e.children[i];
        c.style.removeProperty('--i');
        if (!c.getAttribute('style')) c.removeAttribute('style');
      }
    }, duree + 120);
  }

  function faireEntrer(blocs) {
    if (calme() || !('IntersectionObserver' in window)) return;

    var observateur = new IntersectionObserver(function (entrees) {
      /* ce qui arrive ensemble arrive en cascade, de haut en bas et de
         gauche à droite */
      var arrivees = entrees.filter(function (en) { return en.isIntersecting; })
        .map(function (en) { return en.target; });
      arrivees.sort(function (a, b) {
        var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        return (ra.top - rb.top) || (ra.left - rb.left);
      });
      arrivees.forEach(function (e, rang) {
        observateur.unobserve(e);
        var retard = Math.min(rang, MAX_CASCADE) * PAS_CASCADE;
        if (retard) e.style.setProperty('--retard', retard + 'ms');
        e.classList.add('vu');
        ranger(e, (+e.getAttribute('data-duree') || APPARITION) + retard);
        e.removeAttribute('data-duree');
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.01 });

    var bas = window.innerHeight || 800;
    blocs.forEach(function (e) {
      var r = e.getBoundingClientRect();
      if (r.height === 0) return;                          // caché (onglet fermé…)
      if (r.top < bas * 0.93 && r.bottom > 0) return;      // déjà sous les yeux
      var g = genreDeBloc(e);
      if (g) {
        var etale = echelonner(e, g === 'frise' ? PAS_FRISE : PAS_SCHEMA);
        e.classList.add('deroule');
        e.setAttribute('data-duree', String(etale + APPARITION));
      } else {
        e.classList.add('apparition');
      }
      observateur.observe(e);
    });
  }

  /* ------------------------------------------- lancement */
  function preparer() {
    if (racine.classList.contains('lecture-prete') || !doc.body) return;
    var genre = genreDePage();
    if (!genre) return;
    racine.classList.add('lecture-prete');

    if (genre === 'quiz') { suivreLeDefilement(false); return; }
    if (genre === 'glossaire') { suivreLeDefilement(true); return; }
    if (genre === 'accueil') {
      suivreLeDefilement(false);
      faireEntrer(cartesDAccueil());
      return;
    }
    var corps = doc.querySelector('article.fiche') || doc.querySelector('main');
    suivreLeDefilement(true);
    faireEntrer(blocsDeLecture(corps));
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', preparer);
  else preparer();
})();
