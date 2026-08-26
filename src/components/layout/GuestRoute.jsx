import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function GuestRoute({ children }) {
  const { isAuthenticated, userType } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    const destination = location.state?.from
      ? typeof location.state.from === "string"
        ? location.state.from
        : location.state.from.pathname ||
          (userType === "member" ? "/member/profile" : "/customer/profile")
      : userType === "member"
        ? "/member/profile"
        : "/customer/profile";

    return <Navigate to={destination} replace />;
  }

  return children;
}
