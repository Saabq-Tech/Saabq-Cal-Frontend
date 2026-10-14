import { tl } from "../../labels";
import {
  BookLink,
  Brand,
  ContactLine,
  FaqList,
  Media,
  Sections,
} from "../shared/parts";
import { hoursLine, navItems, rootProps } from "../shared/helpers";
import "./education.css";

export default function EducationTemplate({ site }) {
  const L = site.lang;
  const days = Array.from(new Set(site.schedule.map((s) => s.day)));
  const times = Array.from(new Set(site.schedule.map((s) => s.time)));
  const nav = navItems(site, {
    about: tl(L, "educationAbout"),
    services: tl(L, "educationPrograms"),
    schedule: tl(L, "schedule"),
    team: tl(L, "educationTeachers"),
  });

  return (
    <div {...rootProps(site, "t-education")}>
      <header className="ed-top">
        <div className="wrap ed-nav">
          <Brand site={site} className="ed-brand" />
          <nav aria-label={tl(L, "menu")}>
            {nav.map((n) => (
              <a key={n.id} href={`#${n.id}`} className="tap">
                {n.label}
              </a>
            ))}
            <BookLink site={site} className="tap ed-mark" />
          </nav>
        </div>
        <div className="wrap ed-hero">
          <div>
            {site.kicker && (
              <p className="ed-kicker">
                <span>{site.kicker}</span>
              </p>
            )}
            <h1>{site.headline}</h1>
            {site.intro && <p className="ed-lead">{site.intro}</p>}
          </div>
          <Media
            site={site}
            src={site.heroImage}
            label={tl(L, "heroPhoto")}
            className="ed-hero__img"
          />
        </div>
      </header>

      <Sections
        site={site}
        render={{
          about: () => (
            <section id="about" className="wrap ed-section">
              <h2>{tl(L, "educationAbout")}</h2>
              <div className="ed-cols">
                <p>{site.about}</p>
                {site.aboutMore && <p>{site.aboutMore}</p>}
              </div>
            </section>
          ),
          highlights: () =>
            site.highlights.length > 0 && (
              <section className="wrap ed-facts">
                {site.highlights.map((h) => (
                  <div key={h.id}>
                    <strong>{h.title}</strong>
                    <span>{h.desc}</span>
                  </div>
                ))}
              </section>
            ),
          services: () =>
            site.services.length > 0 && (
              <section id="services" className="ed-soft">
                <div className="wrap ed-section">
                  <h2>{tl(L, "educationPrograms")}</h2>
                  <div className="ed-programs">
                    {site.services.map((s, i) => (
                      <article
                        key={s.id}
                        className={i % 2 ? "is-alt" : undefined}
                      >
                        <h3>
                          <a href={s.href}>{s.title}</a>
                        </h3>
                        <p className="ed-muted">
                          {[s.desc, s.price].filter(Boolean).join(" · ")}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            ),
          schedule: () =>
            site.schedule.length > 0 && (
              <section id="schedule" className="wrap ed-section ed-sched">
                <div>
                  <h2>{tl(L, "educationWeek")}</h2>
                  <div className="ed-table-wrap">
                    <table className="ed-table">
                      <thead>
                        <tr>
                          <td />
                          {times.map((tm) => (
                            <th key={tm} scope="col">
                              {tm}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {days.map((d) => (
                          <tr key={d}>
                            <th scope="row">{d}</th>
                            {times.map((tm) => {
                              const c = site.schedule.find(
                                (s) => s.day === d && s.time === tm,
                              );
                              return (
                                <td
                                  key={tm}
                                  className={
                                    !c
                                      ? "is-empty"
                                      : c.full
                                        ? "is-full"
                                        : "is-on"
                                  }
                                >
                                  {c ? (
                                    <>
                                      <strong>{c.title}</strong>
                                      <span>
                                        {c.full ? tl(L, "full") : c.by}
                                      </span>
                                    </>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <aside className="ed-trial">
                  <h3>{tl(L, "educationTrial")}</h3>
                  <p>{tl(L, "educationTrialText")}</p>
                  <BookLink site={site} className="tap ed-mark ed-mark--lg" />
                </aside>
              </section>
            ),
          team: () =>
            site.team.length > 0 && (
              <section id="team" className="ed-soft">
                <div className="wrap ed-section">
                  <h2>{tl(L, "educationTeachers")}</h2>
                  <div className="ed-teachers">
                    {site.team.map((p) => (
                      <div key={p.id}>
                        <Media
                          site={site}
                          src={p.photo}
                          label={p.name}
                          className="ed-avatar"
                        />
                        <div>
                          <strong>{p.name}</strong>
                          <p className="ed-accent">{p.role}</p>
                          <p className="ed-muted">{p.bio}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ),
          faq: () =>
            site.faqs.length > 0 && (
              <section className="wrap ed-section">
                <h2>{tl(L, "educationFaq")}</h2>
                <FaqList items={site.faqs} className="ed-faq" />
              </section>
            ),
          contact: () => (
            <section id="contact" className="wrap ed-section ed-cols">
              <div>
                <h2>{tl(L, "contact")}</h2>
                <p>
                  {site.address}
                  {site.address && <br />}
                  <ContactLine site={site} />
                  {site.hours.length > 0 && <br />}
                  {hoursLine(site)}
                </p>
              </div>
              <Media
                site={site}
                label={tl(L, "map")}
                className="ed-map"
                optional
              />
            </section>
          ),
        }}
      />

      <footer className="ed-footer">
        <div className="wrap">
          <strong>{site.name}</strong>
          <span>{tl(L, "poweredBy")}</span>
        </div>
      </footer>
    </div>
  );
}
