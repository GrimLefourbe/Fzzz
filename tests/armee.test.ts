import { describe, expect, test } from "bun:test";
import { creerPage } from "./harnais";

// constantes du jeu (content.js) ; l'encart « Connexion » empêche le démarrage
const page = creerPage(
  [
    "js/class/Utils.js",
    "js/class/Parametre.js",
    "js/class/Joueur.js",
    "js/class/Armee.js",
    "js/class/Combat.js",
    "js/content.js",
  ],
  `var chrome = { runtime: { getManifest: () => ({ version: "0" }), getURL: (p) => p } };
   document.body.innerHTML = "<div class='boite_connexion_titre'>Connexion</div>";`,
);

describe("Armee.parseArmee", () => {
  test("abréviations : jsn, tk, tu (Tueuses), tue", () => {
    const unites = page.lire<number[]>(
      `new Armee().parseArmee("30 jsn, 2 tk, 7 tu et 4 tue").unite.slice()`,
    );
    // index : 0 JSN … 10 Tank, 12 Tueuse, 13 Tueuse d'élite
    expect(unites[0]).toBe(30);
    expect(unites[10]).toBe(2);
    expect(unites[12]).toBe(7);
    expect(unites[13]).toBe(4);
  });

  test("texte d'une armée du jeu", () => {
    const unites = page.lire<number[]>(
      `new Armee().parseArmee("1 919 Jeunes Soldates Naines, 50 Soldates Naines, 3 Tanks").unite.slice()`,
    );
    expect(unites[0]).toBe(1919);
    expect(unites[1]).toBe(50);
    expect(unites[10]).toBe(3);
  });
});

// libellés de la page Armée du s5 relevés le 24/11/2026 : « d’Élite », alors que
// NOM_UNITE (et les rapports du 06/11) écrivent « Naine d’Elite », « … d’élite »
const LIBELLES_2026_11 = [
  ["Jeune Soldate Naine", 1, 9],
  ["Soldate Naine", 2, 6644],
  ["Naine d’Élite", 3, 5247],
  ["Jeune Soldate", 4, 320],
  ["Soldate", 5, 921],
  ["Concierge", 6, 0],
  ["Artilleuse", 7, 62390],
  ["Artilleuse d’Élite", 8, 79778],
  ["Soldate d’Élite", 9, 4959],
  ["Tank", 10, 0],
  ["Tueuse", 11, 0],
  ["Tueuse d’Élite", 12, 3],
] as const;
// lignes au format du jeu : un lieu vide est une case, un lieu occupé trois
const pageArmee = (libelles: readonly (readonly [string, number, number])[]) =>
  "<table class='simulateur'><tr><td colspan=10><h3> Troupes en Garnison </h3></td></tr>" +
  libelles
    .map(
      ([nom, k, n]) =>
        `<tr align="center"><td><div class="pas_sur_telephone">${nom}</div><div class="que_sur_telephone">X</div></td>` +
        `<td colspan="3"></td><td colspan="3"></td>` +
        (n
          ? `<td style="width:20px"></td><td style="width:120px"><span class="cliquable" onclick="remplirFormulaire(${n},'unite${k}',3,2);">${n.toLocaleString("fr-FR")}</span></td><td style="width:20px"></td>`
          : `<td colspan="3"></td>`) +
        "</tr>",
    )
    .join("") +
  `<tr align="center"><td><span class="cliquable">Vie</span></td><td colspan="3">16</td><td colspan="3">162</td><td colspan="3">5</td></tr>` +
  `<tr align="center"><td><div class="pas_sur_telephone">Consommation Journalière</div></td><td colspan="3">0</td><td colspan="3">14</td><td colspan="3">999 624</td></tr>` +
  "</table>";

describe("Utils.indiceNomUnite", () => {
  test("un nom exact donne le même indice que indexOf, au singulier et au pluriel", () => {
    expect(
      page.lire(`[
        NOM_UNITE.every((n, i) => Utils.indiceNomUnite(n) === i),
        NOM_UNITES.every((n, i) => Utils.indiceNomUnite(n, NOM_UNITES) === i),
      ]`),
    ).toEqual([true, true]);
  });

  test("écritures du jeu de novembre 2026 : « d’Élite »", () => {
    expect(
      page.lire(
        `["Naine d’Élite", "Artilleuse d’Élite", "Soldate d’Élite", "Tueuse d’Élite", "Concierge d’Élite", "Tank d’Élite"].map((n) => Utils.indiceNomUnite(n))`,
      ),
    ).toEqual([3, 9, 10, 14, 7, 12]);
    expect(
      page.lire(
        `["Naines d’Élites", "Artilleuses d'élites", " tueuses  d’ELITES "].map((n) => Utils.indiceNomUnite(n, NOM_UNITES))`,
      ),
    ).toEqual([3, 9, 14]);
  });

  test("le texte entier doit être un nom : ni préfixe, ni phrase, ni singulier pour pluriel", () => {
    expect(
      page.lire(
        `["", "   ", "Vie", "Consommation Journalière", "Artilleuse d’", "Artilleuse d’Élite en loge", "Soldates", "12 Tanks", null, undefined].map((n) => Utils.indiceNomUnite(n))`,
      ),
    ).toEqual([-1, -1, -1, -1, -1, -1, -1, -1, -1, -1]);
    // « Artilleuse » ne devient pas « Artilleuse d’élite », ni l'inverse
    expect(
      page.lire(`[Utils.indiceNomUnite("Artilleuse"), Utils.indiceNomUnite("artilleuse")]`),
    ).toEqual([8, 8]);
  });

  test("deux noms d'une table n'ont jamais la même clé", () => {
    expect(
      page.lire(
        `[NOM_UNITE, NOM_UNITES].map((t) => new Set(t.map((n) => Utils.cleUnite(n))).size)`,
      ),
    ).toEqual([15, 15]);
  });
});

describe("Armee.chargeData", () => {
  const attendu = [9, 6644, 5247, 320, 921, 0, 0, 62390, 79778, 4959, 0, 0, 0, 3];

  test("page de novembre 2026 : les unités d'élite sont comptées", () => {
    expect(
      page.lire<number[]>(
        `new Armee().chargeData(${JSON.stringify(pageArmee(LIBELLES_2026_11))}).unite.slice()`,
      ),
    ).toEqual(attendu);
  });

  test("page aux anciens libellés (ceux de NOM_UNITE) : même armée", () => {
    const anciens = page.lire<string[]>(`NOM_UNITE.slice()`);
    const indices = [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 13, 14];
    const libelles = LIBELLES_2026_11.map(
      ([, k, n], i) => [anciens[indices[i] ?? 0] ?? "", k, n] as const,
    );
    expect(
      page.lire<number[]>(
        `new Armee().chargeData(${JSON.stringify(pageArmee(libelles))}).unite.slice()`,
      ),
    ).toEqual(attendu);
  });
});

describe("Utils.timeToInt", () => {
  test("jours, heures, minutes, secondes, espaces multiples", () => {
    expect(page.lire(`Utils.timeToInt("1J 2h 3m 4s")`)).toBe(86400 + 7200 + 180 + 4);
    expect(page.lire(`Utils.timeToInt("2h  05m")`)).toBe(7500);
  });
});

describe("Combat.simuler", () => {
  test("s'arrête même avec des niveaux non numériques", () => {
    const tours = page.lire<number>(`(() => {
      let c = new Combat({});
      c.armee1.unite[0] = 1000;
      c.armee2.unite[0] = 1000;
      c.attaquant.niveauRecherche[1] = NaN; c.attaquant.niveauRecherche[2] = NaN;
      c.defenseur.niveauRecherche[1] = NaN; c.defenseur.niveauRecherche[2] = NaN;
      c.simuler();
      return c._tour.length;
    })()`);
    expect(tours).toBeLessThanOrEqual(1000);
  });
});

describe("Armee.envoyerChasse", () => {
  test("s'arrête au premier refus et appelle `fin` avec le compte", async () => {
    page.lire(`
      var monProfil = { niveauRecherche: [0, 0, 0, 0, 0, 0] };
      var TroupesDehors = { enregistrerChasse() {} };
      window.reponses = ["La chasse est lancée.", "Erreur", "La chasse est lancée."]; window.postes = 0;
      Armee.posterChasse = () => Promise.resolve(window.reponses[window.postes++]);
      window.bilan = null;
      var a = new Armee(); a._repartition = [[1], [1], [1]];
      a.envoyerChasse(10, 3, 0, 0, (lancees, total) => { window.bilan = [lancees, total]; });
    `);
    await new Promise((r) => setTimeout(r, 30));
    expect(page.lire(`JSON.stringify(window.bilan)`)).toBe("[1,3]");
    expect(page.lire(`window.postes`)).toBe(2);
  });
});
