import { tl } from "../../labels";
import { BookLink, Brand, Media, Sections } from "../shared/parts";
import { navItems, rootProps } from "../shared/helpers";
import "./creative.css";

export default function CreativeTemplate({ site }) {
  const L = site.lang;
  const arrow = L === "ar" ? "←" : "→";
  const whatsappDigits = site.whatsapp.replace(/[^\d]/g, "");
  const nav = navItems(site, {
    gallery: tl(L, "creativeWork"),
    about: tl(L, "creativeAbout"),
    services: tl(L, "creativePackages"),
  });
  const footerLine = [site.address, site.email].filter(Boolean).join(" · ");

  return (
    <div {...rootProps(site, "t-creative")}>
      <header className="wrap cr-nav">
        <Brand site={site} className="cr-brand" />
        <nav aria-label={tl(L, "menu")}>
          {nav.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="tap">
              {n.label}
            </a>
          ))}
          <BookLink site={site} className="tap cr-u" />
        </nav>
      </header>
      <section className="wrap cr-hero">
        <h1>{site.headline}</h1>
      </section>

      <Sections
        site={site}
        render={{
          gallery: () =>
            site.gallery.length > 0 && (
              <section id="gallery" className="wrap">
                <div className="cr-grid">
                  {site.gallery.map((g) => (
                    <Media
                      key={g.id}
                      site={site}
                      src={g.image}
                      label={g.caption || tl(L, "photo")}
                    />
                  ))}
                </div>
              </section>
            ),
          about: () => (
            <section id="about" className="wrap cr-section cr-about">
              <h2 className="cr-label">{tl(L, "creativeAbout")}</h2>
              <div>
                <p className="cr-big">{site.about}</p>
                {site.aboutMore && <p className="cr-muted">{site.aboutMore}</p>}
              </div>
            </section>
          ),
          services: () =>
            site.services.length > 0 && (
              <section id="services" className="cr-dark">
                <div className="wrap cr-section">
                  <h2 className="cr-label">{tl(L, "creativePackages")}</h2>
                  <div className="cr-packages">
                    {site.services.map((s) => (
                      <div key={s.id}>
                        <div className="cr-pk__top">
                          <h3>
                            <a href={s.href}>{s.title}</a>
                          </h3>
                          <span>{s.price}</span>
                        </div>
                        <p>{s.desc}</p>
                      </div>
                    ))}
                  </div>
                  <p className="cr-muted cr-muted--dark">
                    {tl(L, "creativeBigger")}
                  </p>
                </div>
              </section>
            ),
          highlights: () =>
            site.highlights.length > 0 && (
              <section className="wrap cr-section cr-steps">
                {site.highlights.map((h, i) => (
                  <div key={h.id}>
                    <span className="cr-n">
                      {(i + 1).toLocaleString(L === "ar" ? "ar-EG" : "en")}
                    </span>
                    <p>
                      <strong>{h.title}</strong>
                      <br />
                      {h.desc}
                    </p>
                  </div>
                ))}
              </section>
            ),
          booking: () => (
            <section id="booking" className="wrap cr-section cr-contact">
              <p className="cr-ask">{tl(L, "creativeAsk")}</p>
              <div className="cr-actions">
                <BookLink site={site} className="tap cr-row cr-row--solid">
                  <span>{site.bookingLabel}</span>
                  <span aria-hidden="true">{arrow}</span>
                </BookLink>
                {whatsappDigits && (
                  <a
                    href={`https://wa.me/${whatsappDigits}`}
                    className="tap cr-row"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>{tl(L, "whatsapp")}</span>
                    <span aria-hidden="true">{arrow}</span>
                  </a>
                )}
              </div>
            </section>
          ),
        }}
      />

      <footer className="wrap cr-footer">
        <span>{footerLine}</span>
        <span>{tl(L, "poweredBy")}</span>
      </footer>
    </div>
  );
}
