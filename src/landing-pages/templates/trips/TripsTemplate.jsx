import { tl } from "../../labels";
import { Brand, ContactLine, FaqList, Media, Sections } from "../shared/parts";
import { navItems, rootProps } from "../shared/helpers";
import { UnitsSection } from "../shared/units";
import "./trips.css";

/** Trips and tours booked by seat on scheduled departures. */
export default function TripsTemplate({ site }) {
  const L = site.lang;
  const nav = navItems(site, {
    units: tl(L, "tripsTrips"),
    highlights: tl(L, "tripsWhy"),
    gallery: tl(L, "gallery"),
    faq: tl(L, "faq"),
    contact: tl(L, "contact"),
  });
  const single = site.units.length === 1;
  // Upcoming departures across all trips, soonest first.
  const upcoming = site.units
    .flatMap((u) => u.departures.map((d) => ({ ...d, unit: u })))
    .sort((a, b) => a.startsOn.localeCompare(b.startsOn))
    .slice(0, 6);

  return (
    <div {...rootProps(site, "t-trips")}>
      <header className="wrap tr-nav">
        <Brand site={site} className="tr-brand" />
        <nav aria-label={tl(L, "menu")}>
          {nav.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="tap">
              {n.label}
            </a>
          ))}
        </nav>
      </header>

      <section className="wrap tr-hero">
        <div className="tr-hero__text">
          {site.kicker && <p className="tr-kicker">{site.kicker}</p>}
          <h1>{site.headline}</h1>
          {site.intro && <p className="tr-lead">{site.intro}</p>}
          <div className="tr-actions">
            <a
              href={single ? site.units[0].href : "#units"}
              className="tap tr-btn"
            >
              {single ? tl(L, "unitBookNow") : tl(L, "tripsBrowse")}
            </a>
            <a href={site.bookingUrl} className="tap tr-btn tr-btn--ghost">
              {tl(L, "rentalsCall")}
            </a>
          </div>
        </div>
        <Media
          site={site}
          src={site.heroImage || site.units[0]?.photo}
          label={tl(L, "heroPhoto")}
          className="tr-hero__img"
        />
      </section>

      {!single && upcoming.length > 0 && (
        <section className="tr-strip">
          <div className="wrap">
            <h2>{tl(L, "tripsUpcoming")}</h2>
            <ul className="tr-upcoming">
              {upcoming.map((d) => (
                <li key={d.id}>
                  <a href={d.unit.href}>
                    <strong>{d.startsOn}</strong>
                    <span>{d.unit.title}</span>
                    <em>
                      {d.seatsLeft > 0
                        ? `${d.seatsLeft} ${tl(L, "unitSeatsLeft")}`
                        : tl(L, "full")}
                    </em>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <Sections
        site={site}
        render={{
          units: () => (
            <UnitsSection
              site={site}
              title={single ? "" : tl(L, "tripsTrips")}
            />
          ),
          highlights: () =>
            site.highlights.length > 0 && (
              <section id="highlights" className="wrap tr-section">
                <h2>{tl(L, "tripsWhy")}</h2>
                <ol className="tr-highlights">
                  {site.highlights.map((h) => (
                    <li key={h.id}>
                      <strong>{h.title}</strong>
                      {h.desc && <p>{h.desc}</p>}
                    </li>
                  ))}
                </ol>
              </section>
            ),
          gallery: () =>
            site.gallery.length > 0 && (
              <section id="gallery" className="wrap tr-section">
                <h2>{tl(L, "tripsMoments")}</h2>
                <div className="tr-gallery">
                  {site.gallery.map((g) => (
                    <Media
                      key={g.id}
                      site={site}
                      src={g.image}
                      label={g.caption || tl(L, "photo")}
                      className="tr-gallery__img"
                    />
                  ))}
                </div>
              </section>
            ),
          about: () =>
            (site.about || site.aboutMore) && (
              <section id="about" className="wrap tr-section">
                <h2>{tl(L, "about")}</h2>
                {site.about && <p className="tr-body">{site.about}</p>}
                {site.aboutMore && <p className="tr-body">{site.aboutMore}</p>}
              </section>
            ),
          faq: () =>
            site.faqs.length > 0 && (
              <section id="faq" className="wrap tr-section">
                <h2>{tl(L, "faq")}</h2>
                <FaqList items={site.faqs} className="tr-faq" />
              </section>
            ),
          contact: () => (
            <section id="contact" className="tr-accent">
              <div className="wrap tr-section">
                <h2>{tl(L, "tripsContact")}</h2>
                {site.address && <p>{site.address}</p>}
                <p>
                  <ContactLine site={site} />
                </p>
                <a href={site.bookingUrl} className="tap tr-btn tr-btn--light">
                  {tl(L, "rentalsCall")}
                </a>
              </div>
            </section>
          ),
        }}
      />

      <footer className="wrap tr-footer">{tl(L, "poweredBy")}</footer>
    </div>
  );
}
