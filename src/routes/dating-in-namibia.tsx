import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/dating-in-namibia")({
  head: () =>
    seoHead({
      title: "Dating in Namibia | Namibia's Own Dating Site | namflirt.",
      description:
        "Dating in Namibia for single women and single men. Meet Namibian singles on namflirt., a Namibia-first dating site for real local connection.",
      path: "/dating-in-namibia",
    }),
  component: DatingInNamibia,
});

function DatingInNamibia() {
  return (
    <PolicyPage
      eyebrow="Dating in Namibia"
      title="Namibia's own dating site"
      intro="namflirt. is built for dating in Namibia: real people, local towns, familiar languages, cultural context, and a calmer way for single women and single men to meet."
      sections={[
        {
          title: "Built for Namibian singles",
          body: "Generic dating apps often flatten local context. namflirt. gives members room to share where they are from, what languages they speak, what matters to them, and what kind of relationship they want.",
          items: [
            "Meet singles in Windhoek, Swakopmund, Walvis Bay, Ongwediva, Rundu, Katima Mulilo, and towns across Namibia.",
            "Browse profiles shaped around culture, language, lifestyle, faith, interests, and relationship goals.",
            "Start with Premium access for 30 days.",
          ],
        },
        {
          title: "A Namibia-first dating experience",
          body: "The experience is designed around people who live in Namibia or care about building a connection here, with discovery that respects place, background, and intention.",
          items: [
            "Helpful profile details make first messages easier and more respectful.",
            "Safety, reporting, and admin moderation are part of the product from the start.",
            "Admin accounts are hidden from member discovery so users see real member profiles.",
          ],
        },
        {
          title: "For serious and casual connection",
          body: "Whether members want marriage, a serious relationship, friendship first, or an open conversation, namflirt. helps people be clear before the first message.",
        },
      ]}
    />
  );
}
