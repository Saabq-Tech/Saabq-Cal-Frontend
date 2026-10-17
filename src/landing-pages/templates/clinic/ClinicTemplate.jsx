import { tl } from "../../labels";
import {
  BookLink,
  Brand,
  FaqList,
  HoursTable,
  Media,
  Sections,
} from "../shared/parts";
import { navItems, rootProps } from "../shared/helpers";
import "./clinic.css";

export default function ClinicTemplate({ site }) {
  const L = site.lang;
  const doctor = site.team[0];
  const nav = navItems(site, {
    about: tl(L, "about"),
    services: tl(L, "services"),
    team: tl(L, "team"),
    contact: tl(L, "contact"),
  });
  const today = site.hours[0];

  return (
    <div {...rootProps(site, "t-clinic")}>
      <header className="cl-nav">
        <div className="wrap cl-nav__row">
          <Brand site={site} className="cl-brand" />
          <nav className="cl-nav__links" aria-label={tl(L, "menu")}>
            {nav.map((n) => (
              <a key={n.id} href={`#${n.id}`} className="tap">
                {n.label}
              </a>
            ))}
            <BookLink site={site} className="tap cl-btn" />
          </nav>
        </div>
      </header>

      <section className="wrap cl-hero">
        <div>
          {site.kicker && <p className="cl-kicker">{site.kicker}</p>}
          <h1>{site.headline}</h1>
          {site.intro && <p className="cl-lead">{site.intro}</p>}
          <div className="cl-actions">
            <BookLink site={site} className="tap cl-btn cl-btn--lg" />
            <a href="#about" className="tap cl-btn cl-btn--ghost cl-btn--lg">
              {tl(L, "learnMore")}
            </a>
          </div>
        </div>
        <div>
          <Media
            site={site}
            src={site.heroImage}
            label={tl(L, "heroPhoto")}
            className="cl-hero__img"
          />
          <dl className="cl-facts">
            {site.services[0] && (
              <div>
                <dt>{site.services[0].title}</dt>
                <dd>{site.services[0].price}</dd>
              </div>
            )}
            {today && (
              <div>
                <dt>{today.days}</dt>
                <dd>{today.closed ? tl(L, "closed") : today.time}</dd>
              </div>
            )}
            {site.address && (
              <div>
                <dt>{tl(L, "contact")}</dt>
                <dd>{site.address}</dd>
              </div>
            )}
            {site.phone && (
              <div>
                <dt>{tl(L, "phone")}</dt>
                <dd dir="ltr">{site.phone}</dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      <Sections
        site={site}
        render={{
          about: () => (
            <section id="about" className="cl-band">
              <div className="wrap cl-split">
                <div>
                  <h2>{tl(L, "about")}</h2>
                  <p className="cl-body">{site.about}</p>
                  {site.aboutMore && (
                    <p className="cl-body">{site.aboutMore}</p>
                  )}
                </div>
                {site.highlights.length > 0 && (
                  <ul className="cl-points">
                    {site.highlights.map((h) => (
                      <li key={h.id}>
                        <strong>{h.title}</strong>
                        <span>{h.desc}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ),
          services: () =>
            site.services.length > 0 && (
              <section id="services" className="wrap cl-section">
                <h2>{tl(L, "services")}</h2>
                <ul className="cl-services">
                  {site.services.map((s) => (
                    <li key={s.id}>
                      <div>
                        <strong>{s.title}</strong>
                        {s.desc && <span>{s.desc}</span>}
                      </div>
                      {s.price && <span className="cl-price">{s.price}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            ),
          team: () =>
            doctor && (
              <section id="team" className="cl-doctor">
                <div className="wrap cl-doctor__row">
                  <Media
                    site={site}
                    src={doctor.photo}
                    label={doctor.name}
                    className="cl-doctor__img"
                  />
                  <div className="cl-doctor__text">
                    <p className="cl-kicker cl-kicker--light">{doctor.role}</p>
                    <h2>{doctor.name}</h2>
                    <p>{doctor.bio}</p>
                    {site.team.slice(1).map((p) => (
                      <p key={p.id} className="cl-doctor__more">
                        <strong>{p.name}</strong>
                        {p.role && ` · ${p.role}`}
                      </p>
                    ))}
                  </div>
                </div>
              </section>
            ),
          gallery: () =>
            site.gallery.length > 0 && (
              <section className="wrap cl-section">
                <h2>{tl(L, "gallery")}</h2>
                <div className="cl-gallery">
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
          booking: () => (
            <section id="booking" className="cl-band">
              <div className="wrap cl-split">
                <div>
                  <h2>{tl(L, "booking")}</h2>
                  <p className="cl-note">{tl(L, "slotsNote")}</p>
                  <BookLink site={site} className="tap cl-btn cl-btn--lg" />
                </div>
                {site.hours.length > 0 && (
                  <div>
                    <h3>{tl(L, "hours")}</h3>
                    <HoursTable
                      rows={site.hours}
                      site={site}
                      className="cl-hours"
                    />
                  </div>
                )}
              </div>
            </section>
          ),
          faq: () =>
            site.faqs.length > 0 && (
              <section className="wrap cl-section">
                <h2>{tl(L, "faq")}</h2>
                <FaqList items={site.faqs} className="cl-faq" />
              </section>
            ),
          contact: () => (
            <section id="contact" className="wrap cl-section cl-split">
              <div>
                <h2>{tl(L, "contact")}</h2>
                {site.address && <p className="cl-body">{site.address}</p>}
                {site.landmark && <p className="cl-note">{site.landmark}</p>}
                <p className="cl-body">
                  {site.phone && (
                    <>
                      {tl(L, "phone")}: <span dir="ltr">{site.phone}</span>
                      <br />
                    </>
                  )}
                  {site.whatsapp && (
                    <>
                      {tl(L, "whatsapp")}:{" "}
                      <span dir="ltr">{site.whatsapp}</span>
                    </>
                  )}
                </p>
              </div>
              <Media
                site={site}
                label={tl(L, "map")}
                className="cl-map"
                optional
              />
            </section>
          ),
        }}
      />

      <footer className="cl-footer">
        <div className="wrap cl-footer__row">
          <div>
            <strong>{site.name}</strong>
            {site.address && <p>{site.address}</p>}
          </div>
          <p>{tl(L, "poweredBy")}</p>
        </div>
      </footer>
    </div>
  );
}
