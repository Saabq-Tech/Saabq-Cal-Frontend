import { tl } from "../../labels";
import { Media } from "./parts";
import "./units.css";

/** One unit card: photo, title, facts, price and a link to its booking page. */
function UnitCard({ site, unit }) {
  const L = site.lang;
  return (
    <article className="lp-unit">
      <a href={unit.href} className="lp-unit__media" tabIndex={-1}>
        <Media
          site={site}
          src={unit.photo}
          label={unit.title}
          className="lp-unit__img"
        />
      </a>
      <div className="lp-unit__body">
        <h3>
          <a href={unit.href}>{unit.title}</a>
        </h3>
        {unit.location && <p className="lp-unit__loc">{unit.location}</p>}
        {unit.facts.length > 0 && (
          <p className="lp-unit__facts">{unit.facts.join(" · ")}</p>
        )}
        {unit.mode === "trip" && unit.departures.length > 0 && (
          <p className="lp-unit__facts">
            {tl(L, "unitNextDeparture")}: {unit.departures[0].startsOn}
          </p>
        )}
        <div className="lp-unit__foot">
          <span className="lp-unit__price">
            {unit.price}
            <small> / {unit.priceSuffix}</small>
          </span>
          <a href={unit.href} className="tap lp-unit__btn">
            {tl(L, "unitBook")}
          </a>
        </div>
        {unit.deposit && <p className="lp-unit__deposit">{unit.deposit}</p>}
      </div>
    </article>
  );
}

/** A single unit shown in full on the landing page: photos, details, amenities and booking. */
function UnitFeature({ site, unit }) {
  const L = site.lang;
  const [first, ...rest] = unit.photos;
  return (
    <div className="lp-feature">
      <div className="lp-feature__photos">
        <Media
          site={site}
          src={first}
          label={unit.title}
          className="lp-feature__main"
        />
        {rest.length > 0 && (
          <div className="lp-feature__thumbs">
            {rest.slice(0, 4).map((src) => (
              <img key={src} src={src} alt="" loading="lazy" />
            ))}
          </div>
        )}
      </div>
      <div className="lp-feature__info">
        <h3>{unit.title}</h3>
        {unit.location && <p className="lp-unit__loc">{unit.location}</p>}
        {unit.facts.length > 0 && (
          <ul className="lp-feature__facts">
            {unit.facts.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        )}
        {unit.desc && <p className="lp-feature__desc">{unit.desc}</p>}
        {unit.amenities.length > 0 && (
          <ul className="lp-feature__amenities">
            {unit.amenities.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        )}
        {unit.mode === "trip" && unit.departures.length > 0 && (
          <ul className="lp-feature__departures">
            {unit.departures.slice(0, 5).map((d) => (
              <li key={d.id}>
                <strong>{d.startsOn}</strong>
                {d.endsOn ? ` → ${d.endsOn}` : ""}
                <span>
                  {d.seatsLeft > 0
                    ? `${d.seatsLeft} ${tl(L, "unitSeatsLeft")}`
                    : tl(L, "full")}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="lp-feature__cta">
          <span className="lp-unit__price">
            {unit.price}
            <small> / {unit.priceSuffix}</small>
          </span>
          <a href={unit.href} className="tap lp-unit__btn">
            {tl(L, "unitBookNow")}
          </a>
        </div>
        {unit.deposit && <p className="lp-unit__deposit">{unit.deposit}</p>}
      </div>
    </div>
  );
}

/**
 * The workspace's rental units. One unit is shown in full; several are shown as cards.
 * Renders nothing when there are no units (outside the editor preview).
 */
export function UnitsSection({ site, title, className = "" }) {
  const L = site.lang;
  if (site.units.length === 0) {
    if (!site.preview) return null;
    return (
      <section id="units" className={`wrap lp-units ${className}`}>
        {title && <h2>{title}</h2>}
        <div className="media media--empty lp-units__empty">
          <span>{tl(L, "unitsEmptyPreview")}</span>
        </div>
      </section>
    );
  }
  return (
    <section id="units" className={`wrap lp-units ${className}`}>
      {title && <h2>{title}</h2>}
      {site.units.length === 1 ? (
        <UnitFeature site={site} unit={site.units[0]} />
      ) : (
        <div className="lp-units__grid">
          {site.units.map((u) => (
            <UnitCard key={u.id} site={site} unit={u} />
          ))}
        </div>
      )}
    </section>
  );
}
