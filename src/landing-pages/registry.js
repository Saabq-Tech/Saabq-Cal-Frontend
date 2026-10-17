import { lazyWithRetry as lazy } from "../utils/lazyWithRetry";
import "./templates/shared/base.css";

const SereneTemplate = lazy(() => import("./templates/clinic/ClinicTemplate"));
const RadiantTemplate = lazy(() => import("./templates/dental/DentalTemplate"));
const AtlasTemplate = lazy(() => import("./templates/medical/MedicalTemplate"));
const OasisTemplate = lazy(() => import("./templates/therapy/TherapyTemplate"));
const PrestigeTemplate = lazy(
  () => import("./templates/consulting/ConsultingTemplate"),
);
const EleganceTemplate = lazy(
  () => import("./templates/beauty/BeautyTemplate"),
);
const PathwayTemplate = lazy(
  () => import("./templates/education/EducationTemplate"),
);
const CanvasTemplate = lazy(
  () => import("./templates/creative/CreativeTemplate"),
);
const PulseTemplate = lazy(() => import("./templates/fitness/FitnessTemplate"));
const DirectTemplate = lazy(
  () => import("./templates/services/ServicesTemplate"),
);
const SynergyTemplate = lazy(
  () => import("./templates/company/CompanyTemplate"),
);
const PanoramaTemplate = lazy(
  () => import("./templates/realestate/RealEstateTemplate"),
);
const HavenTemplate = lazy(() => import("./templates/rentals/RentalsTemplate"));
const VoyageTemplate = lazy(() => import("./templates/trips/TripsTemplate"));

/** Each template loads on demand. Keys match catalog.js and the backend LandingPageTemplate enum. */
export const TEMPLATE_COMPONENTS = {
  // Design-style template keys
  serene: SereneTemplate,
  radiant: RadiantTemplate,
  atlas: AtlasTemplate,
  oasis: OasisTemplate,
  prestige: PrestigeTemplate,
  elegance: EleganceTemplate,
  pathway: PathwayTemplate,
  canvas: CanvasTemplate,
  pulse: PulseTemplate,
  direct: DirectTemplate,
  synergy: SynergyTemplate,
  panorama: PanoramaTemplate,
  haven: HavenTemplate,
  voyage: VoyageTemplate,

  // Legacy aliases for backward compatibility
  clinic: SereneTemplate,
  dental: RadiantTemplate,
  medical: AtlasTemplate,
  therapy: OasisTemplate,
  consulting: PrestigeTemplate,
  beauty: EleganceTemplate,
  education: PathwayTemplate,
  creative: CanvasTemplate,
  fitness: PulseTemplate,
  services: DirectTemplate,
  company: SynergyTemplate,
  realestate: PanoramaTemplate,
  rentals: HavenTemplate,
  trips: VoyageTemplate,
};
