import { describe, expect, test } from "bun:test";
import { creerPage } from "./harnais";

const page = creerPage(["js/class/Utils.js", "js/page/Attaquer.js"]);

// liste « Fourmilières à portée de Phéromones » : Alliance | Pseudo | … (ligne d'en-tête en <th>)
const liste = (lignes: [string, string][]) =>
  page.lire(
    `document.body.innerHTML = '<table id="tabEnnemie"><tr><th>Alliance</th><th>Pseudo</th></tr>${lignes
      .map(([a, p]) => `<tr><td><a>${a}</a></td><td><a>${p}</a></td><td></td></tr>`)
      .join("")}</table>'`,
  );
const visibles = () =>
  page.lire<string[]>(
    `$("#tabEnnemie tr").filter((i, tr) => tr.style.display != "none" && $(tr).children("td").length).map((i, tr) => $(tr).children("td").eq(1).text()).get()`,
  );

describe("page Ennemies : filtre de la liste", () => {
  const lignes: [string, string][] = [
    ["-VIK-", "pecheurfou"],
    ["OUAF", "DirtyPaws"],
    ["ANGE", "maxououou"],
    ["", "weed.w"],
  ];
  test("pseudo ou alliance, casse ignorée, compte", () => {
    liste(lignes);
    expect(page.lire(`PageAttaquer.filtrerEnnemis("ouaf")`)).toEqual({ visibles: 1, total: 4 });
    expect(visibles()).toEqual(["DirtyPaws"]);
    page.lire(`PageAttaquer.filtrerEnnemis("WEED")`);
    expect(visibles()).toEqual(["weed.w"]);
  });
  test("plusieurs termes séparés par « ; », champ vide : tout revient", () => {
    liste(lignes);
    page.lire(`PageAttaquer.filtrerEnnemis("vik; ange ;")`);
    expect(visibles()).toEqual(["pecheurfou", "maxououou"]);
    page.lire(`PageAttaquer.filtrerEnnemis("  ")`);
    expect(visibles()).toHaveLength(4);
  });
});

describe("page Ennemies : afficher tous les joueurs", () => {
  const formulaire = (attaquable: boolean, attaquante: boolean) =>
    page.lire(
      `document.body.innerHTML = '<input id="terrain_max" value="179 354"><input id="terrain_min" value="29 893">' +
        '<input type="checkbox" id="fourmiliere_attaquable" ${attaquable ? "checked" : ""}><input type="checkbox" id="fourmiliere_attaquante" ${attaquante ? "checked" : ""}><input id="page" value="3">'`,
    );
  const etat = () =>
    page.lire(
      `[$("#terrain_max").val(), $("#terrain_min").val(), $("#fourmiliere_attaquable")[0].checked, $("#fourmiliere_attaquante")[0].checked, $("#page").val()]`,
    );
  test("tous : limites de terrain à 0, cases de portée décochées, page 1", () => {
    formulaire(true, true);
    page.lire(`PageAttaquer.preparerTousEnnemis(true)`);
    expect(etat()).toEqual(["0", "0", false, false, "1"]);
  });
  test("retour à la portée : case « je peux attaquer » recochée", () => {
    formulaire(false, false);
    page.lire(`PageAttaquer.preparerTousEnnemis(false)`);
    expect(etat()[2]).toBe(true);
  });
});
