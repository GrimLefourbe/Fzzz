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
