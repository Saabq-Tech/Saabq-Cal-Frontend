import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import client, { endpoints } from "../../api/client";
import { subscribeToChatMessages } from "../../utils/firebaseChat";
import UserAvatar from "../ui/UserAvatar";
import Icon from "../common/Icon";
import PermissionCheck from "../PermissionCheck";
import { ChatSidebarSkeleton, ChatFeedSkeleton } from "../ui/Skeleton";

function relativeTime(isoString, t) {
  if (!isoString) return "";
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return t("justNow");
  if (diff < 3600) return `${Math.floor(diff / 60)} ${t("minutesAgo")}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ${t("hoursAgo")}`;
  return `${Math.floor(diff / 86400)} ${t("daysAgo")}`;
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/* ---------------------------------------------------------------
   Read Status Checkmark SVG Component
--------------------------------------------------------------- */
function ReadStatusIcon({ isRead }) {
  if (isRead) {
    return (
      <span
        className="chat-read-status read"
        title="Read"
        style={{
          display: "inline-flex",
          alignItems: "center",
          color: "#38bdf8",
        }}
      >
        <Icon name="custom-6b6813cc" width={16} height={12} />
      </span>
    );
  }

  return (
    <span
      className="chat-read-status sent"
      title="Sent"
      style={{ display: "inline-flex", alignItems: "center", opacity: 0.75 }}
    >
      <Icon name="custom-0db28fa0" width={13} height={10} />
    </span>
  );
}

/* ---------------------------------------------------------------
   Media URL Resolver Helper
--------------------------------------------------------------- */
const getBackendOrigin = () => {
  const envUrl =
    import.meta.env.VITE_API_BASE_URL || "https://admin.cal.saabq.com";
  try {
    const parsed = new URL(envUrl);
    return parsed.origin;
  } catch {
    return "https://admin.cal.saabq.com";
  }
};

const resolveMediaUrl = (urlOrPath) => {
  if (!urlOrPath) return "";
  if (
    urlOrPath.startsWith("blob:") ||
    urlOrPath.startsWith("data:") ||
    urlOrPath.startsWith("http://") ||
    urlOrPath.startsWith("https://")
  ) {
    return urlOrPath;
  }
  const cleanPath = urlOrPath.startsWith("/") ? urlOrPath : `/${urlOrPath}`;
  const fullPath = cleanPath.startsWith("/storage")
    ? cleanPath
    : `/storage${cleanPath}`;
  return `${getBackendOrigin()}${fullPath}`;
};

/* ---------------------------------------------------------------
   Audio Player for Voice Notes
--------------------------------------------------------------- */
function VoicePlayer({ src }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const resolvedSrc = resolveMediaUrl(src);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Audio play failed:", err);
          setIsPlaying(false);
        });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime || 0);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return (
    <div className="chat-voice-player">
      <audio
        ref={audioRef}
        src={resolvedSrc}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />
      <button
        type="button"
        className="chat-voice-play-btn"
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Icon name="custom-52a4b4ac" size={14} />
        ) : (
          <Icon name="custom-836f6795" size={14} style={{ marginLeft: 2 }} />
        )}
      </button>

      <div className="chat-voice-waveform-wrap">
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="chat-voice-slider"
        />
        <div className="chat-voice-bars">
          {[40, 75, 50, 90, 30, 85, 60, 100, 45, 70, 35, 80, 55, 95, 40].map(
            (h, i) => (
              <span
                key={i}
                className={`chat-voice-bar${isPlaying ? " playing" : ""}`}
                style={{
                  height: `${h}%`,
                  opacity: currentTime / (duration || 1) > i / 15 ? 1 : 0.45,
                }}
              />
            ),
          )}
        </div>
      </div>

      <span className="chat-voice-time">
        {isPlaying
          ? formatDuration(currentTime)
          : formatDuration(duration || currentTime)}
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------
   Main Support Chat Page Component
--------------------------------------------------------------- */
export default function ChatsPage() {
  const { t } = useLanguage();
  const { user, userType, refreshUnreadCounts } = useAuth();
  const toast = useToast();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesMeta, setMessagesMeta] = useState({
    current_page: 1,
    last_page: 1,
    has_more: false,
  });
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // Form states
  const [textInput, setTextInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const chatFeedRef = useRef(null);
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);

  const activeConversationRef = useRef(activeConversation);
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    document.title = t("pageTitleChats");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto scroll messages container only
  const scrollToBottom = (smooth = true) => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTo({
        top: chatFeedRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  const location = useLocation();
  const targetConvId = location.state?.conversationId;
  const passedConv = location.state?.conversation;

  // Fetch Single Conversation Messages (with 15 per-page pagination)
  const fetchConversationDetails = useCallback(
    async (convId, page = 1, appendOlder = false) => {
      if (!convId) return;

      if (appendOlder) {
        setLoadingMoreMessages(true);
      } else {
        setLoadingMessages(true);
        setMessages([]);
      }

      try {
        const res = await client.get(endpoints.chatDetails(convId), {
          params: { per_page: 15, page },
        });
        const details = res.data?.data;
        if (details) {
          // Race condition check: Only apply if user is still on this conversation
          if (String(activeConversationRef.current?.id) !== String(convId)) {
            return;
          }

          const fetchedMsgs = details.messages || [];
          const meta = details.messages_meta || {
            current_page: page,
            last_page: 1,
            has_more: false,
          };

          setMessagesMeta(meta);

          if (appendOlder) {
            const oldScrollHeight = chatFeedRef.current?.scrollHeight || 0;

            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const uniqueOlder = fetchedMsgs.filter(
                (m) => !existingIds.has(m.id),
              );
              return [...uniqueOlder, ...prev];
            });

            setTimeout(() => {
              if (chatFeedRef.current) {
                const newScrollHeight = chatFeedRef.current.scrollHeight;
                chatFeedRef.current.scrollTop =
                  newScrollHeight - oldScrollHeight;
              }
            }, 40);
          } else {
            setMessages(fetchedMsgs);
            setActiveConversation(details);
            setTimeout(() => scrollToBottom(false), 80);
          }
        }
      } catch {
        toast.error(t("failedToLoadMessages"));
      } finally {
        setLoadingMessages(false);
        setLoadingMoreMessages(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [toast, t],
  );

  // Fetch Conversations List
  const fetchConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const res = await client.get(endpoints.chats);
      let list = res.data?.data || [];

      // Find target conversation from location state if passed
      let targetConv = null;
      if (targetConvId) {
        targetConv = list.find((c) => String(c.id) === String(targetConvId));
      }
      if (!targetConv && passedConv) {
        targetConv = passedConv;
        if (!list.some((c) => String(c.id) === String(passedConv.id))) {
          list = [passedConv, ...list];
        }
      }

      setConversations(list);

      const toSelect = targetConv || null;
      if (toSelect) {
        setActiveConversation(toSelect);
        setMobileShowChat(true);
        fetchConversationDetails(toSelect.id);

        // Clear history state so refreshing the page doesn't auto-select it again
        if (targetConvId || passedConv) {
          window.history.replaceState({}, "");
        }
      }
    } catch {
      toast.error(t("failedToLoadChats"));
    } finally {
      setLoadingConversations(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, targetConvId, passedConv, fetchConversationDetails]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Handle scroll-up to trigger loading older messages
  const handleFeedScroll = () => {
    if (!chatFeedRef.current || loadingMoreMessages || !messagesMeta.has_more)
      return;
    if (chatFeedRef.current.scrollTop === 0 && activeConversation?.id) {
      fetchConversationDetails(
        activeConversation.id,
        messagesMeta.current_page + 1,
        true,
      );
    }
  };

  // Load details on conversation select
  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    setMobileShowChat(true);
    setReplyingTo(null);
    setImageFile(null);
    setImagePreview(null);
    fetchConversationDetails(conv.id);
    if (typeof refreshUnreadCounts === "function") {
      setTimeout(refreshUnreadCounts, 1000);
    }
  };

  // Start New Chat (with Technical Support Admin)
  const handleStartNewChat = async () => {
    try {
      const res = await client.post(endpoints.chats, {
        recipient_type: "admin",
      });
      const conv = res.data?.data;
      if (conv) {
        setConversations((prev) => [
          conv,
          ...prev.filter((c) => c.id !== conv.id),
        ]);
        setActiveConversation(conv);
        setMessages(conv.messages || []);
        setMobileShowChat(true);
        toast.success(t("technicalSupport"));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t("failedToStartChat"));
    }
  };

  // Real-time listener subscription via Firebase
  useEffect(() => {
    if (!activeConversation?.id) return;

    const unsubscribe = subscribeToChatMessages(activeConversation, (rtMsg) => {
      const currentActive = activeConversationRef.current;
      if (!currentActive) return;

      const rtConvId = rtMsg.conversation_id
        ? String(rtMsg.conversation_id)
        : null;
      const rtConvUuid = rtMsg.conversation_uuid
        ? String(rtMsg.conversation_uuid)
        : null;

      // Update sidebar last message and move target conversation to top of list
      setConversations((prev) => {
        const targetIdx = prev.findIndex((c) => {
          const matchId = rtConvId && String(c.id) === rtConvId;
          const matchUuid = rtConvUuid && c.uuid && rtConvUuid === c.uuid;
          return matchId || matchUuid;
        });

        if (targetIdx === -1) return prev;

        const updatedConv = {
          ...prev[targetIdx],
          last_message: {
            body: rtMsg.body,
            type: rtMsg.type,
            created_at: rtMsg.created_at || new Date().toISOString(),
          },
        };

        const remaining = prev.filter((_, idx) => idx !== targetIdx);
        return [updatedConv, ...remaining];
      });

      // Strict check: ONLY append to message feed if message belongs to current active conversation
      const currentActiveId = String(currentActive.id);
      const currentActiveUuid = currentActive.uuid;

      if (rtConvId && rtConvId !== currentActiveId) return;
      if (rtConvUuid && currentActiveUuid && rtConvUuid !== currentActiveUuid)
        return;

      setMessages((prev) => {
        // Prevent duplicate append
        if (
          prev.some(
            (m) =>
              String(m.id) === String(rtMsg.id) ||
              (m.body === rtMsg.body &&
                m.type === rtMsg.type &&
                Math.abs(new Date(m.created_at) - new Date(rtMsg.created_at)) <
                  3000),
          )
        ) {
          return prev;
        }

        const senderRole = rtMsg.sender_type?.includes("Admin")
          ? "admin"
          : rtMsg.sender_type?.includes("Customer")
            ? "customer"
            : "member";

        const newMsg = {
          id: rtMsg.id || Date.now(),
          conversation_id: currentActive.id,
          sender: {
            id: rtMsg.sender_id,
            name:
              rtMsg.sender_name ||
              (senderRole === "admin"
                ? t("technicalSupport")
                : t("supportAgent")),
            type: rtMsg.sender_type,
            role: senderRole,
          },
          parent_id: rtMsg.parent_id || null,
          parent: rtMsg.parent || null,
          type: rtMsg.type || "text",
          body: rtMsg.body,
          url: resolveMediaUrl(rtMsg.url || rtMsg.body),
          created_at: rtMsg.created_at || new Date().toISOString(),
          read_status: true,
        };

        return [...prev, newMsg];
      });

      setTimeout(() => scrollToBottom(true), 50);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.id, activeConversation?.uuid, t]);

  // File Selection Handler (Images, PDFs, Documents, ZIPs)
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const cancelImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Voice Recording Handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      toast.error(t("micPermissionDenied"));
    }
  };

  const stopRecordingAndSend = () => {
    if (!mediaRecorderRef.current) return;

    clearInterval(recordingTimerRef.current);
    setIsRecording(false);

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
      const voiceFile = new File([audioBlob], `voice_${Date.now()}.webm`, {
        type: "audio/webm",
      });

      // Stop mic tracks
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());

      // Send voice message
      await sendMessage({ type: "voice", attachment: voiceFile });
    };

    mediaRecorderRef.current.stop();
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  // Send Message (Text / Image / Voice)
  const sendMessage = async (overrideData = null) => {
    if (!activeConversation) return;

    let payload;
    let isFormData = false;

    if (overrideData) {
      const fd = new FormData();
      fd.append("conversation_id", activeConversation.id);
      fd.append("type", overrideData.type || "text");
      if (overrideData.attachment) {
        fd.append("attachment", overrideData.attachment);
      }
      if (replyingTo) {
        fd.append("parent_id", replyingTo.id);
      }
      payload = fd;
      isFormData = true;
    } else {
      if (imageFile) {
        const fd = new FormData();
        const fileType = imageFile.type?.startsWith("image/")
          ? "image"
          : "file";
        fd.append("conversation_id", activeConversation.id);
        fd.append("type", fileType);
        fd.append("attachment", imageFile);
        if (textInput.trim()) fd.append("body", textInput.trim());
        if (replyingTo) fd.append("parent_id", replyingTo.id);
        payload = fd;
        isFormData = true;
      } else {
        if (!textInput.trim()) return;
        payload = {
          conversation_id: activeConversation.id,
          type: "text",
          body: textInput.trim(),
          ...(replyingTo ? { parent_id: replyingTo.id } : {}),
        };
      }
    }

    setSending(true);

    try {
      const config = isFormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : {};
      const res = await client.post(endpoints.chatSendMessage, payload, config);
      const sentMsg = res.data?.data;

      if (sentMsg) {
        // Only append to active message feed if user is still on this conversation
        if (
          String(activeConversationRef.current?.id) ===
          String(sentMsg.conversation_id)
        ) {
          setMessages((prev) => {
            if (prev.some((m) => String(m.id) === String(sentMsg.id)))
              return prev;
            return [...prev, sentMsg];
          });
        }

        // Update sidebar last message and move target conversation to top of list
        setConversations((prev) => {
          const targetIdx = prev.findIndex(
            (c) => String(c.id) === String(sentMsg.conversation_id),
          );
          if (targetIdx === -1) return prev;

          const updatedConv = {
            ...prev[targetIdx],
            last_message: {
              body: sentMsg.body,
              type: sentMsg.type,
              created_at: sentMsg.created_at || new Date().toISOString(),
            },
          };

          const remaining = prev.filter((_, idx) => idx !== targetIdx);
          return [updatedConv, ...remaining];
        });
      }

      // Reset form states
      setTextInput("");
      setReplyingTo(null);
      cancelImage();
      setTimeout(() => scrollToBottom(true), 100);
    } catch (err) {
      toast.error(err.response?.data?.message || t("failedToSendMessage"));
    } finally {
      setSending(false);
      setTimeout(() => textInputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sending && (textInput.trim() || imageFile)) {
        sendMessage();
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const name =
      c.participants?.map((p) => p.participant?.name).join(" ") || "";
    const lastMsg = c.last_message?.body || "";
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lastMsg.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Get recipient display name & role label for conversation header
  const getRecipientInfo = (conv) => {
    if (!conv)
      return {
        name: t("technicalSupport"),
        role: "admin",
        roleLabel: t("technicalSupport") || "الدعم الفني",
      };

    const otherPart = conv.participants?.find((p) => {
      if (!p) return false;
      const pModel = p.participant;
      const pId = p.participant_id || pModel?.id;
      const pRole =
        pModel?.role ||
        (p.participant_type?.includes("Customer")
          ? "customer"
          : p.participant_type?.includes("WorkspaceMember")
            ? "member"
            : "admin");

      const isMe =
        String(pId) === String(user?.id) &&
        ((userType === "customer" &&
          (pRole === "customer" || p.participant_type?.includes("Customer"))) ||
          (userType === "member" &&
            (pRole === "member" ||
              p.participant_type?.includes("WorkspaceMember"))) ||
          (userType === "admin" &&
            (pRole === "admin" || p.participant_type?.includes("Admin"))));
      return !isMe;
    });

    const otherModel = otherPart?.participant;
    const pRole =
      otherModel?.role ||
      (otherPart?.participant_type?.includes("Customer")
        ? "customer"
        : otherPart?.participant_type?.includes("WorkspaceMember")
          ? "member"
          : "admin");

    let roleLabel = t("technicalSupport") || "الدعم الفني";
    if (pRole === "customer") {
      roleLabel = t("customer") || "عميل";
    } else if (pRole === "member") {
      roleLabel = t("workspaceMember") || "عضو مساحة عمل";
    } else if (pRole === "admin") {
      roleLabel = t("technicalSupport") || "الدعم الفني";
    }

    return {
      name: otherModel?.name || t("technicalSupport"),
      avatarUrl: otherModel?.avatar_url,
      role: pRole,
      roleLabel,
    };
  };

  const recipient = getRecipientInfo(activeConversation);

  return (
    <div className="card chat-container animate-fade-in-up">
      {/* Lightbox Modal for Images */}
      {lightboxImage && (
        <div
          className="chat-lightbox-overlay"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="chat-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="chat-lightbox-close"
              onClick={() => setLightboxImage(null)}
            >
              ✕
            </button>
            <img src={lightboxImage} alt="Attachment" />
          </div>
        </div>
      )}

      <div className={`chat-layout${mobileShowChat ? " mobile-active" : ""}`}>
        {/* ---------------------------------------------------------------
           Left Panel: Conversations List
        --------------------------------------------------------------- */}
        <div
          className="chat-sidebar"
          role="navigation"
          aria-label={t("conversationsList")}
        >
          <div className="chat-search-wrap">
            <Icon name="search" size={16} />
            <input
              type="text"
              className="chat-search-input"
              placeholder={t("searchChats")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={t("searchChats") || "البحث في المحادثات"}
            />
          </div>

          <div className="chat-list" role="list">
            {loadingConversations ? (
              <ChatSidebarSkeleton />
            ) : filteredConversations.length === 0 ? (
              <div className="chat-empty-sidebar">
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: "50%",
                    background: "var(--primary-subtle)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 14,
                    border: "1px solid rgba(17, 100, 106, 0.2)",
                  }}
                >
                  <Icon name="message-square" size={26} />
                </div>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "var(--heading)",
                    marginBottom: 4,
                  }}
                >
                  {t("noChatsFound")}
                </p>
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                    marginBottom: 16,
                  }}
                >
                  {t("noChatsFoundDesc")}
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleStartNewChat}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "10px 22px",
                    borderRadius: "12px",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: "0.88rem",
                    boxShadow: "0 4px 12px rgba(17, 100, 106, 0.25)",
                    margin: "0 auto",
                  }}
                >
                  <Icon name="plus" size={15} style={{ display: "block" }} />
                  <span style={{ color: "#ffffff" }}>{t("startNewChat")}</span>
                </button>
              </div>
            ) : (
              filteredConversations.map((conv, idx) => {
                const info = getRecipientInfo(conv);
                const isActive = activeConversation?.id === conv.id;
                const lastMsg = conv.last_message;

                return (
                  <button
                    key={conv.id ? `conv-${conv.id}-${idx}` : `conv-idx-${idx}`}
                    type="button"
                    className={`chat-item${isActive ? " active" : ""}`}
                    onClick={() => handleSelectConversation(conv)}
                    aria-selected={isActive}
                    role="listitem"
                    style={{
                      width: "100%",
                      textAlign: "inherit",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                    }}
                  >
                    <UserAvatar
                      name={info.name}
                      avatarUrl={info.avatarUrl}
                      size={42}
                    />
                    <div className="chat-item-info">
                      <div className="chat-item-top">
                        <span className="chat-item-name">{info.name}</span>
                        <span className="chat-item-time">
                          {relativeTime(
                            lastMsg?.created_at || conv.created_at,
                            t,
                          )}
                        </span>
                      </div>
                      <div className="chat-item-bottom">
                        <span className="chat-item-preview">
                          {lastMsg
                            ? lastMsg.type === "image"
                              ? `📷 ${t("sentImage")}`
                              : lastMsg.type === "voice"
                                ? `🎙️ ${t("sentVoiceNote")}`
                                : lastMsg.body
                            : t("technicalSupport")}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ---------------------------------------------------------------
           Right Panel: Active Chat Feed & Input
        --------------------------------------------------------------- */}
        <div className="chat-main">
          {activeConversation ? (
            <>
              {/* Header */}
              <div className="chat-main-header">
                <button
                  type="button"
                  className="chat-mobile-back"
                  onClick={() => setMobileShowChat(false)}
                >
                  <Icon name="arrow-left" size={18} />
                </button>
                <UserAvatar
                  name={recipient.name}
                  avatarUrl={recipient.avatarUrl}
                  size={40}
                />
                <div
                  style={{
                    marginInlineStart: 10,
                    marginInlineEnd: 10,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "0.92rem",
                        fontWeight: 700,
                        margin: 0,
                        color: "var(--heading)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {recipient.name}
                    </h3>
                    <span className="chat-status-badge">
                      <span className="chat-status-dot" />
                      {recipient.roleLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Feed */}
              <div
                className="chat-feed"
                ref={chatFeedRef}
                onScroll={handleFeedScroll}
              >
                {loadingMessages ? (
                  <ChatFeedSkeleton />
                ) : messages.length === 0 ? (
                  <div className="chat-feed-empty">
                    <Icon name="message-square" size={40} />
                    <p>{t("noMessagesYet")}</p>
                  </div>
                ) : (
                  <>
                    {messagesMeta.has_more && (
                      <div
                        style={{ textAlign: "center", margin: "4px 0 12px" }}
                      >
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={loadingMoreMessages}
                          onClick={() =>
                            fetchConversationDetails(
                              activeConversation.id,
                              messagesMeta.current_page + 1,
                              true,
                            )
                          }
                          style={{
                            fontSize: "0.78rem",
                            padding: "4px 12px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {loadingMoreMessages ? (
                            <>
                              <span className="spinner spinner-sm" />
                              <span>{t("loading")}</span>
                            </>
                          ) : (
                            <>
                              <Icon name="chevron-up" size={12} />
                              <span>{t("loadMoreNotifs")}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    {messages.map((msg, idx) => {
                      const isAdminMessage =
                        msg.sender?.role === "admin" ||
                        msg.sender?.type?.includes("Admin") ||
                        msg.sender_type?.includes("Admin");
                      const msgSenderType =
                        msg.sender_type || msg.sender?.type || "";
                      let isMe = false;

                      if (userType === "admin") {
                        isMe = isAdminMessage;
                      } else if (userType === "member") {
                        isMe = msgSenderType.includes("WorkspaceMember");
                      } else if (userType === "customer") {
                        isMe =
                          msgSenderType.includes("Customer") &&
                          String(msg.sender_id || msg.sender?.id) ===
                            String(user?.id);
                      } else {
                        isMe =
                          String(msg.sender_id || msg.sender?.id) ===
                          String(user?.id);
                      }

                      return (
                        <div
                          key={
                            msg.id ? `msg-${msg.id}-${idx}` : `msg-idx-${idx}`
                          }
                          className={`chat-bubble-wrap${isMe ? " me" : " other"}`}
                        >
                          <div className="chat-bubble">
                            {/* Replied Parent Quote */}
                            {msg.parent && (
                              <div className="chat-reply-quote">
                                <span className="quote-author">
                                  {msg.parent.sender?.name ||
                                    t("technicalSupport")}
                                </span>
                                <span className="quote-body">
                                  {msg.parent.type === "image"
                                    ? `📷 ${t("imageAttachment")}`
                                    : msg.parent.type === "voice"
                                      ? `🎙️ ${t("voiceMessage")}`
                                      : msg.parent.body}
                                </span>
                              </div>
                            )}

                            {/* Image Content */}
                            {msg.type === "image" && (
                              <div
                                className="chat-img-wrap"
                                onClick={() =>
                                  setLightboxImage(
                                    resolveMediaUrl(msg.url || msg.body),
                                  )
                                }
                              >
                                <img
                                  src={resolveMediaUrl(msg.url || msg.body)}
                                  alt="Attached"
                                />
                              </div>
                            )}

                            {/* Voice Note Content */}
                            {msg.type === "voice" && (
                              <VoicePlayer
                                src={resolveMediaUrl(msg.url || msg.body)}
                              />
                            )}

                            {/* Generic Document File Attachment */}
                            {(msg.type === "file" ||
                              msg.type === "document" ||
                              (msg.body &&
                                msg.body.startsWith("chat_attachments/") &&
                                msg.type !== "image" &&
                                msg.type !== "voice")) && (
                              <a
                                href={resolveMediaUrl(msg.url || msg.body)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="chat-file-attachment-card"
                                download
                              >
                                <div className="chat-file-icon">
                                  <Icon name="custom-d74daa6a" size={18} />
                                </div>
                                <div className="chat-file-info">
                                  <span className="chat-file-name">
                                    {(msg.url || msg.body).split("/").pop()}
                                  </span>
                                  <span className="chat-file-download-text">
                                    {t("downloadAttachment") || "Download"}
                                  </span>
                                </div>
                                <Icon
                                  name="download"
                                  size={15}
                                  style={{ flexShrink: 0, opacity: 0.8 }}
                                />
                              </a>
                            )}

                            {/* Text Content */}
                            {msg.body &&
                              (msg.type === "text" ||
                                (![
                                  "image",
                                  "voice",
                                  "audio",
                                  "file",
                                  "document",
                                ].includes(msg.type) &&
                                  !msg.body.startsWith(
                                    "chat_attachments/",
                                  ))) && (
                                <div className="chat-text-content">
                                  {msg.body}
                                </div>
                              )}

                            {/* Footer Meta */}
                            <div className="chat-bubble-meta">
                              <span className="chat-time">
                                {relativeTime(msg.created_at, t)}
                              </span>
                              {isMe && (
                                <ReadStatusIcon isRead={msg.read_status} />
                              )}
                              <button
                                type="button"
                                className="chat-reply-btn"
                                onClick={() => setReplyingTo(msg)}
                                title={t("replyTo")}
                              >
                                <Icon name="custom-5815a933" size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Reply Preview Bar */}
              {replyingTo && (
                <div className="chat-reply-preview">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="reply-title">
                      {t("replyingTo")}{" "}
                      {replyingTo.sender?.name || t("technicalSupport")}
                    </span>
                    <span className="reply-snippet">
                      {replyingTo.type === "image"
                        ? `📷 ${t("imageAttachment")}`
                        : replyingTo.type === "voice"
                          ? `🎙️ ${t("voiceMessage")}`
                          : replyingTo.body}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="reply-close"
                    onClick={() => setReplyingTo(null)}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Image Preview Bar */}
              {imagePreview && (
                <div className="chat-image-preview-bar">
                  <div className="preview-thumb-wrap">
                    <img src={imagePreview} alt="Preview" />
                    <button
                      type="button"
                      className="thumb-remove"
                      onClick={cancelImage}
                    >
                      ✕
                    </button>
                  </div>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {t("imageAttachment")}
                  </span>
                </div>
              )}

              {isRecording ? (
                userType === "customer" ? (
                  <div className="chat-recording-bar">
                    <div className="rec-pulse-dot" />
                    <span className="rec-text">{t("recordingVoice")}</span>
                    <span className="rec-time">
                      {formatDuration(recordingTime)}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm rec-cancel"
                      onClick={cancelRecording}
                    >
                      {t("cancel")}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm rec-send"
                      onClick={stopRecordingAndSend}
                    >
                      <Icon name="send" size={14} />
                      {t("sendMessage")}
                    </button>
                  </div>
                ) : (
                  <PermissionCheck
                    permission="chat_write"
                    fallback={
                      <div
                        style={{
                          padding: 20,
                          textAlign: "center",
                          color: "var(--muted)",
                          background: "var(--surface-alt)",
                          borderTop: "1px solid var(--border-light)",
                        }}
                      >
                        {t("readOnlyChat") ||
                          "ليس لديك صلاحية للرد على المحادثات."}
                      </div>
                    }
                  >
                    <div className="chat-recording-bar">
                      <div className="rec-pulse-dot" />
                      <span className="rec-text">{t("recordingVoice")}</span>
                      <span className="rec-time">
                        {formatDuration(recordingTime)}
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm rec-cancel"
                        onClick={cancelRecording}
                      >
                        {t("cancel")}
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm rec-send"
                        onClick={stopRecordingAndSend}
                      >
                        <Icon name="send" size={14} />
                        {t("sendMessage")}
                      </button>
                    </div>
                  </PermissionCheck>
                )
              ) : /* Standard Message Input Form */
              userType === "customer" ? (
                <form className="chat-input-form" onSubmit={handleSubmit}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />

                  {/* Image upload button */}
                  <button
                    type="button"
                    className="chat-action-icon"
                    onClick={() => fileInputRef.current?.click()}
                    title={t("imageAttachment")}
                  >
                    <Icon name="image" size={18} />
                  </button>

                  {/* Mic button */}
                  <button
                    type="button"
                    className="chat-action-icon"
                    onClick={startRecording}
                    title={t("recordVoice")}
                  >
                    <Icon name="custom-26929a1c" size={18} />
                  </button>

                  {/* Text Input */}
                  <textarea
                    ref={textInputRef}
                    className="chat-input"
                    placeholder={t("typeMessagePlaceholder")}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sending}
                    rows="1"
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    className="btn btn-primary chat-send-btn"
                    disabled={sending || (!textInput.trim() && !imageFile)}
                  >
                    {sending ? (
                      <span
                        className="spinner spinner-sm"
                        style={{ borderTopColor: "#fff" }}
                      />
                    ) : (
                      <Icon name="send" size={16} />
                    )}
                  </button>
                </form>
              ) : (
                <PermissionCheck
                  permission="chat_write"
                  fallback={
                    <div
                      style={{
                        padding: 20,
                        textAlign: "center",
                        color: "var(--muted)",
                        background: "var(--surface-alt)",
                        borderTop: "1px solid var(--border-light)",
                      }}
                    >
                      {t("readOnlyChat") ||
                        "ليس لديك صلاحية للرد على المحادثات."}
                    </div>
                  }
                >
                  <form className="chat-input-form" onSubmit={handleSubmit}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      style={{ display: "none" }}
                    />

                    {/* Image upload button */}
                    <button
                      type="button"
                      className="chat-action-icon"
                      onClick={() => fileInputRef.current?.click()}
                      title={t("imageAttachment")}
                    >
                      <Icon name="image" size={18} />
                    </button>

                    {/* Mic button */}
                    <button
                      type="button"
                      className="chat-action-icon"
                      onClick={startRecording}
                      title={t("recordVoice")}
                    >
                      <Icon name="custom-26929a1c" size={18} />
                    </button>

                    {/* Text Input */}
                    <textarea
                      ref={textInputRef}
                      className="chat-input"
                      placeholder={t("typeMessagePlaceholder")}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={sending}
                      rows="1"
                    />

                    {/* Send button */}
                    <button
                      type="submit"
                      className="chat-action-icon send-btn"
                      disabled={(!textInput.trim() && !imageFile) || sending}
                      title={t("sendMessage")}
                    >
                      {sending ? (
                        <div
                          className="spinner"
                          style={{ width: 16, height: 16, borderWidth: 2 }}
                        />
                      ) : (
                        <Icon name="send" size={18} />
                      )}
                    </button>
                  </form>
                </PermissionCheck>
              )}
            </>
          ) : (
            <div className="chat-feed-empty">
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "var(--primary-subtle)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  border: "1px solid rgba(17, 100, 106, 0.2)",
                }}
              >
                <Icon name="message-square" size={32} />
              </div>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  color: "var(--heading)",
                  margin: "0 0 6px 0",
                }}
              >
                {t("selectChatPrompt")}
              </p>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  margin: "0 0 20px 0",
                }}
              >
                {t("noChatsFoundDesc")}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStartNewChat}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px 22px",
                  borderRadius: "12px",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  boxShadow: "0 4px 12px rgba(17, 100, 106, 0.25)",
                }}
              >
                <Icon name="plus" size={15} style={{ display: "block" }} />
                <span style={{ color: "#ffffff" }}>{t("startNewChat")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
