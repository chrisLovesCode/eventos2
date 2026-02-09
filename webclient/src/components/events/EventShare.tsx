"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faXTwitter,
  faLinkedin,
  faPinterest,
} from "@fortawesome/free-brands-svg-icons";
import { faShareNodes, faCheck } from "@fortawesome/free-solid-svg-icons";

interface EventShareProps {
  event: {
    name: string;
    slug: string;
    description?: string | null;
  };
}

export function EventShare({ event }: EventShareProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/events/${event.slug}`
    : "";
  const shareText = `${event.name} - ${event.description || "Schaue dir dieses Event an!"}`;

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Share abgebrochen oder fehlgeschlagen", err);
      }
    } else {
      // Fallback: Copy to clipboard
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Fehler beim Kopieren:", err);
    }
  };

  const handleSocialShare = (platform: string) => {
    const resolvedUrl = shareUrl || (typeof window !== "undefined" ? window.location.href : "");
    if (!resolvedUrl) return;

    const encodedUrl = encodeURIComponent(resolvedUrl);
    const encodedText = encodeURIComponent(shareText);
    
    let url = "";
    
    switch (platform) {
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedText}&summary=${encodedText}`;
        break;
      case "pinterest":
        url = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`;
        break;
      default:
        return;
    }
    
    window.open(url, "_blank", "width=600,height=400");
  };

  return (
    <div className="card-sidebar">
      <h3 className="mb-4 text-lg font-semibold text-foreground">
        Mit Freunden teilen
      </h3>
      
      {/* Native Share Button */}
      {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
        <button
          onClick={handleWebShare}
          className="mb-4 surface-button"
        >
          <FontAwesomeIcon icon={faShareNodes} className="h-4 w-4" />
          Teilen
        </button>
      )}
      
      {/* Social Media Buttons */}
      <div className="grid grid-cols-4 gap-2 justify-items-center">
        <button
          onClick={() => handleSocialShare("facebook")}
          className="social-button bg-[#1877F2]"
          aria-label="Auf Facebook teilen"
        >
          <FontAwesomeIcon icon={faFacebook} className="h-5 w-5" />
        </button>
        
        <button
          onClick={() => handleSocialShare("twitter")}
          className="social-button bg-[#000000]"
          aria-label="Auf X/Twitter teilen"
        >
          <FontAwesomeIcon icon={faXTwitter} className="h-5 w-5" />
        </button>
        
        <button
          onClick={() => handleSocialShare("linkedin")}
          className="social-button bg-[#0A66C2]"
          aria-label="Auf LinkedIn teilen"
        >
          <FontAwesomeIcon icon={faLinkedin} className="h-5 w-5" />
        </button>
        
        <button
          onClick={() => handleSocialShare("pinterest")}
          className="social-button bg-[#E60023]"
          aria-label="Auf Pinterest teilen"
        >
          <FontAwesomeIcon icon={faPinterest} className="h-5 w-5" />
        </button>
      </div>
      
      {/* Copy Link Button */}
      <button
        onClick={handleCopyLink}
        className="mt-4 surface-button"
      >
        {copied ? (
          <>
            <FontAwesomeIcon icon={faCheck} className="h-4 w-4 text-success" />
            Link kopiert!
          </>
        ) : (
          "Link kopieren"
        )}
      </button>
    </div>
  );
}
