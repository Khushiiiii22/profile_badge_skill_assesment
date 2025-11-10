import { Link } from "react-router-dom";
import { Award, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Award className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">SkillN</span>
            </div>
            <p className="text-sm text-muted-foreground">
              India's first life skill profiling and assessment portal by Skill Bharat Association
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link to="/get-assessed" className="hover:text-primary transition-colors">Get Assessed</Link></li>
              <li><Link to="/auth" className="hover:text-primary transition-colors">Sign In</Link></li>
              <li><a href="#skills" className="hover:text-primary transition-colors">Skills</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">For Institutions</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#schools" className="hover:text-primary transition-colors">Schools</a></li>
              <li><a href="#assessors" className="hover:text-primary transition-colors">Become Assessor</a></li>
              <li><a href="#partners" className="hover:text-primary transition-colors">Partners</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>info@skilln.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>New Delhi, India</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} SkillN.com - Skill Bharat Association. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;