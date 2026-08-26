import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { useLanguage } from "../../../context/LanguageContext";
import client, { endpoints } from "../../../api/client";
import MembersTab from "./workspace-settings/MembersTab";
import SEO from "../../../components/ui/SEO";
import { SkeletonRect } from "../../../components/ui/Skeleton";
import CapabilityGate from "../../../components/common/CapabilityGate";
import { checkWorkspaceCapability } from "../../../utils/capabilities";

export default function WorkspaceMembersPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();

  const [membersList, setMembersList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [loading, setLoading] = useState(true);

  const isOwner = user?.is_owner === true;
  const userPermissions = Array.isArray(user?.permissions)
    ? user.permissions
    : [];
  const canRead =
    isOwner ||
    userPermissions.includes("member_read") ||
    userPermissions.includes("members_read");
  const canEdit =
    isOwner ||
    userPermissions.includes("member_write") ||
    userPermissions.includes("members_write");

  const isCapAllowed = checkWorkspaceCapability(user, "TEAM_MEMBERS");

  const loadingRef = useRef(false);
  const loadData = async () => {
    if (!isCapAllowed || !canRead) {
      setLoading(false);
      return;
    }
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      setLoading(true);
      const [memRes, rolesRes] = await Promise.all([
        client.get(endpoints.workspaceMembers),
        client.get(endpoints.workspaceRoles),
      ]);
      setMembersList(memRes.data?.data || []);
      setRolesList(rolesRes.data?.data || []);
    } catch (err) {
      if (err.response?.status !== 403) {
        toast.error(
          t("membersLoadFailed") || "فشل تحميل أعضاء أو أدوار مساحة العمل",
        );
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCapAllowed, canRead]);

  const handleSaveMember = async (formData) => {
    try {
      const memberId = formData.id || formData.editing_id;
      if (memberId) {
        await client.put(endpoints.workspaceMemberItem(memberId), formData);
        toast.success(
          t("memberUpdatedSuccess") || "تم تحديث بيانات العضو بنجاح",
        );
      } else {
        await client.post(endpoints.workspaceMembers, formData);
        toast.success(
          t("inviteSentSuccess") || "تم إرسال الدعوة إلى العضو بنجاح",
        );
      }
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "فشلت العملية");
    }
  };

  const handleDeleteMember = async (member) => {
    try {
      await client.delete(endpoints.workspaceMemberItem(member.id));
      toast.success(t("memberDeletedSuccess") || "تم حذف العضو من مساحة العمل");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "فشل حذف العضو");
    }
  };

  return (
    <CapabilityGate capabilityCode="TEAM_MEMBERS">
      <div className="card" style={{ padding: 24 }}>
        <SEO title={t("members") || "أعضاء مساحة العمل"} noindex />
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SkeletonRect height={48} />
            <SkeletonRect height={64} />
            <SkeletonRect height={64} />
          </div>
        ) : (
          <MembersTab
            membersList={membersList}
            rolesList={rolesList}
            canEdit={canEdit}
            onSaveMember={handleSaveMember}
            onDeleteMember={handleDeleteMember}
          />
        )}
      </div>
    </CapabilityGate>
  );
}
