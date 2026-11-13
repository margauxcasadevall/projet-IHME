const appBasePath = import.meta.env.BASE_URL;

export default function Brand({ dark = false }) {
  return (
    <a className={`brand ${dark ? "brand-dark" : ""}`} href={appBasePath} aria-label="Zou!, accueil">
      <svg className="brand-mark" viewBox="0 0 60 44" aria-hidden="true">
        <path className="brand-z" d="M7 8h45L12 36h41" />
        <g className="brand-people">
          <circle cx="19" cy="14" r="2.1" />
          <path d="m18 17 3 3-2 4m-1-5-3 3m5-2 4 1m-6 3-2 4m4-4 3 3" />
          <circle cx="35" cy="23" r="2" />
          <path d="m34 25 3 2-1 4m-2-4-4 2m4-2 4-2" />
          <circle cx="29" cy="33" r="3" />
          <circle cx="40" cy="33" r="3" />
          <path d="m29 33 4-6 4 6h-8l3-4 4 4m-2-7 3 1" />
          <circle cx="46" cy="28" r="1.8" />
          <path d="m45 30 1 4m-1-3-3 2m4-1 3 2m-3 0-2 3m3-3 3 2" />
        </g>
      </svg>
      <span className="brand-word">Zou<span>!</span></span>
    </a>
  );
}
