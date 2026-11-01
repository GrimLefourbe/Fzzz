import { describe, expect, test } from "bun:test";
import { creerPage } from "./harnais";

const page = creerPage(
  ["js/class/Utils.js", "js/class/Parametre.js", "js/class/Joueur.js"],
  "var METHODE_FLOOD = [], AFFECTATION_RESSOURCE = [], RATIO_RECOLTE = {};",
);
page.lire(`document.body.innerHTML = '<div id="quantite_tdc">39028</div>';
  var monProfil = new Joueur({ pseudo: "DoggyBag" });`);

// cellules à gauche et à droite du terrain, vides (compte sans Compte+) ou remplies par le jeu
const epees = (pseudo: string, terrain: number, gauche = "", droite = "") =>
  page.lire<string[]>(`(() => {
    let $g = $("<td>${gauche}</td>"), $d = $("<td>${droite}</td>");
    Joueur.epeesPortee(new Joueur({ pseudo: "${pseudo}", terrain: ${terrain} }), $g, $d);
    return [$g.find(".o_epeeBleue").length ? "bleue" : $g.text(), $d.find(".o_epeeRouge").length ? "rouge" : $d.text()];
  })()`);

describe("épées de portée sans Compte+ (mon TdC : 39 028 cm²)", () => {
  test("mêmes épées que le jeu sur la capture du mainteneur", () => {
    expect(epees("DogGyneco", 132876)).toEqual(["", ""]);
    expect(epees("DonLapatte", 95415)).toEqual(["", "rouge"]);
    expect(epees("Spike", 79201)).toEqual(["", "rouge"]);
    expect(epees("SerPounce", 74815)).toEqual(["bleue", "rouge"]);
    expect(epees("Canaille", 39574)).toEqual(["bleue", "rouge"]);
  });
  test("cellules du jeu (Compte+) laissées telles quelles, rien sur ma ligne", () => {
    expect(epees("Canaille", 39574, "jeu", "jeu")).toEqual(["jeu", "jeu"]);
    expect(epees("DoggyBag", 39028)).toEqual(["", ""]);
  });
});
