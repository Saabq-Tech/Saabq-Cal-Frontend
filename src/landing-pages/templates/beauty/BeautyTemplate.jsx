import { tl } from "../../labels";
import { BookLink, Brand, Media, Sections } from "../shared/parts";
import { navItems, rootProps } from "../shared/helpers";
import "./beauty.css";

export default function BeautyTemplate({ site }) {
  const L = site.lang;
  const nav = navItems(site, {
    about: tl(L, "beautyStory"),
    services: tl(L, "services"),
    gallery: tl(L, "beautyWork"),
    team: tl(L, "beautyExperts"),
  });

  return (
    <div {...rootProps(site, "t-beauty")}>
      <header className="bt-hero">
        {site.heroImage && (
          <img src={site.heroImage} alt="" className="bt-hero__bg" />
        )}
        <div className="wrap bt-nav">
          <Brand site={site} className="bt-brand" />
          <nav aria-label={tl(L, "menu")}>
            {nav.map((n) => (
              <a key={n.id} href={`#${n.id}`} className="tap">
                {n.label}
              </a>
            ))}
            <BookLink site={site} className="tap bt-pill">
              {tl(L, "book")}
            </BookLink>
          </nav>
        </div>
        {!site.heroImage && site.preview && (
          <p className="bt-hero__ph">{tl(L, "heroPhoto")}</p>
        )}
        <div className="wrap bt-hero__text">
          <h1>{site.headline}</h1>
          {site.kicker && <p>{site.kicker}</p>}
        </div>
      </header>

      <Sections
        site={site}
        render={{
          about: () => (
            <section id="about" className="wrap bt-section bt-story">
              <Media
                site={site}
                src={site.gallery[0]?.image}
                label={tl(L, "insidePhoto")}
                className="bt-arch"
                optional
              />
              <div>
                <p className="bt-eyebrow">{tl(L, "beautyStory")}</p>
                {site.intro && <h2>{site.intro}</h2>}
                <p className="bt-body">{site.about}</p>
                {site.aboutMore && <p className="bt-body">{site.aboutMore}</p>}
              </div>
            </section>
          ),
          services: () =>
            site.services.length > 0 && (
              <section id="services" className="bt-deep">
                <div className="wrap bt-section">
                  <div className="bt-head">
                    <h2>{tl(L, "beautyMenu")}</h2>
                    <span>{tl(L, "beautyPriceNote")}</span>
                  </div>
                  <div className="bt-menu">
                    <div>
                      {site.services.map((s) => (
                        <a key={s.id} href={s.href} className="bt-line">
                          <span>
                            {s.title}
                            {s.desc ? ` · ${s.desc}` : ""}
                          </span>
                          <span className="bt-dots" aria-hidden="true" />
                          <span>{s.price}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            ),
          gallery: () =>
            site.gallery.length > 0 && (
              <section id="gallery" className="wrap bt-section">
                <h2>{tl(L, "beautyWorkTitle")}</h2>
                <div className="bt-gallery">
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
          team: () =>
            site.team.length > 0 && (
              <section id="team" className="bt-deep">
                <div className="wrap bt-section">
                  <h2>{tl(L, "beautyExperts")}</h2>
                  <div className="bt-team">
                    {site.team.map((p) => (
                      <div key={p.id}>
                        <Media
                          site={site}
                          src={p.photo}
                          label={p.name}
                          className="bt-team__img"
                        />
                        <strong>{p.name}</strong>
                        <span>{p.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ),
          booking: () => (
            <section id="booking" className="wrap bt-section bt-book">
              <div>
                <h2>{tl(L, "beautyBookTitle")}</h2>
                <p className="bt-body">{tl(L, "beautyBookText")}</p>
                <BookLink site={site} className="tap bt-pill bt-pill--lg" />
              </div>
              <div className="bt-info">
                {site.hours.length > 0 && (
                  <div>
                    <p className="bt-eyebrow">{tl(L, "beautyWelcome")}</p>
                    {site.hours.map((h) => (
                      <p key={h.id}>
                        {h.days}
                        <br />
                        {h.closed ? tl(L, "closed") : h.time}
                      </p>
                    ))}
                  </div>
                )}
                {site.address && (
                  <div>
                    <p className="bt-eyebrow">{tl(L, "beautyAddress")}</p>
                    <p>{site.address}</p>
                  </div>
                )}
                {(site.whatsapp || site.phone) && (
                  <div>
                    <p className="bt-eyebrow">{tl(L, "beautyReach")}</p>
                    <p dir="ltr">{site.whatsapp || site.phone}</p>
                  </div>
                )}
                {site.faqs[0] && (
                  <div>
                    <p className="bt-eyebrow">{site.faqs[0].q}</p>
                    <p>{site.faqs[0].a}</p>
                  </div>
                )}
              </div>
            </section>
          ),
        }}
      />

      <footer className="bt-footer">
        <p className="bt-brand">{site.name}</p>
        <p>{tl(L, "poweredBy")}</p>
      </footer>
    </div>
  );
}
