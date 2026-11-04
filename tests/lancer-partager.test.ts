import { describe, expect, test } from "bun:test";
import { creerPage } from "./harnais";

const page = creerPage(
  ["js/class/Utils.js", "js/page/Attaquer.js"],
  `var AFFICHAGES_ONGLET = {}, TOAST_ERROR = {}, toasts = [], envois = [];
   var monProfil = { getTempsParcours2: () => 600 };
   var Horloge = { clic: () => moment(), libelleLatence: () => "" };
   var AttaqueLancee = { enregistrer: (cible, lieu, unite, o) => envois.push({ lieu, partager: !!o.partager }) };`,
);
page.lire(`$.toast = (o) => toasts.push(o.text); Utils.incrementTime = () => {};`);

// formulaire d'attaque du jeu (structure de ennemie.php?Attaquer=…)
const ouvrir = () =>
  page.lire(`(() => {
    toasts.length = 0; envois.length = 0;
    document.body.innerHTML = \`<form id="formulaireChoixArmee"><fieldset><select id="lieu" name="lieu">
      <option value="1">Terrain de Chasse</option><option value="2">Fourmilière</option><option value="3">Loge Impériale</option></select></fieldset>
      <fieldset><table id="tabChoixArmee"><tr><td>Jeune Soldate Naine</td><td><input id="unite1" value="10"/></td></tr></table>
      <center><input type="submit" name="ChoixArmee" value="Attaquer X !"/></center></fieldset></form>\`;
    // aucun vrai envoi : on compte les soumissions
    document.querySelector("form").addEventListener("submit", (e) => e.preventDefault());
    window.p = Object.create(PageAttaquer.prototype);
    p._cible = { pseudo: "X", terrain: 1000, attenteSynchro: () => 30 };
    p.ajouterBoutons();
  })()`);
const etat = () =>
  page.lire<{ partager: string; desactive: boolean; envois: object[]; toasts: string[] }>(`({
    partager: $("#o_lancerPartager").css("visibility"),
    desactive: $("#o_lancerPartager").prop("disabled"),
    envois: envois.slice(), toasts: toasts.slice() })`);

describe("page d'attaque : boutons sous celui du jeu", () => {
  test("le bouton du jeu reste en place, nos boutons dessous, inactifs avant le profil", () => {
    ouvrir();
    expect(
      page.lire(
        `(() => { let b = $("input[name='ChoixArmee']"); return [b.parent().is("center"), b.index(), b.next().attr("id")]; })()`,
      ),
    ).toEqual([true, 0, "o_btnLancer"]);
    expect(page.lire(`$("#o_sonder, #o_sonderDirect").length`)).toBe(0);
    expect(etat().desactive).toBe(true);
    page.lire(`p.activerBoutons()`);
    expect(etat().desactive).toBe(false);
  });
  test("« Lancer + partager » : terrain de chasse seulement, une fois par clic", () => {
    ouvrir();
    page.lire(
      `p.activerBoutons(); $("#o_lancerPartager")[0].click(); $("#o_lancerPartager")[0].click(); $("#o_lancerPartager").click();`,
    );
    expect(etat().envois).toEqual([{ lieu: "Terrain de Chasse", partager: true }]);
    expect(etat().desactive).toBe(true);
  });
  test("lieu passé en loge (même sans événement) : masqué, rien n'est envoyé", () => {
    ouvrir();
    page.lire(`p.activerBoutons(); $("#lieu").val("3").trigger("change");`);
    expect(etat().partager).toBe("hidden");
    // valeur remise par le navigateur sans « change »
    ouvrir();
    page.lire(`p.activerBoutons(); $("#lieu").val("3"); $("#o_lancerPartager").click();`);
    const e = etat();
    expect(e.envois).toEqual([]);
    expect(e.toasts.length).toBe(1);
    expect(e.partager).toBe("hidden");
  });
  test("le bouton du jeu envoie le lieu choisi, sans partage", () => {
    ouvrir();
    page.lire(`p.activerBoutons(); $("#lieu").val("2"); $("input[name='ChoixArmee']")[0].click();`);
    expect(etat().envois).toEqual([{ lieu: "Fourmilière", partager: false }]);
  });
});
