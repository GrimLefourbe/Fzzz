import { describe, expect, test } from "bun:test";
import { creerPage } from "./harnais";

const page = creerPage(["js/boite/Dock.js"]);

const detecte = (html: string) =>
  page.lire<boolean>(
    `(() => { document.body.innerHTML = ${JSON.stringify(html)}; return Dock.autreExtension(); })()`,
  );

describe("Toolzzz ou Outiiil active en même temps", () => {
  test("notre barre seule : rien", () => {
    expect(detecte(`<div id="o_boiteExtension"><div id="o_toolbarOutiiil"></div></div>`)).toBe(
      false,
    );
    expect(detecte(`<div id="o_boiteExtension"></div>`)).toBe(false);
  });
  test("barre de Toolzzz/Outiiil hors de notre encadré, même masquée ou avant la nôtre", () => {
    expect(
      detecte(
        `<div id="o_toolbarOutiiil" style="display:none"></div><div id="o_boiteExtension"><div id="o_toolbarOutiiil"></div></div>`,
      ),
    ).toBe(true);
    expect(detecte(`<div id="o_boiteExtension"></div><div id="o_toolbarOutiiil"></div>`)).toBe(
      true,
    );
  });
});
