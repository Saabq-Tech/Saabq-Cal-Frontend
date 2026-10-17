import { tl } from "../../labels";
import { BookLink, Brand, ContactLine, Media, Sections } from "../shared/parts";
import { hoursLine, navItems, rootProps } from "../shared/helpers";
import "./realestate.css";

export default function RealEstateTemplate({ site }) {
  const L = site.lang;
  const whatsappDigits = site.whatsapp.replace(/[^\d]/g, "");
  const nav = navItems(site, {
    about: tl(L, "realestateCompany"),
    gallery: tl(L, "realestateProjects"),
    services: tl(L, "realestateUnits"),
    booking: tl(L, "realestateViewing"),
  });

  return (
    <div {...rootProps(site, "t-realestate")}>
      <header className="wrap re-nav">
        <Brand site={site} className="re-brand" />
        <nav aria-label={tl(L, "menu")}>
          {nav.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="tap">
              {n.label}
            </a>
          ))}
        </nav>
      </header>

      <section className="re-hero">
        <Media
          site={site}
          src={site.heroImage}
          label={tl(L, "heroPhoto")}
          className="re-hero__img"
        />
        <div className="wrap">
          <div className="re-hero__card">
            {site.kicker && <p className="re-kicker">{site.kicker}</p>}
            <h1>{site.headline}</h1>
            {site.intro && <p className="re-lead">{site.intro}</p>}
            <div className="re-actions">
              <BookLink site={site} className="tap re-btn" />
              {site.services.length > 0 && (
                <a href="#services" className="tap re-btn re-btn--ghost">
                  {tl(L, "realestateUnitsPrices")}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <Sections
        site={site}
        render={{
          about: () => (
            <section id="about" className="wrap re-section re-split">
              <div>
                <h2>{tl(L, "realestateAbout")}</h2>
                <p className="re-body">{site.about}</p>
                {site.aboutMore && <p className="re-body">{site.aboutMore}</p>}
              </div>
            </section>
          ),
          gallery: () =>
            site.gallery.length > 0 && (
              <section id="gallery" className="re-sand">
                <div className="wrap re-section">
                  <h2>{tl(L, "realestateProjects")}</h2>
                  <div className="re-projects">
                    {site.gallery.map((g) => (
                      <div key={g.id} className="re-project">
                        <Media
                          site={site}
                          src={g.image}
                          label={g.caption || tl(L, "photo")}
                          className="re-project__img"
                        />
                        {g.caption && <strong>{g.caption}</strong>}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ),
          services: () =>
            site.services.length > 0 && (
              <section id="services" className="wrap re-section">
                <h2>{tl(L, "realestateUnitsTitle")}</h2>
                <div className="re-table-wrap">
                  <table className="re-units">
                    <thead>
                      <tr>
                        <th scope="col">{tl(L, "realestateType")}</th>
                        <th scope="col">{tl(L, "realestateArea")}</th>
                        <th scope="col">{tl(L, "realestateFrom")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {site.services.map((s) => (
                        <tr key={s.id}>
                          <th scope="row">
                            <a href={s.href}>{s.title}</a>
                          </th>
                          <td>{s.desc}</td>
                          <td>{s.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {site.highlights.length > 0 && (
                  <dl className="re-terms">
                    {site.highlights.map((h) => (
                      <div key={h.id}>
                        <dt>{h.title}</dt>
                        <dd>{h.desc}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </section>
            ),
          booking: () => (
            <section id="booking" className="re-green">
              <div className="wrap re-section re-split">
                <div>
                  <h2>{tl(L, "realestateBookViewing")}</h2>
                  <p className="re-dim">{tl(L, "realestateViewingText")}</p>
                </div>
                <div>
                  <p className="re-dim">{tl(L, "slotsNote")}</p>
                  <BookLink site={site} className="tap re-btn re-btn--light">
                    {tl(L, "realestateConfirm")}
                  </BookLink>
                </div>
              </div>
            </section>
          ),
          team: () =>
            site.team.length > 0 && (
              <section className="wrap re-section">
                <h2>{tl(L, "realestateAdvisors")}</h2>
                <ul className="re-advisors">
                  {site.team.map((p) => (
                    <li key={p.id}>
                      <Media
                        site={site}
                        src={p.photo}
                        label={p.name}
                        className="re-avatar"
                      />
                      <div>
                        <strong>{p.name}</strong>
                        <span>{p.role}</span>
                      </div>
                      {whatsappDigits ? (
                        <a
                          href={`https://wa.me/${whatsappDigits}`}
                          className="tap"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {tl(L, "whatsapp")}
                        </a>
                      ) : (
                        <a href={p.href} className="tap">
                          {tl(L, "book")}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ),
          contact: () => (
            <section id="contact" className="wrap re-section re-contact">
              <div>
                <strong className="re-brand">{site.name}</strong>
              </div>
              <div>
                {site.address}
                {site.address && site.hours.length > 0 && <br />}
                {hoursLine(site)}
              </div>
              <div>
                <ContactLine site={site} />
              </div>
            </section>
          ),
        }}
      />

      <footer className="wrap re-footer">{tl(L, "poweredBy")}</footer>
    </div>
  );
}
