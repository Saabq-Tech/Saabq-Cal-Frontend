import { Fragment } from "react";
import { tl } from "../../labels";
import { orderedSections } from "./helpers";

/** Renders the enabled sections in order, using the template's own renderer for each. */
export function Sections({ site, render }) {
  return (
    <>
      {orderedSections(site).map((id) => (
        <Fragment key={id}>{render[id]?.()}</Fragment>
      ))}
    </>
  );
}

/**
 * An image from the workspace. When it is missing, the editor preview shows a labelled
 * placeholder telling the owner what to upload; visitors see a neutral block, or nothing
 * when the image is optional (maps, decorative shots).
 */
export function Media({ src, label, className, optional = false, site }) {
  if (src) {
    return (
      <img
        className={`media ${className ?? ""}`}
        src={src}
        alt={label}
        loading="lazy"
      />
    );
  }
  if (site?.preview) {
    return (
      <div
        className={`media media--empty ${className ?? ""}`}
        role="img"
        aria-label={label}
      >
        <span>{label}</span>
      </div>
    );
  }
  if (optional) return null;
  return (
    <div
      className={`media media--empty media--blank ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

export function BookLink({ site, className, href, children }) {
  return (
    <a className={className} href={href || site.bookingUrl}>
      {children ?? site.bookingLabel}
    </a>
  );
}

export function FaqList({ items, className }) {
  return (
    <div className={className}>
      {items.map((f, i) => (
        <details key={f.id} open={i === 0}>
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function HoursTable({ rows, site, className }) {
  if (!rows.length) return null;
  return (
    <table className={className}>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <th scope="row">{r.days}</th>
            <td className={r.closed ? "is-closed" : undefined}>
              {r.closed ? tl(site.lang, "closed") : r.time}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Brand({ site, className }) {
  return (
    <span className={className}>
      {site.logo ? <img src={site.logo} alt="" className="brand-logo" /> : null}
      {site.name}
    </span>
  );
}

/** Phone, WhatsApp and email that are actually filled in, for contact lines. */
export function ContactLine({ site, separator = " · " }) {
  const parts = [
    site.phone && (
      <span key="p" dir="ltr">
        {site.phone}
      </span>
    ),
    site.whatsapp && site.whatsapp !== site.phone && (
      <span key="w" dir="ltr">
        {site.whatsapp}
      </span>
    ),
    site.email && <span key="e">{site.email}</span>,
  ].filter(Boolean);
  return parts.map((part, i) => (
    <Fragment key={i}>
      {i > 0 && separator}
      {part}
    </Fragment>
  ));
}
