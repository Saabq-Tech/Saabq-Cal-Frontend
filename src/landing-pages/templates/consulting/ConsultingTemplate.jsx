import { tl } from "../../labels";
import { BookLink, Brand, Media, Sections } from "../shared/parts";
import { navItems, rootProps } from "../shared/helpers";
import "./consulting.css";

export default function ConsultingTemplate({ site }) {
  const L = site.lang;
  const number = (i) => (i + 1).toLocaleString(L === "ar" ? "ar-EG" : "en");
  const nav = navItems(site, {
    about: tl(L, "consultingOffice"),
    services: tl(L, "consultingPracticeNav"),
    team: tl(L, "team"),
    gallery: tl(L, "consultingNotesNav"),
  });

  return (
    <div {...rootProps(site, "t-consulting")}>
      <header className="wrap cs-nav">
        <Brand site={site} className="cs-brand" />
        <nav aria-label={tl(L, "menu")}>
          {nav.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="tap">
              {n.label}
            </a>
          ))}
          <BookLink site={site} className="tap cs-underline" />
        </nav>
      </header>

      <section className="wrap cs-hero">
        <div>
          {site.kicker && <p className="cs-kicker">{site.kicker}</p>}
          <h1>{site.headline}</h1>
        </div>
        {site.intro && <p className="cs-lead">{site.intro}</p>}
      </section>
      <div className="wrap">
        <Media
          site={site}
          src={site.heroImage}
          label={tl(L, "heroPhoto")}
          className="cs-wide"
          optional
        />
      </div>

      <Sections
        site={site}
        render={{
          about: () => (
            <section id="about" className="wrap cs-section cs-three">
              <h2>{tl(L, "consultingAbout")}</h2>
              <p>{site.about}</p>
              <p>{site.aboutMore}</p>
            </section>
          ),
          services: () =>
            site.services.length > 0 && (
              <section id="services" className="cs-dark">
                <div className="wrap cs-section">
                  <h2>{tl(L, "consultingPractice")}</h2>
                  <ol className="cs-practice">
                    {site.services.map((s, i) => (
                      <li key={s.id}>
                        <span className="cs-num">{number(i)}</span>
                        <div>
                          <h3>
                            <a href={s.href}>{s.title}</a>
                          </h3>
                          {s.desc && <p>{s.desc}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>
            ),
          highlights: () =>
            site.highlights.length > 0 && (
              <section className="wrap cs-section">
                <h2>{tl(L, "consultingHow")}</h2>
                <div className="cs-steps">
                  {site.highlights.map((h) => (
                    <p key={h.id}>
                      <b>{h.title}.</b> {h.desc}
                    </p>
                  ))}
                </div>
              </section>
            ),
          team: () =>
            site.team.length > 0 && (
              <section id="team" className="cs-paper">
                <div className="wrap cs-section">
                  <h2>{tl(L, "team")}</h2>
                  <div className="cs-people">
                    {site.team.map((p) => (
                      <div key={p.id} className="cs-person">
                        <Media
                          site={site}
                          src={p.photo}
                          label={p.name}
                          className="cs-person__img"
                        />
                        <div>
                          <h3>{p.name}</h3>
                          <p className="cs-role">{p.role}</p>
                          <p>{p.bio}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ),
          gallery: () =>
            site.gallery.some((g) => g.caption) && (
              <section id="gallery" className="wrap cs-section">
                <h2>{tl(L, "consultingNotes")}</h2>
                <div className="cs-notes">
                  {site.gallery
                    .filter((g) => g.caption)
                    .map((g) => (
                      <p key={g.id} className="cs-note">
                        {g.caption}
                      </p>
                    ))}
                </div>
              </section>
            ),
          booking: () => (
            <section id="booking" className="wrap cs-section">
              <div className="cs-book">
                <div>
                  <p className="cs-book__line">{tl(L, "consultingBookLine")}</p>
                  <p className="cs-book__meta">{tl(L, "slotsNote")}</p>
                </div>
                <BookLink site={site} className="tap cs-book__btn" />
              </div>
            </section>
          ),
          contact: () => (
            <section id="contact" className="wrap cs-section cs-contact">
              <div>
                <strong>{tl(L, "contact")}</strong>
                <p>
                  {site.address}
                  {site.address && site.landmark && <br />}
                  {site.landmark}
                </p>
              </div>
              {(site.phone || site.email) && (
                <div>
                  <strong>{tl(L, "phone")}</strong>
                  <p>
                    {site.phone && <span dir="ltr">{site.phone}</span>}
                    {site.phone && site.email && <br />}
                    {site.email}
                  </p>
                </div>
              )}
              {site.hours.length > 0 && (
                <div>
                  <strong>{tl(L, "hours")}</strong>
                  <p>
                    {site.hours.map((h) => (
                      <span key={h.id}>
                        {h.days}: {h.closed ? tl(L, "closed") : h.time}
                        <br />
                      </span>
                    ))}
                  </p>
                </div>
              )}
            </section>
          ),
        }}
      />

      <footer className="wrap cs-footer">
        <span className="cs-brand">{site.name}</span>
        <span>{tl(L, "poweredBy")}</span>
      </footer>
    </div>
  );
}
