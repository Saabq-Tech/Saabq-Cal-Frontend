import "@testing-library/jest-dom";

// Mock window.matchMedia for responsive UI components
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock element scrolling methods in jsdom
Element.prototype.scrollBy = function () {};
Element.prototype.scrollTo = function () {};
Element.prototype.scrollIntoView = function () {};
