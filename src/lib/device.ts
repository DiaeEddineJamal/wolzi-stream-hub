// Mouse/trackpad devices get hover-only extras (card backdrops, SVG glass refraction); touch devices skip their cost.
export const canHover=typeof window!=='undefined'&&window.matchMedia('(hover:hover) and (pointer:fine)').matches;

