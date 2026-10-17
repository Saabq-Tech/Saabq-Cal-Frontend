import { useState } from "react";
import { tl } from "../../labels";
import { Brand, FaqList, HoursTable, Media, Sections } from "../shared/parts";
import { hasSection, navItems, rootProps } from "../shared/helpers";
import "./services.css";

export default function ServicesTemplate({ site }) {
  const L = site.lang;
  const [serviceId, setServiceId] = useState(site.services[0]?.id ?? "");
  const selected =
    site.services.find((s) => s.id === serviceId) ?? site.services[0];
  const nav = navItems(site, {
    about: tl(L, "servicesAbout"),
    services: tl(L, "services"),
    contact: tl(L, "servicesAreas"),
  });

  // The request form picks the service and continues to the booking page with it preselected.
  const form = (
    <div className="sv-form">
      <h2>{site.bookingLabel}</h2>
      {site.services.length > 0 && (
        <label>
          {tl(L, "servicesType")}
          <select
            value={selected?.id ?? ""}
            onChange={(e) => setServiceId(e.target.value)}
          >
            {site.services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <a href={selected?.href || site.bookingUrl} className="tap sv-submit">
        {tl(L, "servicesContinue")}
      </a>
      <p className="sv-small">{tl(L, "poweredBy")}</p>
    </div>
  );

  return (
    <div {...rootProps(site, "t-services")}>
      <header className="sv-bar">
        <div className="wrap sv-nav">
          <Brand site={site} className="sv-brand" />
          <nav aria-label={tl(L, "menu")}>
            {nav.map((n) => (
              <a key={n.id} href={`#${n.id}`} className="tap">
                {n.label}
              </a>
            ))}
            {site.phone && (
              <a href={`tel:${site.phone}`} className="tap sv-tel" dir="ltr">
                {site.phone}
              </a>
            )}
          </nav>
        </div>
      </header>

      <section className="wrap sv-hero" id="booking">
        <div>
          {site.kicker && <p className="sv-kicker">{site.kicker}</p>}
          <h1>{site.headline}</h1>
          {site.intro && <p className="sv-lead">{site.intro}</p>}
          <Media
            site={site}
            src={site.heroImage}
            label={tl(L, "heroPhoto")}
            className="sv-hero__img"
          />
        </div>
        {hasSection(site, "booking") && form}
      </section>

      <Sections
        site={site}
        render={{
          about: () => (
            <section id="about" className="sv-white">
              <div className="wrap sv-section sv-split">
                <div>
                  <h2>{tl(L, "servicesAbout")}</h2>
                  <p className="sv-body">{site.about}</p>
                  {site.aboutMore && (
                    <p className="sv-body">{site.aboutMore}</p>
                  )}
                </div>
                {site.highlights.length > 0 && (
                  <ul className="sv-points">
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
              <section id="services" className="wrap sv-section">
                <h2>{tl(L, "services")}</h2>
                <div className="sv-cards">
                  {site.services.map((s) => (
                    <div key={s.id}>
                      <h3>
                        <a href={s.href}>{s.title}</a>
                      </h3>
                      <p>{s.desc}</p>
                      <span>{s.price}</span>
                    </div>
                  ))}
                </div>
              </section>
            ),
          gallery: () =>
            site.gallery.length > 0 && (
              <section className="sv-white">
                <div className="wrap sv-section">
                  <h2>{tl(L, "servicesWork")}</h2>
                  <div className="sv-gallery">
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
          contact: () => (
            <section id="contact" className="wrap sv-section sv-split">
              <div>
                <h2>{tl(L, "servicesReach")}</h2>
                {site.address && <p className="sv-body">{site.address}</p>}
                <HoursTable
                  rows={site.hours}
                  site={site}
                  className="sv-hours"
                />
              </div>
              <Media
                site={site}
                label={tl(L, "map")}
                className="sv-map"
                optional
              />
            </section>
          ),
          faq: () =>
            site.faqs.length > 0 && (
              <section className="wrap sv-section">
                <h2>{tl(L, "faq")}</h2>
                <FaqList items={site.faqs} className="sv-faq" />
              </section>
            ),
        }}
      />

      <footer className="sv-footer">
        <div className="wrap">
          <strong>{site.name}</strong>
          <span>
            {[site.email, tl(L, "poweredBy")].filter(Boolean).join(" · ")}
          </span>
        </div>
      </footer>
    </div>
  );
}
