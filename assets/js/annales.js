/* Annales : les schémas ne se chargent qu'à l'ouverture (data-src → src),
   boutons « Tout déplier » / « Tout replier » pour les corrigés. */
(function () {
  "use strict";

  function charger(det) {
    var img = det.querySelector("img[data-src]");
    if (img && !img.getAttribute("src")) img.setAttribute("src", img.getAttribute("data-src"));
  }

  document.addEventListener("toggle", function (ev) {
    var det = ev.target;
    if (det && det.classList && det.classList.contains("schema") && det.open) charger(det);
  }, true);

  function tous(ouvrir) {
    var liste = document.querySelectorAll("details.corrige");
    for (var i = 0; i < liste.length; i++) liste[i].open = ouvrir;
  }
  var dep = document.getElementById("tout-deplier");
  var rep = document.getElementById("tout-replier");
  if (dep) dep.addEventListener("click", function () { tous(true); });
  if (rep) rep.addEventListener("click", function () { tous(false); });

  /* à l'impression, on montre tout : corrigés et schémas */
  window.addEventListener("beforeprint", function () {
    var d = document.querySelectorAll("details.corrige, details.schema");
    for (var i = 0; i < d.length; i++) { d[i].open = true; charger(d[i]); }
  });
})();
