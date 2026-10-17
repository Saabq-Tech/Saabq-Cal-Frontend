import { tl } from "../../labels";
import { BookLink, Brand, FaqList, Media, Sections } from "../shared/parts";
import { hoursLine, navItems, rootProps } from "../shared/helpers";
import "./therapy.css";

export default function TherapyTemplate({ site }) {
  const L = site.lang;
  const me = site.team[0];
  const nav = navItems(site, {
    about: tl(L, "therapyApproach"),
    services: tl(L, "therapyAreas"),
    team: tl(L, "therapyAboutMe"),
    booking: tl(L, "therapyFirstSession"),
  });

  return (
    <div {...rootProps(site, "t-therapy")}>
      <header className="wrap th-nav">
        <Brand site={site} className="th-brand" />
        <nav aria-label={tl(L, "menu")}>
          {nav.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="tap">
              {n.label}
            </a>
          ))}
        </nav>
      </header>

      <section className="wrap th-hero">
        <h1>{site.headline}</h1>
        {site.intro && <p>{site.intro}</p>}
      </section>

      {site.highlights.length > 0 && (
        <dl className="wrap th-facts">
          {site.highlights.map((h) => (
            <div key={h.id}>
              <dt>{h.title}</dt>
              <dd>{h.desc}</dd>
            </div>
          ))}
        </dl>
      )}

      <Sections
        site={site}
        render={{
          about: () => (
            <section id="about" className="wrap th-section th-two">
              <h2>{tl(L, "therapyApproachTitle")}</h2>
              <div>
                <p>{site.about}</p>
                {site.aboutMore && <p>{site.aboutMore}</p>}
              </div>
            </section>
          ),
          services: () =>
            site.services.length > 0 && (
              <section id="services" className="th-soft">
                <div className="wrap th-section">
                  <h2>{tl(L, "therapyWorkWith")}</h2>
                  <ul className="th-areas">
                    {site.services.map((s) => (
                      <li key={s.id}>{s.title}</li>
                    ))}
                  </ul>
                  <p className="th-muted">{tl(L, "therapyNotListed")}</p>
                </div>
              </section>
            ),
          team: () =>
            me && (
              <section id="team" className="wrap th-section th-me">
                <Media
                  site={site}
                  src={me.photo}
                  label={me.name}
                  className="th-me__img"
                />
                <div>
                  <h2>{me.name}</h2>
                  <p className="th-muted">{me.role}</p>
                  <p>{me.bio}</p>
                </div>
              </section>
            ),
          faq: () =>
            site.faqs.length > 0 && (
              <section className="wrap th-section th-two">
                <h2>{tl(L, "faq")}</h2>
                <FaqList items={site.faqs} className="th-faq" />
              </section>
            ),
          booking: () => (
            <section id="booking" className="th-cta">
              <div className="wrap th-cta__row">
                <p>{tl(L, "therapyReady")}</p>
                <div className="th-cta__actions">
                  <BookLink site={site} className="tap th-btn" />
                  <BookLink site={site} className="tap th-link">
                    {tl(L, "therapyIntroCall")}
                  </BookLink>
                </div>
              </div>
            </section>
          ),
          contact: () => (
            <section id="contact" className="wrap th-section th-two th-muted">
              <div>
                <strong>{tl(L, "therapyPlace")}</strong>
                <p>
                  {site.address}
                  {site.address && site.hours.length > 0 && <br />}
                  {hoursLine(site)}
                </p>
              </div>
              <div>
                <strong>{tl(L, "therapyEmergency")}</strong>
                <p>{tl(L, "therapyEmergencyText")}</p>
              </div>
            </section>
          ),
        }}
      />

      <footer className="wrap th-footer">
        <span>{site.name}</span>
        <span>{tl(L, "poweredBy")}</span>
      </footer>
    </div>
  );
}
