import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/community-guidelines")({
  head: () =>
    seoHead({
      title: "Community Guidelines | namflirt. Namibia",
      description:
        "See the honesty, consent, respect and safety standards that guide the namflirt. dating community across Namibia.",
      path: "/community-guidelines",
    }),
  component: CommunityGuidelines,
});

function CommunityGuidelines() {
  return (
    <PolicyPage
      eyebrow="Community"
      title="Community guidelines"
      intro="namflirt. is for people who want to meet across Namibia with honesty, curiosity, and care. These guidelines describe the behavior we expect from every member."
      sections={[
        {
          title: "Be real",
          body: "Use your own photos, describe yourself truthfully, and be clear about what you are looking for.",
          items: [
            "Do not impersonate, catfish, or misrepresent your age, identity, relationship status, or intentions.",
            "Avoid heavily misleading edits, stolen photos, fake occupations, or false locations.",
            "Keep profile prompts useful and appropriate for a dating community.",
          ],
        },
        {
          title: "Be respectful",
          body: "Members come from different cultures, languages, regions, families, beliefs, and life experiences. Curiosity is welcome; disrespect is not.",
          items: [
            "No hate speech, slurs, insults, cultural mockery, threats, or intimidation.",
            "No sexual harassment, explicit pressure, or repeated unwanted messages.",
            "Respect boundaries when someone says no, stops replying, or unmatches.",
          ],
        },
        {
          title: "Keep the community safe",
          body: "Do not use namflirt. to exploit, deceive, or pressure people.",
          items: [
            "No scams, financial requests, blackmail, spam, or paid promotion without permission.",
            "No sharing another member's private information or screenshots to shame them.",
            "Report suspicious, abusive, or unsafe profiles.",
          ],
        },
        {
          title: "Account action",
          body: "Profiles that break these guidelines may be warned, limited, removed from discovery, suspended, or permanently banned depending on the behavior and risk.",
        },
      ]}
    />
  );
}
