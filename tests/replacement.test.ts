import { describe, expect, test } from "bun:test";
import { creerPage } from "./harnais";

const page = creerPage(
  [
    "js/class/Utils.js",
    "js/class/Parametre.js",
    "js/class/Joueur.js",
    "js/class/Armee.js",
    "js/page/Armee.js",
  ],
  `var METHODE_FLOOD = [], AFFECTATION_RESSOURCE = [], RATIO_RECOLTE = {};
   var NOM_UNITE = ["Ouvrière", "Jeune Soldate Naine", "Soldate Naine", "Naine d’Elite"];`,
);

/** Replacement prévu : [indice d'unité, terrain, dôme] ou null si déjà placé. */
function prevu(
  armee: { tdc?: object; dome?: object; loge?: object },
  parametres: { terrain: number; dome: number; unite: number },
) {
  return page.lire(`(() => {
    localStorage.setItem("outiiil_parametre", JSON.stringify({ uniteAntisondeTerrain: ${parametres.terrain}, uniteAntisondeDome: ${parametres.dome}, uniteReplacement: ${parametres.unite} }));
    window.monProfil = new Joueur({ pseudo: "Moi" }).getParametre();
    let p = Object.create(PageArmee.prototype), appel = null;
    p._armeeTdc = new Armee({ unite: ${JSON.stringify(armee.tdc || {})} });
    p._armeeDome = new Armee({ unite: ${JSON.stringify(armee.dome || {})} });
    p._armeeLoge = new Armee({ unite: ${JSON.stringify(armee.loge || {})} });
    p.replacer = (i, t, d) => (appel = [i, t, d]);
    let f = p.placementPrevu();
    if (f) f();
    return [p.indiceUniteReplacement(), appel];
  })()`);
}

describe("replacement de l'armée", () => {
  test("nombres tirés entre 90 % et 100 % des maximums des préférences", () => {
    for (let k = 0; k < 50; k++) {
      const [, appel] = prevu(
        { loge: { "Jeune Soldate Naine": 1000 } },
        { terrain: 100, dome: 50, unite: 0 },
      ) as [number, number[]];
      expect(appel[0]).toBe(0);
      expect(appel[1]).toBeGreaterThanOrEqual(90);
      expect(appel[1]).toBeLessThanOrEqual(100);
      expect(appel[2]).toBeGreaterThanOrEqual(45);
      expect(appel[2]).toBeLessThanOrEqual(50);
    }
  });
  test("unité choisie dans les préférences, sinon la première disponible", () => {
    const armee = { loge: { "Jeune Soldate Naine": 1000, "Naine d’Elite": 500 } };
    expect((prevu(armee, { terrain: 10, dome: 0, unite: 3 }) as [number, number[]])[1][0]).toBe(2);
    expect((prevu(armee, { terrain: 10, dome: 0, unite: 0 }) as [number, number[]])[1][0]).toBe(0);
  });
  test("unité choisie absente : rien de prévu", () => {
    expect(
      prevu({ loge: { "Jeune Soldate Naine": 1000 } }, { terrain: 10, dome: 5, unite: 2 }),
    ).toEqual([-1, null]);
  });
  test("déjà placée : rien ; pas assez d'unités : 1 en terrain, 30 % en dôme", () => {
    expect(
      prevu(
        {
          tdc: { "Jeune Soldate Naine": 95 },
          dome: { "Jeune Soldate Naine": 48 },
          loge: { "Jeune Soldate Naine": 900, "Soldate Naine": 50 },
        },
        { terrain: 100, dome: 50, unite: 0 },
      ),
    ).toEqual([0, null]);
    expect(
      prevu({ loge: { "Jeune Soldate Naine": 40 } }, { terrain: 100, dome: 50, unite: 0 }),
    ).toEqual([0, [0, 1, 12]]);
  });
});
