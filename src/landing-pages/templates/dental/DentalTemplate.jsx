import { tl } from "../../labels";
import {
  BookLink,
  Brand,
  ContactLine,
  FaqList,
  HoursTable,
  Media,
  Sections,
} from "../shared/parts";
import { navItems, rootProps } from "../shared/helpers";
import "./dental.css";

export default function DentalTemplate({ site }) {
  const L = site.lang;
  const nav = navItems(site, {
    about: tl(L, "about"),
    services: tl(L, "services"),
    team: tl(L, "team"),
    contact: tl(L, "contact"),
  });

  return (
    <div {...rootProps(site, "t-dental")}>
      <header className="wrap dn-nav">
        <Brand site={site} className="dn-brand" />
        <nav aria-label={tl(L, "menu")} className="dn-nav__links">
          {nav.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="tap">
              {n.label}
            </a>
          ))}
          <BookLink site={site} className="tap dn-pill" />
        </nav>
      </header>

      <section className="dn-hero">
        <div className="wrap dn-hero__grid">
          <div>
            {site.kicker && <p className="dn-kicker">{site.kicker}</p>}
            <h1>{site.headline}</h1>
            {site.intro && <p className="dn-lead">{site.intro}</p>}
            <div className="dn-actions">
              <BookLink site={site} className="tap dn-pill dn-pill--lg" />
              <BookLink site={site} className="tap dn-urgent">
                {tl(L, "dentalUrgent")}
              </BookLink>
            </div>
          </div>
          <Media
            site={site}
            src={site.heroImage}
            label={tl(L, "heroPhoto")}
            className="dn-hero__img"
          />
        </div>
      </section>

      <Sections
        site={site}
        render={{
          about: () => (
            <section id="about" className="wrap dn-section">
              <h2>{tl(L, "about")}</h2>
              <p className="dn-body">{site.about}</p>
              {site.aboutMore && <p className="dn-body">{site.aboutMore}</p>}
            </section>
          ),
          highlights: () =>
            site.highlights.length > 0 && (
              <section
                className="wrap dn-section dn-journey"
                aria-label={tl(L, "dentalJourney")}
              >
                <ol>
                  {site.highlights.map((h, i) => (
                    <li
                      key={h.id}
                      className={
                        i === site.highlights.length - 1 ? "is-last" : undefined
                      }
                    >
                      <strong>{h.title}</strong>
                      <span>{h.desc}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ),
          services: () =>
            site.services.length > 0 && (
              <section id="services" className="dn-tint">
                <div className="wrap dn-section">
                  <div className="dn-head">
                    <h2>{tl(L, "services")}</h2>
                  </div>
                  <div className="dn-cards">
                    {site.services.map((s) => (
                      <a key={s.id} href={s.href} className="dn-card">
                        <div className="dn-card__top">
                          <strong>{s.title}</strong>
                          <span>{s.price}</span>
                        </div>
                        {s.desc && <p>{s.desc}</p>}
                      </a>
                    ))}
                  </div>
                  <p className="dn-note">{tl(L, "dentalPriceNote")}</p>
                </div>
              </section>
            ),
          team: () =>
            site.team.length > 0 && (
              <section id="team" className="wrap dn-section">
                <h2>{tl(L, "team")}</h2>
                <div className="dn-team">
                  {site.team.map((p) => (
                    <div key={p.id}>
                      <Media
                        site={site}
                        src={p.photo}
                        label={p.name}
                        className="dn-team__img"
                      />
                      <strong>{p.name}</strong>
                      <span>{p.role}</span>
                    </div>
                  ))}
                </div>
              </section>
            ),
          gallery: () =>
            site.gallery.length > 0 && (
              <section className="dn-tint">
                <div className="wrap dn-section">
                  <h2>{tl(L, "gallery")}</h2>
                  <div className="dn-gallery">
                    {site.gallery.map((g) => (
                      <Media
                        key={g.id}
                        site={site}
                        src={g.image}
                        label={g.caption || tl(L, "photo")}
                      />
                    ))}
                  </div>
                </div>
              </section>
            ),
          booking: () => (
            <section id="booking" className="wrap dn-section">
              <div className="dn-book">
                <div>
                  <h2>{tl(L, "booking")}</h2>
                  <p>{tl(L, "slotsNote")}</p>
                </div>
                <BookLink
                  site={site}
                  className="tap dn-pill dn-pill--lg dn-pill--light"
                />
              </div>
            </section>
          ),
          faq: () =>
            site.faqs.length > 0 && (
              <section className="wrap dn-section">
                <h2>{tl(L, "faq")}</h2>
                <FaqList items={site.faqs} className="dn-faq" />
              </section>
            ),
          contact: () => (
            <section id="contact" className="wrap dn-section dn-contact">
              <div>
                <h2>{tl(L, "contact")}</h2>
                <p className="dn-body">
                  {site.address}
                  {site.address && <br />}
                  <ContactLine site={site} />
                </p>
                <HoursTable
                  rows={site.hours}
                  site={site}
                  className="dn-hours"
                />
              </div>
              <Media
                site={site}
                label={tl(L, "map")}
                className="dn-map"
                optional
              />
            </section>
          ),
        }}
      />

      <footer className="dn-footer">
        <div className="wrap">
          <strong>{site.name}</strong>
          <span>{tl(L, "poweredBy")}</span>
        </div>
      </footer>
    </div>
  );
}
