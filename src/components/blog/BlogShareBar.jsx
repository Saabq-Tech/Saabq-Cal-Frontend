import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import Icon from "../common/Icon";

export default function BlogShareBar({ title = "", url = "" }) {
  const { t } = useLanguage();
  const toast = useToast();

  const shareUrl =
    url || (typeof window !== "undefined" ? window.location.href : "");
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toast?.success?.(t("copiedToClipboard"));
      }
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="blog-share-bar" aria-label={t("shareArticle")}>
      <span className="blog-share-label">
        <Icon name="share-2" size={15} />
        <span>{t("shareArticle")}</span>
      </span>

      <div className="blog-share-links">
        <button
          type="button"
          onClick={handleCopy}
          className="blog-share-btn copy"
          title={t("copiedToClipboard")}
          aria-label="Copy link"
        >
          <Icon name="link" size={15} />
        </button>

        <a
          href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="blog-share-btn whatsapp"
          aria-label="Share on WhatsApp"
        >
          <Icon name="message-circle" size={15} />
        </a>

        <a
          href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="blog-share-btn twitter"
          aria-label="Share on X"
        >
          <Icon name="twitter" size={15} />
        </a>

        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="blog-share-btn linkedin"
          aria-label="Share on LinkedIn"
        >
          <Icon name="linkedin" size={15} />
        </a>

        {typeof navigator !== "undefined" &&
          typeof navigator.share === "function" && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="blog-share-btn native"
              aria-label="Share via device"
            >
              <Icon name="share" size={15} />
            </button>
          )}
      </div>
    </div>
  );
}
