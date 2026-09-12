import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import BookingDetailsPage from "./workspace-settings/BookingDetailsPage";
import CapabilityGate from "../../../components/common/CapabilityGate";
import SEO from "../../../components/ui/SEO";
import { useLanguage } from "../../../context/LanguageContext";

export default function WorkspaceBookingDetailPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const isOwner = user?.is_owner === true;
  const userPermissions = Array.isArray(user?.permissions)
    ? user.permissions
    : [];
  const canEdit =
    isOwner ||
    userPermissions.includes("booking_create") ||
    userPermissions.includes("booking_update") ||
    userPermissions.includes("booking_delete") ||
    userPermissions.includes("booking_write") ||
    userPermissions.includes("bookings_write");

  return (
    <CapabilityGate capabilityCode="BOOKING">
      <div className="card workspace-bookings-card">
        <SEO title={`${t("bookings") || "المواعيد"} #${bookingId}`} noindex />
        <BookingDetailsPage
          bookingId={bookingId}
          onBack={() => navigate("/member/workspace/bookings")}
          canEdit={canEdit}
        />
      </div>
    </CapabilityGate>
  );
}
