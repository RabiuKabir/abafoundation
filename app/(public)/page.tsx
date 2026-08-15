import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Container, Section } from "@/components/ui/container";

/**
 * Home — Phase 0 placeholder.
 * Built only from design-system tokens and components, so it doubles as proof
 * the system is wired. Real content (featured activities from the database)
 * lands in Phase 2.
 */
const pillars = [
  {
    title: "Clean water, close to home",
    description:
      "Boreholes and hand-pump repairs, maintained by a local committee we train and pay — so the water still runs in year five.",
    image:
      "https://images.unsplash.com/photo-1497486751825-1233686d5d80?auto=format&fit=crop&w=900&q=80",
    alt: "Five children standing together outside their home, smiling at the camera",
  },
  {
    title: "A full year of school",
    description:
      "Fees, uniforms and books for children who would otherwise drop out at the first bad harvest. We follow every child through to the end of the year.",
    image:
      "https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=900&q=80",
    alt: "Children sitting on the floor of a village classroom, listening to a lesson",
  },
  {
    title: "Work that keeps paying",
    description:
      "Small grants and training for women running market stalls and workshops. Ninety per cent are still trading a year after the grant.",
    image:
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=80",
    alt: "A group of children laughing and waving at the camera",
  },
];

export default function HomePage() {
  return (
    <>
      <Section spacing="loose">
        <Container className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-teal uppercase">
              Water · Schooling · Livelihoods
            </p>
            <h1 className="mt-5 text-4xl leading-[1.08] font-semibold tracking-tight text-navy sm:text-5xl lg:text-6xl">
              Small things, done properly, for a long time.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/75">
              ABA Foundation works alongside communities in the places we come
              from. No grand promises — a well that still works in five years, a
              child who finishes the school year, a stall that is still trading
              next season.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/donate"
                className={buttonVariants({ variant: "donate", size: "lg" })}
              >
                Donate
              </Link>
              <Link
                href="/programs"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                See our work
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Donations are made by bank transfer and confirmed by hand against
              our statement. You will hear from a person, not a robot.
            </p>
          </div>

          <div className="relative aspect-[4/5] overflow-hidden rounded-xl shadow-soft sm:aspect-[5/4] lg:aspect-[4/5]">
            <Image
              src="https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1400&q=80"
              alt="A group of children outdoors, one grinning broadly at the camera"
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
        </Container>
      </Section>

      <Section spacing="tight" className="border-t border-border">
        <Container>
          <h2 className="max-w-2xl text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            Three things we do, and keep doing.
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {pillars.map((pillar) => (
              <Card key={pillar.title} className="gap-0 pt-0">
                <div className="relative aspect-[3/2]">
                  <Image
                    src={pillar.image}
                    alt={pillar.alt}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <CardContent className="pt-6">
                  <CardTitle>{pillar.title}</CardTitle>
                  <CardDescription className="mt-3">
                    {pillar.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
