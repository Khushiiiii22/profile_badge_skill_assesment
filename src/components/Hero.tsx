import { Button } from "@/components/ui/button";
import { ArrowRight, Award, Users, Target } from "lucide-react";
import { Link } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.jpg";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 pt-20 pb-32">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
            <div className="inline-block">
              <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                India's First Life Skill Profiling Platform
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Know Your True Skills —{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Beyond Marks
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-lg">
              Get professionally assessed in essential life skills. Earn recognized badges and certificates that showcase your real capabilities.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link to="/get-assessed">
                <Button variant="hero" size="lg" className="group">
                  Get Assessed Now
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>
            
            <div className="flex flex-wrap gap-8 pt-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-secondary" />
                <span className="text-sm font-medium">Certified Assessors</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-secondary" />
                <span className="text-sm font-medium">10,000+ Students</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-secondary" />
                <span className="text-sm font-medium">6 Core Skills</span>
              </div>
            </div>
          </div>
          
          <div className="relative animate-in fade-in slide-in-from-right duration-700 delay-200">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={heroBanner} 
                alt="Students demonstrating life skills" 
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
            </div>
            
            {/* Floating badge decoration */}
            <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-xl shadow-lg border animate-in fade-in slide-in-from-bottom duration-700 delay-500">
              <div className="flex items-center gap-3">
                <div className="bg-secondary/10 p-3 rounded-full">
                  <Award className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="font-semibold">₹1 Only</p>
                  <p className="text-sm text-muted-foreground">Per Assessment</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;