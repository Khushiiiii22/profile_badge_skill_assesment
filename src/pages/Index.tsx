import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import SkillsShowcase from "@/components/SkillsShowcase";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <HowItWorks />
      <SkillsShowcase />
      <Testimonials />
      <Pricing />
      <Footer />
    </div>
  );
};

export default Index;
