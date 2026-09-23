/* Moteur de quiz — aucune dépendance.
   Chaque page de quiz définit QUIZ = { titre, fiche, questions: [...] }
   puis appelle demarrerQuiz().

   Une question : { q, o: [...], r, e }
   - o : les propositions, en nombre libre
   - r : l'indice de la bonne réponse (nombre)  → une seule réponse, boutons radio
         ou la liste des indices des bonnes réponses (tableau) → plusieurs réponses,
         cases à cocher et bouton « Valider »
   - e : la justification affichée à la correction

   Deux modes :
   - révision   : correction immédiate après chaque question
   - examen     : toutes les questions, correction et score à la fin

   Après une réponse, la question suivante non répondue vient se placer au centre
   de l'écran : tout de suite en examen, après 0,5 s en révision (le temps de lire
   la justification). Si l'utilisateur scrolle lui-même entre-temps, on le laisse
   faire. Les questions à plusieurs réponses en mode examen ne glissent pas :
   rien n'indique que la sélection est terminée. */

(function () {
  "use strict";

  function melanger(tab) {
    var a = tab.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  window.demarrerQuiz = function () {
    var data = window.QUIZ;
    var root = document.getElementById("quiz");
    var total = data.questions.length;
    var mode = localStorage.getItem("pratiqueQuizMode") || "revision";

    var barre = document.querySelector(".bar > i");
    var compteur = document.getElementById("compteur");
    var entete = document.querySelector(".quiz-head");

    /* ---------- écran d'intro : choix du mode ---------- */

    var intro = el("section", "quiz-intro");
    intro.innerHTML =
      '<h2>Prêt·e à t\'entraîner ?</h2>' +
      '<p class="intro-desc">Quiz sur la fiche <strong>« ' + (data.titre || "") + ' »</strong> — ' +
        total + ' questions. Choisis ton mode :</p>' +
      '<div class="mode-choice">' +
        '<div class="mode" data-mode="revision">' +
          '<h3>📚 Mode révision</h3>' +
          '<p>Correction et justification immédiates après chaque question.</p>' +
        '</div>' +
        '<div class="mode" data-mode="exam">' +
          '<h3>📝 Mode examen</h3>' +
          '<p>Toutes les questions d\'affilée, correction et score à la fin.</p>' +
        '</div>' +
      '</div>' +
      '<button class="btn quiz" type="button" id="btn-start">Commencer le quiz →</button>';

    root.parentNode.insertBefore(intro, root);
    root.classList.add("hidden");
    if (entete) entete.classList.add("hidden");

    var cartesMode = intro.querySelectorAll(".mode");
    function majMode() {
      cartesMode.forEach(function (c) {
        c.classList.toggle("active", c.dataset.mode === mode);
      });
    }
    cartesMode.forEach(function (c) {
      c.addEventListener("click", function () {
        mode = c.dataset.mode;
        localStorage.setItem("pratiqueQuizMode", mode);
        majMode();
      });
    });
    majMode();

    intro.querySelector("#btn-start").addEventListener("click", function () {
      intro.classList.add("hidden");
      root.classList.remove("hidden");
      if (entete) entete.classList.remove("hidden");
      lancer();
      try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) {}
    });

    /* ---------- session ---------- */

    /* le système peut demander qu'on limite les animations */
    function sobre() {
      return !!(window.matchMedia &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }
    function amener(node, bloc) {
      if (!node || !node.scrollIntoView) return;
      try {
        node.scrollIntoView({ behavior: sobre() ? "auto" : "smooth", block: bloc || "center" });
      } catch (e) {
        node.scrollIntoView(true);
      }
    }

    function lancer() {
      var repondu = 0, justes = 0;
      var retour = null;              /* bouton flottant « revenir au score » */
      root.innerHTML = "";

      // Les questions gardent leur ordre ; seules les propositions sont mélangées,
      // pour que la position de la bonne réponse ne soit jamais devinable.
      var questions = data.questions.map(function (q, i) {
        var bonnes = Array.isArray(q.r) ? q.r : [q.r];
        var opts = q.o.map(function (texte, idx) {
          return { texte: texte, bonne: bonnes.indexOf(idx) !== -1 };
        });
        return {
          n: i + 1, stem: q.q, opts: melanger(opts), why: q.e || "",
          multi: bonnes.length > 1, nbBonnes: bonnes.length
        };
      });

      var badge = el("div", "mode-badge",
        mode === "exam"
          ? '<span class="dot"></span>Mode examen · correction à la fin'
          : '<span class="dot"></span>Mode révision · correction immédiate');
      var chg = el("button", "mode-switch", "Changer de mode");
      chg.type = "button";
      chg.addEventListener("click", function () {
        if (glissement) { clearTimeout(glissement); glissement = null; }
        intro.classList.remove("hidden");
        root.classList.add("hidden");
        if (entete) entete.classList.add("hidden");
        var sc = document.querySelector(".score");
        if (sc) sc.remove();
        if (retour) { retour.remove(); retour = null; }
        try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) {}
      });
      badge.appendChild(chg);
      root.appendChild(badge);

      function majBarre() {
        if (barre) barre.style.width = (repondu / total * 100) + "%";
        if (compteur) compteur.textContent = repondu + " / " + total + " répondue" + (repondu > 1 ? "s" : "");
      }

      var blocs = [];

      /* texte de la ou des réponses attendues */
      function attendues(lignes) {
        return lignes.filter(function (l) { return l.bonne; })
                     .map(function (l) { return l.texte; }).join(" · ");
      }

      /* recalcule la progression à partir de l'état de chaque question */
      function recompter() {
        repondu = 0; justes = 0;
        blocs.forEach(function (e) {
          if (e.repondu) repondu++;
          if (e.juste) justes++;
        });
        majBarre();
      }

      /* ---- glissement vers la question suivante ----
         En examen : tout de suite, il n'y a rien à lire.
         En révision : après une courte pause, le temps de voir la correction.
         PAUSE est la seule valeur à toucher pour régler ce délai.
         On ne bouge jamais si l'utilisateur a scrollé lui-même entre-temps,
         et on ne saute pas les questions déjà répondues (ordre libre). */
      var PAUSE = mode === "exam" ? 260 : 500;
      var glissement = null;

      function glisserApres(etat) {
        if (glissement) { clearTimeout(glissement); glissement = null; }
        var i = blocs.indexOf(etat);
        var suivant = null;
        for (var k = i + 1; k < blocs.length; k++) {
          if (!blocs[k].repondu) { suivant = blocs[k]; break; }
        }
        if (!suivant || !suivant.bloc.scrollIntoView) return;
        var depart = window.pageYOffset;
        glissement = setTimeout(function () {
          glissement = null;
          /* l'utilisateur a pris la main : on le laisse tranquille */
          if (Math.abs(window.pageYOffset - depart) > 80) return;
          try {
            suivant.bloc.scrollIntoView({ behavior: "smooth", block: "center" });
          } catch (e) {
            suivant.bloc.scrollIntoView(true);
          }
        }, PAUSE);
      }

      questions.forEach(function (q) {
        var bloc = el("div", "q");
        bloc.appendChild(el("div", "num", "QUESTION " + q.n));
        bloc.appendChild(el("div", "stem", q.stem));
        if (q.multi) {
          bloc.appendChild(el("div", "multi-hint",
            "Plusieurs réponses attendues — " + q.nbBonnes + " propositions à cocher."));
        }

        var lignes = [];
        var etat = { q: q, lignes: lignes, choix: null, repondu: false, juste: false, bloc: bloc };
        blocs.push(etat);

        /* ---------------- une seule bonne réponse : boutons radio ---------------- */
        if (!q.multi) {
          var choisi = false;
          q.opts.forEach(function (o) {
            var lab = el("label", "opt");
            var inp = document.createElement("input");
            inp.type = "radio";
            inp.name = "q" + q.n;
            lab.appendChild(inp);
            lab.appendChild(el("span", null, o.texte));
            lignes.push({ lab: lab, bonne: o.bonne, texte: o.texte });

            lab.addEventListener("click", function (ev) {
              if (choisi) { ev.preventDefault(); return; }
              choisi = true;
              etat.choix = o;
              etat.repondu = true;
              etat.juste = !!o.bonne;

              lignes.forEach(function (l) { l.lab.classList.add("locked"); });

              if (mode === "revision") {
                lignes.forEach(function (l) {
                  l.lab.querySelector("input").disabled = true;
                  if (l.bonne) l.lab.classList.add("correct");
                });
                if (!o.bonne) lab.classList.add("wrong");
                bloc.appendChild(el("div", "why",
                  (o.bonne ? "<b>Correct.</b> " : "<b>Réponse attendue :</b> " +
                    attendues(lignes) + ". ") + (q.why || "")));
              } else {
                lab.classList.add("selected");
              }

              recompter();
              if (repondu === total) {
                if (mode === "revision") afficherScore(justes);
                else if (btnFin) btnFin.classList.add("ready");
              } else {
                glisserApres(etat);
              }
            });

            bloc.appendChild(lab);
          });

        /* ------------- plusieurs bonnes réponses : cases à cocher ------------- */
        } else {
          var valide = false;
          q.opts.forEach(function (o) {
            var lab = el("label", "opt");
            var inp = document.createElement("input");
            inp.type = "checkbox";
            lab.appendChild(inp);
            lab.appendChild(el("span", null, o.texte));
            var ligne = { lab: lab, bonne: o.bonne, texte: o.texte, input: inp };
            lignes.push(ligne);

            inp.addEventListener("change", function () {
              if (valide) { inp.checked = !inp.checked; return; }
              lab.classList.toggle("selected", inp.checked);
              var coche = lignes.some(function (l) { return l.input.checked; });
              /* en révision la question ne compte qu'une fois validée ;
                 en examen, dès qu'une case est cochée */
              if (mode === "exam") { etat.repondu = coche; recompter(); }
              if (btnValider) btnValider.classList.toggle("ready", coche);
              if (mode === "exam" && repondu === total && btnFin) btnFin.classList.add("ready");
            });

            bloc.appendChild(lab);
          });

          /* corrige la question et affiche la justification */
          function corriger() {
            valide = true;
            var exact = lignes.every(function (l) { return l.input.checked === l.bonne; });
            etat.juste = exact;
            etat.repondu = true;
            etat.choix = lignes.filter(function (l) { return l.input.checked; });

            lignes.forEach(function (l) {
              l.lab.classList.add("locked");
              l.input.disabled = true;
              l.lab.classList.remove("selected");
              if (l.bonne) l.lab.classList.add("correct");
              else if (l.input.checked) l.lab.classList.add("wrong");
            });
            bloc.appendChild(el("div", "why",
              (exact ? "<b>Correct.</b> " : "<b>Réponses attendues :</b> " +
                attendues(lignes) + ". ") + (q.why || "")));
          }
          etat.corriger = corriger;

          var btnValider = null;
          if (mode === "revision") {
            var barreV = el("div", "valider-ligne");
            btnValider = el("button", "btn ghost valider", "Valider cette question");
            btnValider.type = "button";
            btnValider.addEventListener("click", function () {
              if (valide) return;
              corriger();
              barreV.remove();
              recompter();
              if (repondu === total) afficherScore(justes);
              else glisserApres(etat);
            });
            barreV.appendChild(btnValider);
            bloc.appendChild(barreV);
          }
        }

        root.appendChild(bloc);
      });

      /* bouton de fin — mode examen uniquement */
      var btnFin = null;
      if (mode === "exam") {
        var actions = el("div", "actions");
        btnFin = el("button", "btn quiz", "Corriger et voir mon score →");
        btnFin.type = "button";
        btnFin.addEventListener("click", function () {
          blocs.forEach(function (e) {
            /* plusieurs bonnes réponses : on réutilise la correction de la question */
            if (e.q.multi) { if (e.corriger) e.corriger(); return; }

            e.lignes.forEach(function (l) {
              l.lab.classList.add("locked");
              l.lab.querySelector("input").disabled = true;
              l.lab.classList.remove("selected");
              if (l.bonne) l.lab.classList.add("correct");
            });
            if (e.choix && !e.choix.bonne) {
              e.lignes.forEach(function (l) {
                if (l.texte === e.choix.texte) l.lab.classList.add("wrong");
              });
            }
            e.bloc.appendChild(el("div", "why",
              (e.choix && e.choix.bonne
                ? "<b>Correct.</b> "
                : "<b>Réponse attendue :</b> " + attendues(e.lignes) + ". ") + (e.q.why || "")));
          });
          actions.remove();
          recompter();
          afficherScore(justes);
        });
        actions.appendChild(btnFin);
        root.appendChild(actions);
      }

      /* ---- rappel des questions manquées ----
         Sous le score, les numéros des questions ratées. Un clic ramène à la
         question, qui se signale un instant ; les réponses y sont déjà
         corrigées, donc on voit ce qu'on avait coché et ce qu'il fallait.
         Une question laissée sans réponse est distinguée d'une fausse. */

      function montrerRetour(box) {
        if (!retour) {
          retour = el("button", "retour-score", "↑ Revenir au score");
          retour.type = "button";
          retour.addEventListener("click", function () { amener(box); });
          document.body.appendChild(retour);
          /* le bouton s'efface de lui-même quand le score revient à l'écran */
          if (window.IntersectionObserver) {
            new window.IntersectionObserver(function (entrees) {
              if (retour) retour.classList.toggle("visible", !entrees[0].isIntersecting);
            }, { threshold: 0.15 }).observe(box);
          }
        }
        retour.classList.add("visible");
      }

      /* rien de coché, rien de cliqué : la question a été sautée, pas ratée */
      function sansReponse(e) {
        if (e.q.multi) {
          return !e.lignes.some(function (l) { return l.input && l.input.checked; });
        }
        return !e.choix;
      }

      function listerRatees(box) {
        var ratees = blocs.filter(function (e) { return !e.juste; });
        if (!ratees.length) return;

        var zone = el("div", "ratees");
        zone.appendChild(el("div", "ratees-titre",
          (ratees.length === 1 ? "1 question à revoir" : ratees.length + " questions à revoir") +
          " — clique sur un numéro pour y retourner"));

        var liste = el("div", "ratees-liste");
        ratees.forEach(function (e) {
          var vide = sansReponse(e);
          var puce = el("button", "ratee" + (vide ? " vide" : ""), String(e.q.n));
          puce.type = "button";
          var enonce = e.bloc.querySelector(".stem");
          var quoi = vide ? "sans réponse" : "mauvaise réponse";
          puce.title = quoi.charAt(0).toUpperCase() + quoi.slice(1) +
                       (enonce ? " — " + enonce.textContent : "");
          puce.setAttribute("aria-label",
            "Question " + e.q.n + ", " + quoi +
            (enonce ? " : " + enonce.textContent : ""));
          puce.addEventListener("click", function () {
            amener(e.bloc);
            e.bloc.classList.remove("vise");
            void e.bloc.offsetWidth;            /* relance l'animation */
            e.bloc.classList.add("vise");
            montrerRetour(box);
          });
          liste.appendChild(puce);
        });

        zone.appendChild(liste);
        box.appendChild(zone);
      }

      function afficherScore(justes) {
        /* un glissement encore en attente arracherait l'écran au score */
        if (glissement) { clearTimeout(glissement); glissement = null; }
        var pct = Math.round(justes / total * 100);
        var box = el("div", "score " + (pct >= 70 ? "good" : pct >= 50 ? "" : "bad"));
        var msg = pct >= 90 ? "Maîtrisé. Passe à la fiche suivante."
                : pct >= 70 ? "Bonne base. Reprends les questions ratées."
                : pct >= 50 ? "À consolider : relis la fiche avant de refaire le quiz."
                : "Reprends la fiche depuis le début, puis refais le quiz.";
        box.innerHTML =
          '<div class="score-mode">' + (mode === "exam" ? "Mode examen" : "Mode révision") + '</div>' +
          '<div class="big">' + justes + " / " + total + "  (" + pct + "%)</div>" +
          '<p class="msg">' + msg + "</p>";
        listerRatees(box);
        var act = el("div", "actions");
        var again = el("button", "btn quiz", "Refaire le quiz");
        again.type = "button";
        again.addEventListener("click", function () { location.reload(); });
        act.appendChild(again);
        var swap = el("button", "btn ghost",
          mode === "exam" ? "Refaire en mode révision" : "Passer en mode examen");
        swap.type = "button";
        swap.addEventListener("click", function () {
          localStorage.setItem("pratiqueQuizMode", mode === "exam" ? "revision" : "exam");
          location.reload();
        });
        act.appendChild(swap);
        var back = el("a", "btn ghost", "Revoir la fiche");
        back.href = data.fiche || "fiche.html";
        act.appendChild(back);
        box.appendChild(act);
        root.parentNode.insertBefore(box, root);
        amener(box);
      }

      majBarre();
    }
  };
})();
