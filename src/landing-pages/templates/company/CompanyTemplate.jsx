import { useState } from "react";
import { tl } from "../../labels";
import {
  BookLink,
  Brand,
  ContactLine,
  FaqList,
  Media,
  Sections,
} from "../shared/parts";
import { navItems, rootProps } from "../shared/helpers";
import "./company.css";

export default function CompanyTemplate({ site }) {
  const L = site.lang;
  const [teamId, setTeamId] = useState(site.teams[0]?.id ?? "");
  const team = site.teams.find((x) => x.id === teamId) ?? site.teams[0];
  const nav = navItems(site, {
    about: tl(L, "companyAbout"),
    services: tl(L, "companySolutions"),
    team: tl(L, "companyLeadership"),
    contact: tl(L, "contact"),
  });
  const primaryHref = site.teams.length > 0 ? "#teams" : site.bookingUrl;

  return (
    <div {...rootProps(site, "t-company")}>
      <header className="co-bar">
        <div className="wrap co-nav">
          <Brand site={site} className="co-brand" />
          <nav aria-label={tl(L, "menu")}>
            {nav.map((n) => (
              <a key={n.id} href={`#${n.id}`} className="tap">
                {n.label}
              </a>
            ))}
            <a href={primaryHref} className="tap co-btn">
              {site.bookingLabel}
            </a>
          </nav>
        </div>
      </header>

      <section className="co-hero">
        <div className="wrap co-hero__grid">
          <div>
            {site.kicker && <p className="co-kicker">{site.kicker}</p>}
            <h1>{site.headline}</h1>
            {site.intro && <p className="co-lead">{site.intro}</p>}
            <div className="co-actions">
              <a href={primaryHref} className="tap co-btn co-btn--lg">
                {tl(L, "companyDemo")}
              </a>
              {site.services.length > 0 && (
                <a
                  href="#services"
                  className="tap co-btn co-btn--ghost co-btn--lg"
                >
                  {tl(L, "companyExplore")}
                </a>
              )}
            </div>
          </div>
          <Media
            site={site}
            src={site.heroImage}
            label={tl(L, "heroPhoto")}
            className="co-hero__img"
          />
        </div>
      </section>

      <Sections
        site={site}
        render={{
          about: () => (
            <section id="about" className="wrap co-section co-split">
              <div>
                <h2>{tl(L, "companyAboutTitle")}</h2>
                <p className="co-body">{site.about}</p>
                {site.aboutMore && <p className="co-body">{site.aboutMore}</p>}
              </div>
              {site.highlights.length > 0 && (
                <dl className="co-facts">
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
          services: () =>
            site.services.length > 0 && (
              <section id="services" className="co-soft">
                <div className="wrap co-section">
                  <h2>{tl(L, "companySolutionsTitle")}</h2>
                  <div className="co-cards">
                    {site.services.map((s, i) => (
                      <article key={s.id}>
                        <Media
                          site={site}
                          src={site.gallery[i]?.image}
                          label={s.title}
                          className="co-card__img"
                          optional
                        />
                        <div>
                          <h3>
                            <a href={s.href}>{s.title}</a>
                          </h3>
                          <p>{s.desc}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            ),
          teams: () =>
            site.teams.length > 0 && (
              <section id="teams" className="co-dark">
                <div className="wrap co-section co-split">
                  <div>
                    <h2>{tl(L, "companyTalk")}</h2>
                    <p className="co-dim">{tl(L, "companyTalkText")}</p>
                    <div
                      className="co-teams"
                      role="group"
                      aria-label={tl(L, "companyTeam")}
                    >
                      {site.teams.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          aria-pressed={g.id === team?.id}
                          className={g.id === team?.id ? "is-on" : undefined}
                          onClick={() => setTeamId(g.id)}
                        >
                          <span>
                            <strong>{g.name}</strong>
                            <small>{g.desc}</small>
                          </span>
                          <i aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </div>
                  {team && (
                    <div className="co-panel">
                      <h3>{team.name}</h3>
                      {team.meetings.length > 0 && (
                        <>
                          <p className="co-panel__label">
                            {tl(L, "companyMeetingType")}
                          </p>
                          <ul>
                            {team.meetings.map((m, i) => (
                              <li key={i}>
                                <span>{m.title}</span>
                                <span>{m.duration}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                      <p className="co-panel__label">{tl(L, "slotsNote")}</p>
                      <BookLink
                        site={site}
                        className="tap co-btn co-btn--lg co-btn--full"
                      >
                        {tl(L, "companyBookMeeting")}
                      </BookLink>
                      <p className="co-panel__note">
                        {tl(L, "companyRouting")}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            ),
          team: () =>
            site.team.length > 0 && (
              <section id="team" className="wrap co-section">
                <h2>{tl(L, "companyLeadership")}</h2>
                <div className="co-people">
                  {site.team.map((p) => (
                    <div key={p.id}>
                      <Media
                        site={site}
                        src={p.photo}
                        label={p.name}
                        className="co-person__img"
                      />
                      <strong>{p.name}</strong>
                      <span>{p.role}</span>
                    </div>
                  ))}
                </div>
              </section>
            ),
          faq: () =>
            site.faqs.length > 0 && (
              <section className="co-soft">
                <div className="wrap co-section">
                  <h2>{tl(L, "faq")}</h2>
                  <FaqList items={site.faqs} className="co-faq" />
                </div>
              </section>
            ),
          contact: () => (
            <section id="contact" className="wrap co-section co-split">
              <div className="co-body">
                <h2>{tl(L, "companyHq")}</h2>
                {site.address && <p>{site.address}</p>}
                <p>
                  <ContactLine site={site} />
                </p>
                {site.hours.map((h) => (
                  <p key={h.id}>
                    {h.days} {h.closed ? tl(L, "closed") : h.time}
                  </p>
                ))}
              </div>
              <Media
                site={site}
                label={tl(L, "map")}
                className="co-map"
                optional
              />
            </section>
          ),
        }}
      />

      <footer className="co-footer">
        <div className="wrap">
          <strong>{site.name}</strong>
          <span>{tl(L, "poweredBy")}</span>
        </div>
      </footer>
    </div>
  );
}
