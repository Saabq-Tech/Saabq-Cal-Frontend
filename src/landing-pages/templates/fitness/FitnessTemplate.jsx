import { useState } from "react";
import { tl } from "../../labels";
import { BookLink, Brand, Media, Sections } from "../shared/parts";
import { navItems, rootProps } from "../shared/helpers";
import "./fitness.css";

export default function FitnessTemplate({ site }) {
  const L = site.lang;
  const days = Array.from(new Set(site.schedule.map((s) => s.day)));
  const [day, setDay] = useState(days[0] ?? "");
  const activeDay = days.includes(day) ? day : days[0];
  const nav = navItems(site, {
    about: tl(L, "fitnessClub"),
    schedule: tl(L, "fitnessClasses"),
    team: tl(L, "fitnessCoaches"),
    services: tl(L, "fitnessPlans"),
  });

  return (
    <div {...rootProps(site, "t-fitness")}>
      <header className="wrap ft-nav">
        <Brand site={site} className="ft-brand" />
        <nav aria-label={tl(L, "menu")}>
          {nav.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="tap">
              {n.label}
            </a>
          ))}
          <BookLink site={site} className="tap ft-block" />
        </nav>
      </header>

      <section className="ft-hero">
        {site.heroImage && (
          <img src={site.heroImage} alt="" className="ft-hero__bg" />
        )}
        <div className="wrap ft-hero__text">
          {!site.heroImage && site.preview && (
            <p className="ft-faint">{tl(L, "heroPhoto")}</p>
          )}
          <h1>{site.headline}</h1>
          {site.intro && <p className="ft-lead">{site.intro}</p>}
        </div>
      </section>

      <Sections
        site={site}
        render={{
          about: () => (
            <section id="about" className="wrap ft-section ft-split">
              <div>
                <h2>{tl(L, "fitnessAbout")}</h2>
                <p className="ft-body">{site.about}</p>
                {site.aboutMore && <p className="ft-body">{site.aboutMore}</p>}
              </div>
              {site.highlights.length > 0 && (
                <div className="ft-facilities">
                  {site.highlights.map((h) => (
                    <div key={h.id}>
                      <strong>{h.title}</strong>
                      <span>{h.desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ),
          schedule: () =>
            site.schedule.length > 0 && (
              <section id="schedule" className="ft-band">
                <div className="wrap ft-section">
                  <div className="ft-head">
                    <h2>{tl(L, "fitnessWeek")}</h2>
                    {days.length > 1 && (
                      <div className="ft-days" role="tablist">
                        {days.map((d) => (
                          <button
                            key={d}
                            type="button"
                            role="tab"
                            aria-selected={d === activeDay}
                            className={`tap ${d === activeDay ? "is-on" : ""}`}
                            onClick={() => setDay(d)}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <ul className="ft-classes">
                    {site.schedule
                      .filter((c) => c.day === activeDay)
                      .map((c) => (
                        <li
                          key={c.id}
                          className={c.full ? "is-full" : undefined}
                        >
                          <span className="ft-time" dir="ltr">
                            {c.time}
                          </span>
                          <div>
                            <strong>{c.title}</strong>
                            <span>{c.full ? tl(L, "full") : c.by}</span>
                          </div>
                          {c.full ? (
                            <span className="ft-dash">—</span>
                          ) : (
                            <BookLink site={site} className="tap ft-outline">
                              {tl(L, "book")}
                            </BookLink>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
              </section>
            ),
          team: () =>
            site.team.length > 0 && (
              <section id="team" className="wrap ft-section">
                <h2>{tl(L, "fitnessCoaches")}</h2>
                <div className="ft-coaches">
                  {site.team.map((p) => (
                    <div key={p.id}>
                      <Media
                        site={site}
                        src={p.photo}
                        label={p.name}
                        className="ft-coach__img"
                      />
                      <strong>{p.name}</strong>
                      <span>{[p.role, p.bio].filter(Boolean).join(" · ")}</span>
                    </div>
                  ))}
                </div>
              </section>
            ),
          services: () =>
            site.services.length > 0 && (
              <section id="services" className="ft-band">
                <div className="wrap ft-section">
                  <h2>{tl(L, "fitnessPlans")}</h2>
                  <div className="ft-plans">
                    {site.services.map((s, i) => (
                      <div
                        key={s.id}
                        className={i === 1 ? "is-pick" : undefined}
                      >
                        <strong>{s.title}</strong>
                        <p className="ft-price">{s.price}</p>
                        <span>{s.desc}</span>
                      </div>
                    ))}
                  </div>
                  <BookLink site={site} className="tap ft-block ft-block--lg">
                    {tl(L, "fitnessTrial")}
                  </BookLink>
                </div>
              </section>
            ),
          contact: () => (
            <section id="contact" className="wrap ft-section ft-split">
              <div className="ft-body">
                <h2>{tl(L, "fitnessVisit")}</h2>
                {site.address && <p>{site.address}</p>}
                {site.hours.map((h) => (
                  <p key={h.id}>
                    {h.days}: {h.closed ? tl(L, "closed") : h.time}
                  </p>
                ))}
                {site.phone && (
                  <p>
                    <span dir="ltr">{site.phone}</span>
                  </p>
                )}
              </div>
              <Media
                site={site}
                label={tl(L, "map")}
                className="ft-map"
                optional
              />
            </section>
          ),
        }}
      />

      <footer className="ft-footer">
        <div className="wrap">
          <strong>{site.name}</strong>
          <span>{tl(L, "poweredBy")}</span>
        </div>
      </footer>
    </div>
  );
}
