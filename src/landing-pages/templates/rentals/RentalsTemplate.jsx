import { tl } from "../../labels";
import { Brand, ContactLine, FaqList, Media, Sections } from "../shared/parts";
import { hoursLine, navItems, rootProps } from "../shared/helpers";
import { UnitsSection } from "../shared/units";
import "./rentals.css";

/** Vacation homes: chalets, apartments, villas and camps booked by night or by day. */
export default function RentalsTemplate({ site }) {
  const L = site.lang;
  const nav = navItems(site, {
    units: tl(L, "rentalsStays"),
    about: tl(L, "about"),
    gallery: tl(L, "gallery"),
    faq: tl(L, "faq"),
    contact: tl(L, "contact"),
  });
  const single = site.units.length === 1;
  const whatsappDigits = site.whatsapp.replace(/[^\d]/g, "");

  return (
    <div {...rootProps(site, "t-rentals")}>
      <header className="wrap rt-nav">
        <Brand site={site} className="rt-brand" />
        <nav aria-label={tl(L, "menu")}>
          {nav.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="tap">
              {n.label}
            </a>
          ))}
        </nav>
      </header>

      <section className="rt-hero">
        <Media
          site={site}
          src={site.heroImage || site.units[0]?.photo}
          label={tl(L, "heroPhoto")}
          className="rt-hero__img"
        />
        <div className="rt-hero__shade" />
        <div className="wrap rt-hero__text">
          {site.kicker && <p className="rt-kicker">{site.kicker}</p>}
          <h1>{site.headline}</h1>
          {site.intro && <p className="rt-lead">{site.intro}</p>}
          <div className="rt-actions">
            <a
              href={single ? site.units[0].href : "#units"}
              className="tap rt-btn"
            >
              {single ? tl(L, "unitBookNow") : tl(L, "rentalsBrowse")}
            </a>
            <a href={site.bookingUrl} className="tap rt-btn rt-btn--ghost">
              {tl(L, "rentalsCall")}
            </a>
          </div>
        </div>
      </section>

      <Sections
        site={site}
        render={{
          units: () => (
            <UnitsSection
              site={site}
              title={single ? "" : tl(L, "rentalsStaysTitle")}
            />
          ),
          about: () =>
            (site.about || site.aboutMore) && (
              <section id="about" className="rt-soft">
                <div className="wrap rt-section rt-about">
                  <h2>{tl(L, "rentalsAbout")}</h2>
                  <div>
                    {site.about && <p>{site.about}</p>}
                    {site.aboutMore && <p>{site.aboutMore}</p>}
                  </div>
                </div>
              </section>
            ),
          highlights: () =>
            site.highlights.length > 0 && (
              <section className="wrap rt-section">
                <h2>{tl(L, "rentalsWhy")}</h2>
                <div className="rt-highlights">
                  {site.highlights.map((h) => (
                    <div key={h.id}>
                      <strong>{h.title}</strong>
                      {h.desc && <p>{h.desc}</p>}
                    </div>
                  ))}
                </div>
              </section>
            ),
          gallery: () =>
            site.gallery.length > 0 && (
              <section id="gallery" className="wrap rt-section">
                <h2>{tl(L, "gallery")}</h2>
                <div className="rt-gallery">
                  {site.gallery.map((g) => (
                    <Media
                      key={g.id}
                      site={site}
                      src={g.image}
                      label={g.caption || tl(L, "photo")}
                      className="rt-gallery__img"
                    />
                  ))}
                </div>
              </section>
            ),
          faq: () =>
            site.faqs.length > 0 && (
              <section id="faq" className="wrap rt-section">
                <h2>{tl(L, "faq")}</h2>
                <FaqList items={site.faqs} className="rt-faq" />
              </section>
            ),
          contact: () => (
            <section id="contact" className="rt-dark">
              <div className="wrap rt-section rt-contact">
                <div>
                  <h2>{tl(L, "rentalsContact")}</h2>
                  {site.address && <p>{site.address}</p>}
                  {site.landmark && <p>{site.landmark}</p>}
                  {site.hours.length > 0 && <p>{hoursLine(site)}</p>}
                  <p>
                    <ContactLine site={site} />
                  </p>
                </div>
                <div className="rt-actions">
                  {whatsappDigits && (
                    <a
                      href={`https://wa.me/${whatsappDigits}`}
                      className="tap rt-btn"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {tl(L, "whatsapp")}
                    </a>
                  )}
                  <a
                    href={site.bookingUrl}
                    className="tap rt-btn rt-btn--ghost"
                  >
                    {tl(L, "rentalsCall")}
                  </a>
                </div>
              </div>
            </section>
          ),
        }}
      />

      <footer className="wrap rt-footer">{tl(L, "poweredBy")}</footer>
    </div>
  );
}
