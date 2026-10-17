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
import "./medical.css";

export default function MedicalTemplate({ site }) {
  const L = site.lang;
  const [deptId, setDeptId] = useState(site.teams[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const depts = q
    ? site.teams.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.meetings.some((m) => m.title.toLowerCase().includes(q)),
      )
    : site.teams;
  const dept = depts.find((d) => d.id === deptId) ?? depts[0];
  const nav = navItems(site, {
    about: tl(L, "about"),
    teams: tl(L, "medicalTeams"),
    gallery: tl(L, "medicalBranches"),
  });

  return (
    <div {...rootProps(site, "t-medical")}>
      <header className="md-top">
        <div className="wrap md-nav">
          <Brand site={site} className="md-brand" />
          <nav aria-label={tl(L, "menu")} className="md-nav__links">
            {nav.map((n) => (
              <a key={n.id} href={`#${n.id}`} className="tap">
                {n.label}
              </a>
            ))}
            {site.phone ? (
              <a href={`tel:${site.phone}`} className="tap md-hot" dir="ltr">
                {site.phone}
              </a>
            ) : (
              <BookLink site={site} className="tap md-hot" />
            )}
          </nav>
        </div>
        <div className="wrap md-hero">
          <div>
            <h1>{site.headline}</h1>
            {site.intro && <p className="md-lead">{site.intro}</p>}
            {site.teams.length > 0 && (
              <>
                <label htmlFor="md-q" className="md-label">
                  {tl(L, "medicalSearchLabel")}
                </label>
                <input
                  id="md-q"
                  className="md-search"
                  type="search"
                  placeholder={tl(L, "medicalSearchPlaceholder")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </>
            )}
          </div>
          <Media
            site={site}
            src={site.heroImage}
            label={tl(L, "heroPhoto")}
            className="md-hero__img"
          />
        </div>
      </header>

      <Sections
        site={site}
        render={{
          about: () => (
            <section id="about" className="wrap md-section md-split">
              <div>
                <h2>{tl(L, "about")}</h2>
                <p className="md-body">{site.about}</p>
                {site.aboutMore && <p className="md-body">{site.aboutMore}</p>}
              </div>
            </section>
          ),
          highlights: () =>
            site.highlights.length > 0 && (
              <section className="wrap md-facilities">
                {site.highlights.map((h) => (
                  <div key={h.id}>
                    <strong>{h.title}</strong>
                    <span>{h.desc}</span>
                  </div>
                ))}
              </section>
            ),
          teams: () =>
            site.teams.length > 0 && (
              <section id="teams" className="md-white">
                <div className="wrap md-section">
                  <h2>{tl(L, "medicalTeams")}</h2>
                  <div className="md-dir">
                    <div
                      className="md-depts"
                      role="listbox"
                      aria-label={tl(L, "medicalDepartments")}
                    >
                      {depts.length === 0 && (
                        <p className="md-empty">
                          {tl(L, "medicalNoResults")} «{query.trim()}»
                        </p>
                      )}
                      {depts.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          role="option"
                          aria-selected={d.id === dept?.id}
                          className={`tap ${d.id === dept?.id ? "is-on" : ""}`}
                          onClick={() => setDeptId(d.id)}
                        >
                          {d.name}
                        </button>
                      ))}
                    </div>
                    <div className="md-docs">
                      {dept?.meetings.map((m, i) => (
                        <article key={i} className="md-doc">
                          <div className="md-doc__head">
                            <div>
                              <strong>{m.title}</strong>
                              <span>{m.duration}</span>
                            </div>
                          </div>
                          <div className="md-doc__foot">
                            <span>{tl(L, "medicalNextSlot")}</span>
                            <BookLink site={site} className="tap md-btn">
                              {tl(L, "book")}
                            </BookLink>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            ),
          faq: () =>
            site.faqs.length > 0 && (
              <section className="wrap md-section">
                <h2>{tl(L, "faq")}</h2>
                <FaqList items={site.faqs} className="md-faq" />
              </section>
            ),
          gallery: () =>
            site.gallery.length > 0 && (
              <section id="gallery" className="md-white">
                <div className="wrap md-section">
                  <h2>{tl(L, "medicalBranches")}</h2>
                  <div className="md-branches">
                    {site.gallery.map((g, i) => (
                      <div key={g.id} className="md-branch">
                        <Media
                          site={site}
                          src={g.image}
                          label={g.caption || tl(L, "photo")}
                          className="md-branch__map"
                        />
                        <div>
                          <strong>{g.caption}</strong>
                          <span>{site.hours[i]?.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ),
          contact: () => (
            <section id="contact" className="wrap md-section">
              <h2>{tl(L, "contact")}</h2>
              <p className="md-body">
                {site.address}
                {site.address && " · "}
                <ContactLine site={site} />
              </p>
            </section>
          ),
        }}
      />

      <footer className="md-footer">
        <div className="wrap">
          <strong>{site.name}</strong>
          <span>{tl(L, "poweredBy")}</span>
        </div>
      </footer>
    </div>
  );
}
