'use client';

import { MessageSquare } from 'lucide-react';

export function FeedbackLauncherButton() {
  const openFeedbackDialog = () => {
    window.dispatchEvent(new CustomEvent('open-feedback-dialog'));
  };

  return (
    <button
      data-feedback-trigger="true"
      onClick={openFeedbackDialog}
      className="fixed bottom-20 left-4 z-40 inline-flex items-center gap-2 rounded-full border border-orange-300 bg-white px-4 py-3 text-sm font-medium text-orange-600 shadow-lg hover:bg-orange-50"
      type="button"
      aria-label="Open feedback form"
    >
      <MessageSquare className="h-4 w-4" />
      Feedback
    </button>
  );
}
