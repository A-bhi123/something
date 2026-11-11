import { useLayoutEffect, useState } from "react";
import { letterContent } from "./letterContent";

/** Paper geometry shared by the folded letter and the extra pages. All text is laid out on whole ruled lines. */
export function pageGeometry(pw: number, ph: number) {
  const lh = pw * 0.054;
  const padTop = pw * 0.085;
  const fontSize = pw * 0.039;
  /** How many ruled lines of text fit on one page. */
  const lines = Math.floor((ph - padTop) / lh);
  return { lh, padTop, fontSize, lines };
}

/** Measures the whole letter and returns how many pages it needs (1 = it fits on the first page). */
export function useLetterPages(pw: number, ph: number): number {
  const [pages, setPages] = useState(1);
  useLayoutEffect(() => {
    let cancelled = false;
    const { lh, fontSize, lines } = pageGeometry(pw, ph);
    const measure = () => {
      const el = document.createElement("div");
      el.className = "sheet__text";
      el.style.cssText = `position:absolute;visibility:hidden;left:-9999px;top:0;width:${pw}px;font-size:${fontSize}px;line-height:${lh}px`;
      letterContent.body.forEach((b) => {
        if (b === "gap") {
          const d = document.createElement("div");
          d.style.height = `${lh}px`;
          el.appendChild(d);
        } else {
          const p = document.createElement("p");
          p.textContent = b.text;
          el.appendChild(p);
        }
      });
      document.body.appendChild(el);
      const totalLines = Math.round(el.scrollHeight / lh);
      document.body.removeChild(el);
      if (!cancelled) setPages(Math.max(1, Math.ceil(totalLines / lines)));
    };
    measure();
    // The handwriting font may load late and change the line breaks, so measure again once fonts are ready.
    void document.fonts?.ready.then(() => !cancelled && measure());
    return () => {
      cancelled = true;
    };
  }, [pw, ph]);
  return pages;
}
