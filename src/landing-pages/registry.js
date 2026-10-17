import { lazyWithRetry as lazy } from "../utils/lazyWithRetry";
import "./templates/shared/base.css";

/** Each template loads on demand. Keys match catalog.js and the backend LandingPageTemplate enum. */
export const TEMPLATE_COMPONENTS = {
  clinic: lazy(() => import("./templates/clinic/ClinicTemplate")),
  dental: lazy(() => import("./templates/dental/DentalTemplate")),
  medical: lazy(() => import("./templates/medical/MedicalTemplate")),
  therapy: lazy(() => import("./templates/therapy/TherapyTemplate")),
  consulting: lazy(() => import("./templates/consulting/ConsultingTemplate")),
  beauty: lazy(() => import("./templates/beauty/BeautyTemplate")),
  education: lazy(() => import("./templates/education/EducationTemplate")),
  creative: lazy(() => import("./templates/creative/CreativeTemplate")),
  fitness: lazy(() => import("./templates/fitness/FitnessTemplate")),
  services: lazy(() => import("./templates/services/ServicesTemplate")),
  company: lazy(() => import("./templates/company/CompanyTemplate")),
  realestate: lazy(() => import("./templates/realestate/RealEstateTemplate")),
  rentals: lazy(() => import("./templates/rentals/RentalsTemplate")),
  trips: lazy(() => import("./templates/trips/TripsTemplate")),
};
