import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/safety")({
  head: () =>
    seoHead({
      title: "Online Dating Safety in Namibia | namflirt.",
      description:
        "Practical online dating safety guidance for Namibia, including privacy, scam awareness, respectful boundaries and safer first meetings.",
      path: "/safety",
    }),
  component: Safety,
});

function Safety() {
  return (
    <PolicyPage
      eyebrow="Safety"
      title="Safety center"
      intro="Meeting new people should feel calm, clear, and in your control. These safety notes help members protect themselves online and when deciding to meet in person."
      sections={[
        {
          title: "Protect your personal information",
          body: "Take time before sharing details that could identify where you live, work, study, bank, or travel every day.",
          items: [
            "Keep your ID numbers, passwords, payment details, and one-time codes private.",
            "Be careful with requests for money, gifts, airtime, transport fees, or investments.",
            "Use in-app messaging until you feel confident about the person you are speaking with.",
          ],
        },
        {
          title: "Watch for unsafe behavior",
          body: "Trust your instincts. Pressure, secrecy, rushed romance, inconsistent stories, and aggressive responses are signs to pause or report.",
          items: [
            "Block and report members who threaten, harass, shame, or manipulate you.",
            "Do not send intimate photos under pressure.",
            "End conversations when someone ignores your boundaries.",
          ],
        },
        {
          title: "Meet carefully",
          body: "If you choose to meet, pick a public place, tell someone you trust, arrange your own transport, and keep your phone charged.",
          items: [
            "Avoid first meetings in private homes, isolated places, or unfamiliar locations.",
            "Do not leave drinks or belongings unattended.",
            "Leave immediately if the situation feels wrong.",
          ],
        },
        {
          title: "Get help",
          body: "For urgent danger, contact local emergency services first. For app behavior concerns, report the profile so the namflirt. team can review it.",
        },
      ]}
    />
  );
}
