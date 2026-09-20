/* ------------------------------------------------------------------
   acces.js — verrou d'accès, posé sur toutes les pages du site.

   ⚠ CE N'EST PAS UNE SÉCURITÉ.
   Le site est statique : tout son contenu est livré au navigateur avant
   d'être masqué. Qui sait ouvrir les outils de développement, désactiver
   JavaScript ou lire le dépôt passe outre en quelques secondes.
   Le verrou sert à une seule chose : éviter qu'on tombe sur le site par
   hasard et qu'on s'y promène. Pour une vraie protection il faut un
   dépôt privé et une authentification côté serveur (Cloudflare Access,
   Netlify Identity…), ce que GitHub Pages ne sait pas faire.

   Déverrouillage mémorisé le temps de la session (onglet fermé = redemandé).

   ---- CHANGER LE CODE ----
   Ouvre la console du navigateur sur n'importe quelle page du site et tape :
       codeAcces('MonNouveauCode')
   puis recopie l'empreinte affichée dans la constante EMPREINTE ci-dessous.
   ------------------------------------------------------------------ */

(function () {
  'use strict';

  var EMPREINTE = 0x7c95df9e;          /* empreinte du code d'accès en vigueur */
  var CLE       = 'acces-revisions';

  /* FNV-1a 32 bits — assez pour que le code ne se lise pas en clair
     dans le source, pas davantage. Voir l'avertissement ci-dessus. */
  function empreinte(texte) {
    var h = 0x811c9dc5;
    for (var i = 0; i < texte.length; i++) {
      h ^= texte.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  }

  window.codeAcces = function (code) {
    var e = '0x' + ('0000000' + empreinte(String(code)).toString(16)).slice(-8);
    console.log('Empreinte de « ' + code +' » : ' + e +
                '\nRecopie-la dans EMPREINTE, au début de assets/js/acces.js.');
    return e;
  };

  function deverrouille() {
    try { return sessionStorage.getItem(CLE) === '1'; } catch (e) { return false; }
  }
  function memorise() {
    try { sessionStorage.setItem(CLE, '1'); } catch (e) { /* navigation privée */ }
  }

  if (deverrouille()) return;

  /* masquage immédiat : <html> existe déjà, <body> pas forcément */
  document.documentElement.classList.add('verrouille');

  function construire() {
    /* garde-fou : jamais deux écrans superposés */
    if (document.getElementById('acces-ecran')) return;

    var ecran = document.createElement('div');
    ecran.id = 'acces-ecran';
    ecran.setAttribute('role', 'dialog');
    ecran.setAttribute('aria-modal', 'true');
    ecran.setAttribute('aria-labelledby', 'acces-titre');
    ecran.innerHTML =
      '<div class="acces-carte">' +
        '<div class="acces-cadenas" aria-hidden="true">' +
          '<span class="acces-onde"></span>' +
          '<svg viewBox="0 0 64 64" width="70" height="70">' +
            '<path class="acces-anse" d="M20 30V21a12 12 0 0 1 24 0v9" />' +
            '<rect class="acces-corps" x="13" y="29" width="38" height="26" rx="7" />' +
            '<circle class="acces-trou" cx="32" cy="39" r="3.6" />' +
            '<path class="acces-trou-fente" d="M32 41.5 30 49h4z" />' +
          '</svg>' +
        '</div>' +
        '<h1 id="acces-titre">Révisions Kinésithérapie</h1>' +
        '<p class="acces-sous-titre">Ces fiches sont personnelles.<br>Entre le code d’accès pour continuer.</p>' +
        '<form novalidate>' +
          '<input type="password" id="acces-code" placeholder="Code d’accès" ' +
                 'autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" ' +
                 'aria-label="Code d’accès" aria-describedby="acces-erreur">' +
          '<button type="submit">Entrer</button>' +
          '<p class="acces-erreur" id="acces-erreur" role="status" aria-live="polite"></p>' +
        '</form>' +
        '<p class="acces-note">Le code est redemandé à la fermeture de l’onglet. ' +
          'Ce verrou évite d’arriver ici par hasard : ce n’est pas une protection ' +
          'des données.</p>' +
      '</div>';

    document.body.appendChild(ecran);

    var champ  = ecran.querySelector('#acces-code');
    var erreur = ecran.querySelector('#acces-erreur');
    var carte  = ecran.querySelector('.acces-carte');
    var essais = 0;

    champ.focus();

    ecran.querySelector('form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      /* NFC : le « é » saisi au clavier et le « é » collé depuis un autre
         logiciel n'ont pas toujours la même écriture en mémoire. */
      var saisi = champ.value.trim();
      if (saisi.normalize) saisi = saisi.normalize('NFC');
      if (empreinte(saisi) === EMPREINTE) {
        memorise();
        champ.blur();
        champ.disabled = true;
        erreur.textContent = '';

        /* mouvement réduit demandé par le système : on ouvre sans cérémonie */
        var sobre = window.matchMedia &&
                    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (sobre) {
          document.documentElement.classList.remove('verrouille');
          ecran.parentNode.removeChild(ecran);
          return;
        }

        ecran.classList.add('acces-ouvert');
        /* le contenu réapparaît derrière l'écran pendant qu'il s'efface */
        setTimeout(function () {
          document.documentElement.classList.remove('verrouille');
        }, 560);
        setTimeout(function () {
          if (ecran.parentNode) ecran.parentNode.removeChild(ecran);
        }, 1020);
        return;
      }
      essais++;
      erreur.textContent = essais >= 3
        ? 'Toujours pas. Vérifie les majuscules.'
        : 'Code incorrect.';
      carte.classList.remove('acces-secousse');
      void carte.offsetWidth;                 /* relance l'animation */
      carte.classList.add('acces-secousse');
      champ.select();
    });

    champ.addEventListener('input', function () { erreur.textContent = ''; });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', construire);
  } else {
    construire();
  }
})();
