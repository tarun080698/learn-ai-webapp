"use client";

import { PublicLayout } from "@/components/PublicLayout";
import {
  HeroSection,
  ValuePropositions,
  FeaturedCourses,
  HowItWorks,
  Statistics,
} from "@/components/landing";
import CoursePromoVideoSection from "@/components/landing/CoursePromoVideoSection";

export default function Home() {
  return (
    <PublicLayout>
      <HeroSection />
      <CoursePromoVideoSection />
      <ValuePropositions />
      <FeaturedCourses />
      <HowItWorks />
      <Statistics />
    </PublicLayout>
  );
}
