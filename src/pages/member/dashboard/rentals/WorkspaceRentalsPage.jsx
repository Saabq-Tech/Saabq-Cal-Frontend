import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import WorkspacePageHeader from "../../../../components/dashboard/WorkspacePageHeader";
import Icon from "../../../../components/common/Icon";
import { useLanguage } from "../../../../context/LanguageContext";
import UnitsPanel from "./UnitsPanel";
import ReservationsPanel from "./ReservationsPanel";
import FinancePanel from "./FinancePanel";
import "./rentals.css";

const TABS = [
  { id: "units", icon: "home", label: "rentalTabUnits" },
  { id: "reservations", icon: "calendar", label: "rentalTabReservations" },
  { id: "finance", icon: "credit-card", label: "rentalTabFinance" },
];

export default function WorkspaceRentalsPage() {
  const { t } = useLanguage();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((x) => x.id === params.get("tab"))
    ? params.get("tab")
    : "units";
  // Bumped when units change so the other panels reload their unit lists.
  const [unitsVersion, setUnitsVersion] = useState(0);

  return (
    <div className="rentals-page">
      <WorkspacePageHeader
        title={t("navRentals")}
        subtitle={t("rentalPageSubtitle")}
        icon="home"
      />

      <div className="rentals-tabs" role="tablist">
        {TABS.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={tab === x.id}
            className={`rentals-tab ${tab === x.id ? "is-active" : ""}`}
            onClick={() => setParams({ tab: x.id }, { replace: true })}
          >
            <Icon name={x.icon} size={16} />
            {t(x.label)}
          </button>
        ))}
      </div>

      {tab === "units" && (
        <UnitsPanel onUnitsChanged={() => setUnitsVersion((v) => v + 1)} />
      )}
      {tab === "reservations" && <ReservationsPanel key={unitsVersion} />}
      {tab === "finance" && <FinancePanel key={unitsVersion} />}
    </div>
  );
}
