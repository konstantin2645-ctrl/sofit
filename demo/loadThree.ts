/* Loads three.js from cdnjs on demand (only the 3D light rig needs it). */
declare global {
  interface Window {
    THREE?: unknown;
    __loadThree: () => Promise<unknown>;
  }
}
let p: Promise<unknown> | null = null;
window.__loadThree = () =>
  (p ??= new Promise((resolve, reject) => {
    if (window.THREE) return resolve(window.THREE);
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    s.async = true;
    s.onload = () => resolve(window.THREE);
    s.onerror = () => {
      p = null;
      reject(new Error("three.js unavailable"));
    };
    document.head.appendChild(s);
  }));
export {};
