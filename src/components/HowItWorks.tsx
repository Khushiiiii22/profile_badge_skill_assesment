import { ClipboardCheck, Key, UserCheck, Award } from "lucide-react";

const steps = [
  {
    icon: ClipboardCheck,
    title: "Choose Your Skill",
    description: "Select from 6 essential life skills to get assessed",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Key,
    title: "Enter PIN & Details",
    description: "Provide your school PIN and basic information",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    icon: UserCheck,
    title: "Get Assessed",
    description: "Meet with a certified assessor for evaluation",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Award,
    title: "Earn Badge & Certificate",
    description: "Receive your QR-verified skill badge and certificate",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-bold">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get your skill badge in four simple steps
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="relative group"
            >
              <div className="bg-card p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 h-full border border-border hover:border-primary/50">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`${step.bgColor} p-4 rounded-full relative`}>
                    <step.icon className={`h-8 w-8 ${step.color}`} />
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary to-transparent"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;