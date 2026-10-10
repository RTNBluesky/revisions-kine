/* ------------------------------------------------------------------
   infini.js — le quiz sans fin d'une matière.

   La page charge la banque de sa matière — un script qui remplit
   window.BANQUE_INFINI — puis dépose window.INFINI = { retour: '…' }.
   On tire une question au hasard dans toute la matière, on corrige
   aussitôt, et on recommence tant que l'élève ne dit pas stop.

   Le tirage ne repasse jamais sur une question tant que toutes les
   autres n'ont pas été posées : on mélange le paquet, on le distribue,
   puis on le remélange. C'est ce que fait un jeu de cartes, et c'est
   la seule façon de ne pas retomber trois fois de suite sur la même.
   ------------------------------------------------------------------ */

(function () {
  'use strict';

  function el(balise, classe, texte) {
    var n = document.createElement(balise);
    if (classe) n.className = classe;
    if (texte != null) n.textContent = texte;
    return n;
  }
  function sobre() {
    return !!(window.matchMedia &&
              window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function amener(node) {
    if (!node || !node.scrollIntoView) return;
    try { node.scrollIntoView({ behavior: sobre() ? 'auto' : 'smooth', block: 'center' }); }
    catch (e) { node.scrollIntoView(true); }
  }

  /* mélange de Fisher-Yates : chaque ordre a la même chance de sortir */
  function melanger(t) {
    for (var i = t.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var x = t[i]; t[i] = t[j]; t[j] = x;
    }
    return t;
  }

  function demarrer(banque) {
    var racine = document.getElementById('infini');
    if (!racine) return;

    var questions = banque.questions || [];
    var sources = banque.sources || [];
    if (!questions.length) {
      racine.appendChild(el('p', 'infini-vide', 'Aucune question pour cette matière.'));
      return;
    }

    var paquet = [];              /* indices restant à poser dans le tour en cours */
    var posees = 0, justes = 0;
    var serie = 0, meilleure = 0;
    var ratees = [];              /* { i, choisi } */
    var parSource = {};           /* statistiques par cours d'origine */
    var enCours = null;

    var compteur = document.getElementById('infini-compteur');
    var zone = el('div', 'infini-zone');
    racine.appendChild(zone);

    function majCompteur() {
      if (!compteur) return;
      var pct = posees ? Math.round(justes / posees * 100) : 0;
      compteur.innerHTML = '';
      compteur.appendChild(el('span', 'infini-stat',
        posees + (posees > 1 ? ' questions' : ' question')));
      compteur.appendChild(el('span', 'infini-stat', justes + ' juste' + (justes > 1 ? 's' : '')));
      if (posees) compteur.appendChild(el('span', 'infini-stat', pct + ' %'));
      if (serie > 1) compteur.appendChild(el('span', 'infini-stat infini-serie', 'série de ' + serie));
    }

    function tirer() {
      if (!paquet.length) {
        paquet = melanger(questions.map(function (_, i) { return i; }));
        /* on évite d'enchaîner deux fois la même question au changement de tour */
        if (enCours != null && paquet.length > 1 && paquet[0] === enCours) {
          var x = paquet.shift(); paquet.splice(1, 0, x);
        }
      }
      return paquet.pop();
    }

    function poser() {
      var i = tirer();
      enCours = i;
      var q = questions[i];
      var multiple = Object.prototype.toString.call(q.r) === '[object Array]';

      zone.innerHTML = '';
      var carte = el('div', 'q infini-q');

      var tete = el('div', 'infini-tete');
      tete.appendChild(el('span', 'num', 'Question ' + (posees + 1)));
      var src = sources[q.s];
      if (src) tete.appendChild(el('span', 'infini-source', src.t));
      carte.appendChild(tete);

      var stem = el('div', 'stem');
      stem.innerHTML = q.q;
      carte.appendChild(stem);

      if (multiple) {
        var aide = el('div', 'multi-hint', 'Plusieurs bonnes réponses');
        carte.appendChild(aide);
      }

      /* on mélange aussi les propositions : la place de la bonne réponse
         ne doit pas devenir un indice */
      var ordre = melanger(q.o.map(function (_, k) { return k; }));
      var cases = [];
      ordre.forEach(function (k, rang) {
        var lab = el('label', 'opt');
        var inp = document.createElement('input');
        inp.type = multiple ? 'checkbox' : 'radio';
        inp.name = 'infini';
        inp.value = String(k);
        var txt = el('span');
        txt.innerHTML = q.o[k];
        lab.appendChild(inp);
        lab.appendChild(txt);
        carte.appendChild(lab);
        cases.push({ k: k, inp: inp, lab: lab });
      });

      var actions = el('div', 'actions infini-actions');
      var valider = el('button', 'btn quiz', multiple ? 'Valider' : 'Vérifier');
      valider.type = 'button';
      actions.appendChild(valider);
      var stop = el('button', 'btn ghost', 'Arrêter et voir le bilan');
      stop.type = 'button';
      stop.addEventListener('click', bilan);
      actions.appendChild(stop);
      carte.appendChild(actions);

      zone.appendChild(carte);

      var corrige = false;

      function corriger() {
        if (corrige) return;                         /* une seule correction par question */
        var bonnes = multiple ? q.r.slice() : [q.r];
        var choisis = cases.filter(function (c) { return c.inp.checked; })
                           .map(function (c) { return c.k; });
        if (!choisis.length) return;                 /* rien coché : on attend */
        corrige = true;
        var gagne = choisis.length === bonnes.length &&
                    choisis.every(function (k) { return bonnes.indexOf(k) !== -1; });

        cases.forEach(function (c) {
          c.inp.disabled = true;
          c.lab.classList.add('locked');
          if (bonnes.indexOf(c.k) !== -1) c.lab.classList.add('correct');
          else if (c.inp.checked) c.lab.classList.add('wrong');
        });

        posees++;
        if (gagne) { justes++; serie++; if (serie > meilleure) meilleure = serie; }
        else { serie = 0; ratees.push({ i: i, choisi: choisis.slice() }); }

        var cle = String(q.s);
        parSource[cle] = parSource[cle] || { posees: 0, justes: 0 };
        parSource[cle].posees++;
        if (gagne) parSource[cle].justes++;

        var verdict = el('div', 'infini-verdict ' + (gagne ? 'bon' : 'rate'),
                         gagne ? 'Bonne réponse' : 'Raté');
        carte.insertBefore(verdict, actions);

        if (q.e) {
          var why = el('div', 'why');
          why.innerHTML = '<b>Pourquoi : </b>' + q.e;
          carte.insertBefore(why, actions);
        }
        if (src && src.f) {
          var lien = el('a', 'infini-fiche', 'Revoir la fiche — ' + src.t);
          lien.href = src.f;
          carte.insertBefore(lien, actions);
        }

        valider.textContent = 'Question suivante →';
        valider.classList.add('ready');
        majCompteur();
      }

      /* un seul bouton pour les deux temps : on corrige, puis on enchaîne */
      valider.addEventListener('click', function () {
        if (corrige) { poser(); amener(zone); return; }
        corriger();
      });
      if (!multiple) {
        cases.forEach(function (c) {
          c.inp.addEventListener('change', function () {
            if (!c.inp.disabled) corriger();
          });
        });
      }
      majCompteur();
    }

    function bilan() {
      zone.innerHTML = '';
      var pct = posees ? Math.round(justes / posees * 100) : 0;
      var box = el('div', 'score ' + (pct >= 70 ? 'good' : pct >= 50 ? '' : 'bad'));

      box.appendChild(el('div', 'score-mode', 'Quiz infini — ' + banque.titre));
      box.appendChild(el('div', 'big', justes + ' / ' + posees + '  (' + pct + ' %)'));
      box.appendChild(el('p', 'msg', posees
        ? 'Meilleure série : ' + meilleure + ' bonne' + (meilleure > 1 ? 's' : '') +
          ' réponse' + (meilleure > 1 ? 's' : '') + ' d’affilée.'
        : 'Aucune question posée.'));

      /* répartition par cours */
      var cles = Object.keys(parSource);
      if (cles.length) {
        var bloc = el('div', 'infini-repartition');
        bloc.appendChild(el('div', 'ratees-titre', 'Par cours'));
        var table = el('div', 'infini-table');
        cles.sort(function (a, b) {
          return (parSource[a].justes / parSource[a].posees) -
                 (parSource[b].justes / parSource[b].posees);
        }).forEach(function (c) {
          var s = parSource[c];
          var ligne = el('div', 'infini-ligne');
          ligne.appendChild(el('span', 'infini-nom', (sources[c] || {}).t || 'Cours'));
          ligne.appendChild(el('span', 'infini-chiffre', s.justes + ' / ' + s.posees));
          var jauge = el('span', 'infini-jauge');
          var plein = el('i');
          plein.style.width = Math.round(s.justes / s.posees * 100) + '%';
          jauge.appendChild(plein);
          ligne.appendChild(jauge);
          table.appendChild(ligne);
        });
        bloc.appendChild(table);
        box.appendChild(bloc);
      }

      /* les questions ratées, dépliables */
      if (ratees.length) {
        var r = el('div', 'ratees');
        r.appendChild(el('div', 'ratees-titre',
          ratees.length + ' question' + (ratees.length > 1 ? 's' : '') +
          ' ratée' + (ratees.length > 1 ? 's' : '') + ' — clique pour revoir'));
        var liste = el('div', 'ratees-liste');
        ratees.forEach(function (x, n) {
          var b = el('button', 'ratee', String(n + 1));
          b.type = 'button';
          b.addEventListener('click', function () { detail(box, x); });
          liste.appendChild(b);
        });
        r.appendChild(liste);
        box.appendChild(r);
      }

      var act = el('div', 'actions');
      var repart = el('button', 'btn quiz', 'Repartir pour un tour');
      repart.type = 'button';
      repart.addEventListener('click', function () { location.reload(); });
      act.appendChild(repart);
      var retour = el('a', 'btn ghost', 'Retour à la matière');
      retour.href = (window.INFINI && window.INFINI.retour) || '../';
      act.appendChild(retour);
      box.appendChild(act);

      zone.appendChild(box);
      amener(box);
      if (compteur) compteur.innerHTML = '';
    }

    function detail(box, x) {
      var ancien = box.querySelector('.infini-detail');
      if (ancien) ancien.remove();
      var q = questions[x.i];
      var d = el('div', 'infini-detail');
      var t = el('div', 'stem');
      t.innerHTML = q.q;
      d.appendChild(t);
      var bonnes = Object.prototype.toString.call(q.r) === '[object Array]' ? q.r : [q.r];
      q.o.forEach(function (o, k) {
        var l = el('div', 'opt locked' +
          (bonnes.indexOf(k) !== -1 ? ' correct' : (x.choisi.indexOf(k) !== -1 ? ' wrong' : '')));
        var s = el('span');
        s.innerHTML = o;
        l.appendChild(s);
        d.appendChild(l);
      });
      if (q.e) {
        var w = el('div', 'why');
        w.innerHTML = '<b>Pourquoi : </b>' + q.e;
        d.appendChild(w);
      }
      box.appendChild(d);
      amener(d);
    }

    poser();
  }

  /* La banque est chargée par une balise <script> posée dans la page, qui
     remplit window.BANQUE_INFINI. On ne passe pas par fetch : une page ouverte
     depuis le disque (file://) n'a pas le droit d'aller lire un autre fichier,
     alors qu'elle peut toujours charger un script. */
  function lancer() {
    var racine = document.getElementById('infini');
    if (!racine) return;
    var b = window.BANQUE_INFINI;
    if (!b || !b.questions || !b.questions.length) {
      racine.appendChild(el('p', 'infini-vide',
        'Les questions n’ont pas pu être chargées. Recharge la page.'));
      return;
    }
    racine.innerHTML = '';
    demarrer(b);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', lancer);
  } else {
    lancer();
  }
})();
