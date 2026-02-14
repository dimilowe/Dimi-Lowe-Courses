interface FeedbackNotificationPayload {
  feedbackType: string;
  subject: string;
  message: string;
  email?: string | null;
  priority?: string | null;
  authorName?: string | null;
  authorBio?: string | null;
  createdAt?: string | Date | null;
}

function buildSummary(payload: FeedbackNotificationPayload) {
  const created = payload.createdAt
    ? new Date(payload.createdAt).toISOString()
    : new Date().toISOString();

  return {
    created,
    feedbackType: payload.feedbackType,
    subject: payload.subject,
    message: payload.message,
    email: payload.email || "Not provided",
    priority: payload.priority || "medium",
    authorName: payload.authorName || "Not provided",
    authorBio: payload.authorBio || "Not provided",
  };
}

async function sendSlackNotification(payload: FeedbackNotificationPayload) {
  const webhookUrl = process.env.FEEDBACK_SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const summary = buildSummary(payload);
  const body = {
    text: `New feedback received: ${summary.subject}`,
    blocks: [
      { type: "header", text: { type: "plain_text", text: "New Feedback Submission" } },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Type:*\n${summary.feedbackType}` },
          { type: "mrkdwn", text: `*Priority:*\n${summary.priority}` },
          { type: "mrkdwn", text: `*Email:*\n${summary.email}` },
          { type: "mrkdwn", text: `*Created:*\n${summary.created}` },
        ],
      },
      { type: "section", text: { type: "mrkdwn", text: `*Subject:*\n${summary.subject}` } },
      { type: "section", text: { type: "mrkdwn", text: `*Message:*\n${summary.message}` } },
    ],
  };

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function sendResendNotification(payload: FeedbackNotificationPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.FEEDBACK_NOTIFY_EMAIL;
  const fromEmail = process.env.FEEDBACK_FROM_EMAIL;
  if (!apiKey || !toEmail || !fromEmail) return;

  const summary = buildSummary(payload);
  const text = [
    "New feedback submission",
    `Type: ${summary.feedbackType}`,
    `Priority: ${summary.priority}`,
    `Created: ${summary.created}`,
    `Email: ${summary.email}`,
    `Author Name: ${summary.authorName}`,
    `Author Bio: ${summary.authorBio}`,
    "",
    `Subject: ${summary.subject}`,
    "",
    "Message:",
    summary.message,
  ].join("\n");

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: `[VCM Feedback] ${summary.feedbackType}: ${summary.subject}`,
      text,
    }),
  });
}

export async function notifyFeedbackSubmission(payload: FeedbackNotificationPayload) {
  const tasks = [sendSlackNotification(payload), sendResendNotification(payload)];
  const results = await Promise.allSettled(tasks);

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      const channel = index === 0 ? "slack" : "email";
      console.error(`Feedback ${channel} notification failed:`, result.reason);
    }
  });
}
