/* ------------------------------------------------------------------
   theme.js — le sélecteur de couleurs du site.

   Le choix est appliqué AVANT le premier affichage : le script est chargé
   dans le <head>, et la première chose qu'il fait est de poser l'attribut
   sur <html>. Sans cela, la page apparaîtrait une fraction de seconde en
   rose avant de basculer.

   Le choix est mémorisé dans localStorage, donc il survit à la fermeture de
   l'onglet, contrairement au code d'accès.
   ------------------------------------------------------------------ */

(function () {
  'use strict';

  var CLE = 'theme-revisions';

  var THEMES = [
    { id: '',         nom: 'Rose',     pois: '#ff6b9d' },
    { id: 'rouge',    nom: 'Rouge',    pois: '#fa5252' },
    { id: 'ambre',    nom: 'Ambre',    pois: '#ffa94d' },
    { id: 'vert',     nom: 'Vert',     pois: '#2fbf71' },
    { id: 'bleu',     nom: 'Bleu',     pois: '#4dabf7' },
    { id: 'violet',   nom: 'Violet',   pois: '#9775fa' },
    { id: 'ardoise',  nom: 'Ardoise',  pois: '#90a4c4' }
  ];

  function lire() {
    try { return localStorage.getItem(CLE) || ''; } catch (e) { return ''; }
  }
  function ecrire(v) {
    try { v ? localStorage.setItem(CLE, v) : localStorage.removeItem(CLE); }
    catch (e) { /* navigation privée : le thème vaut pour la session */ }
  }
  function appliquer(v) {
    if (v) document.documentElement.setAttribute('data-theme', v);
    else document.documentElement.removeAttribute('data-theme');
  }

  /* avant tout affichage */
  appliquer(lire());

  function construire() {
    if (document.getElementById('theme-bouton')) return;

    var actuel = lire();

    var bouton = document.createElement('button');
    bouton.id = 'theme-bouton';
    bouton.type = 'button';
    bouton.className = 'theme-bouton';
    bouton.setAttribute('aria-label', 'Changer la couleur du site');
    bouton.setAttribute('aria-haspopup', 'true');
    bouton.setAttribute('aria-expanded', 'false');
    bouton.innerHTML = '<span class="theme-pastille" aria-hidden="true"></span>';

    var menu = document.createElement('div');
    menu.className = 'theme-choix';
    menu.setAttribute('role', 'radiogroup');
    menu.setAttribute('aria-label', 'Couleur du site');

    THEMES.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(t.id === actuel));
      b.innerHTML = '<span class="pois" style="background:' + t.pois + '"></span>' + t.nom;
      b.addEventListener('click', function () {
        actuel = t.id;
        appliquer(actuel);
        ecrire(actuel);
        menu.querySelectorAll('button').forEach(function (x, i) {
          x.setAttribute('aria-checked', String(THEMES[i].id === actuel));
        });
        fermer();
        bouton.focus();
      });
      menu.appendChild(b);
    });

    function ouvrir() {
      menu.classList.add('ouvert');
      bouton.setAttribute('aria-expanded', 'true');
    }
    function fermer() {
      menu.classList.remove('ouvert');
      bouton.setAttribute('aria-expanded', 'false');
    }

    bouton.addEventListener('click', function (ev) {
      ev.stopPropagation();
      menu.classList.contains('ouvert') ? fermer() : ouvrir();
    });
    menu.addEventListener('click', function (ev) { ev.stopPropagation(); });
    document.addEventListener('click', fermer);
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && menu.classList.contains('ouvert')) { fermer(); bouton.focus(); }
    });

    document.body.appendChild(bouton);
    document.body.appendChild(menu);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', construire);
  } else {
    construire();
  }

  /* un autre onglet a changé le thème : on suit */
  window.addEventListener('storage', function (ev) {
    if (ev.key === CLE) appliquer(ev.newValue || '');
  });
})();
