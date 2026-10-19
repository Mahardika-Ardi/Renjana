'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Plus } from 'lucide-react';
import { useInvite } from '@/hooks/auth/use-invite';
import { useHome } from '@/components/home/home-i18n';
import JournalToast from '@/components/journal/journal-toast';

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/* Partner slot for single users: generates an invite link and copies it.
 * Shows inline confirmation — no navigation, no backend coupling beyond
 * the generate call.
 */
export default function InviteButton() {
  const { generate, generating } = useInvite();
  const t = useHome();
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleClick = async () => {
    if (generating || copied) return;
    setFailed(false);
    const invite = await generate();
    if (!invite) {
      setFailed(true);
      return;
    }
    const ok = await copyText(invite.inviteUrl);
    if (!ok) {
      setFailed(true);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3200);
  };

  return (
    <div className="relative z-20 flex flex-col items-center">
      <motion.button
        type="button"
        onClick={() => {
          void handleClick();
        }}
        disabled={generating}
        whileTap={{ scale: 0.92 }}
        title={t.invite.inviteTitle}
        aria-label={t.invite.inviteAria}
        className="flex h-16.5 w-16.5 items-center justify-center rounded-full border-[3px] border-dashed border-[#b1a082] bg-[#faf6f0] text-[#c96f4a] shadow-sm transition hover:bg-[#faebe6] disabled:cursor-wait md:h-18 md:w-18"
      >
        {copied ? (
          <Check className="h-6 w-6" aria-hidden />
        ) : (
          <Plus className="h-6 w-6" aria-hidden />
        )}
      </motion.button>

      <span className="mt-3 text-center text-sm text-[#4f4b43]">
        {copied ? t.invite.copied : failed ? t.invite.copyFailed : t.invite.invite}
      </span>

      <JournalToast message={copied ? t.invite.copied : null} />
    </div>
  );
}
