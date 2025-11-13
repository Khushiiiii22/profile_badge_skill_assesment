import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  "Professional skill assessment",
  "Certified assessor evaluation",
  "Detailed rubric-based scoring",
  "QR-verified digital certificate",
  "Shareable skill badge",
  "Lifetime access to profile",
  "Email & WhatsApp notifications",
  "Progress tracking dashboard",
];

const Pricing = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-bold">Simple, Transparent Pricing</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Invest in your future with professional skill assessment
          </p>
        </div>
        
        <div className="max-w-lg mx-auto">
          <Card className="border-4 border-primary/20 shadow-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary to-accent text-white pb-8">
              <div className="text-center space-y-2">
                <CardTitle className="text-3xl">Per Assessment</CardTitle>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold">₹10</span>
                  <span className="text-lg opacity-90">only</span>
                </div>
                <p className="text-white/90">One-time payment per skill</p>
              </div>
            </CardHeader>
            
            <CardContent className="p-8">
              <ul className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="bg-secondary/10 rounded-full p-1 mt-0.5">
                      <Check className="h-4 w-4 text-secondary" />
                    </div>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link to="/get-assessed" className="block">
                <Button variant="hero" size="lg" className="w-full">
                  Get Assessed Now
                </Button>
              </Link>
              
              <p className="text-center text-sm text-muted-foreground mt-4">
                Secure payment via Razorpay
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Pricing;