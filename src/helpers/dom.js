// DOM helpers for selecting elements and rendering HTML.
export const qs = (sel, parent = document) => parent.querySelector(sel);

export const setHTML = (el, html) => {
  el.innerHTML = html;
};
