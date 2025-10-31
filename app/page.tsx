"use client";

import { PublicLayout } from "@/components/PublicLayout";
import {
  HeroSection,
  ValuePropositions,
  FeaturedCourses,
  HowItWorks,
  Statistics,
} from "@/components/landing";

export default function Home() {
  return (
    <PublicLayout>
      <HeroSection />
      <ValuePropositions />
      <FeaturedCourses />
      <HowItWorks />
      <Statistics />
    </PublicLayout>
  );
}
