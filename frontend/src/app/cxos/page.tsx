"use client";

import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Clock, DollarSign, Star, Mail, Phone, Linkedin } from "lucide-react";
import Link from "next/link";

interface CXOProfile {
  id: string;
  name: string;
  role: "CFO" | "CMO" | "COO" | "CTO";
  title: string;
  experience: string;
  image: string;
  rate: number; // RM per hour
  rating: number;
  reviews: number;
  specialties: string[];
  bio: string;
  email: string;
  linkedin?: string;
}

const cxos: CXOProfile[] = [
  // CFOs
  {
    id: "cfo-1",
    name: "Sarah Chen",
    role: "CFO",
    title: "Fractional CFO | Financial Strategy Expert",
    experience: "15+ years in SME finance and fundraising",
    image: "/images/cxos/cfo-1.jpg",
    rate: 100,
    rating: 4.9,
    reviews: 47,
    specialties: ["Cash Flow Management", "Fundraising", "Financial Modeling", "M&A"],
    bio: "Former CFO of 3 successful exits. Specialized in helping SMEs raise capital and optimize financial operations.",
    email: "sarah.chen@execconnect.com",
    linkedin: "linkedin.com/in/sarahchencfo",
  },
  {
    id: "cfo-2",
    name: "David Lim",
    role: "CFO",
    title: "Fractional CFO | Growth Finance Specialist",
    experience: "12+ years scaling startups and SMEs",
    image: "/images/cxos/cfo-2.jpg",
    rate: 100,
    rating: 4.8,
    reviews: 32,
    specialties: ["Cost Optimization", "Unit Economics", "FP&A", "Investor Relations"],
    bio: "Helped 50+ companies achieve profitability. Expert in building financial systems for high-growth businesses.",
    email: "david.lim@execconnect.com",
    linkedin: "linkedin.com/in/davidlimcfo",
  },
  {
    id: "cfo-3",
    name: "Priya Sharma",
    role: "CFO",
    title: "Fractional CFO | Turnaround Specialist",
    experience: "18+ years in financial restructuring",
    image: "/images/cxos/cfo-3.jpg",
    rate: 100,
    rating: 5.0,
    reviews: 28,
    specialties: ["Financial Restructuring", "Risk Management", "Compliance", "Audit"],
    bio: "Turned around 20+ distressed companies. Expert in financial crisis management and regulatory compliance.",
    email: "priya.sharma@execconnect.com",
  },
  // CMOs
  {
    id: "cmo-1",
    name: "James Tan",
    role: "CMO",
    title: "Fractional CMO | Growth Marketing Expert",
    experience: "14+ years in digital marketing and growth",
    image: "/images/cxos/cmo-1.jpg",
    rate: 100,
    rating: 4.9,
    reviews: 56,
    specialties: ["Digital Marketing", "Customer Acquisition", "Brand Strategy", "Growth Hacking"],
    bio: "Built marketing engines for 100+ companies. Reduced CAC by 40% on average for clients.",
    email: "james.tan@execconnect.com",
    linkedin: "linkedin.com/in/jamestancmo",
  },
  {
    id: "cmo-2",
    name: "Lisa Wong",
    role: "CMO",
    title: "Fractional CMO | B2B Marketing Specialist",
    experience: "16+ years in B2B and enterprise marketing",
    image: "/images/cxos/cmo-2.jpg",
    rate: 100,
    rating: 4.7,
    reviews: 41,
    specialties: ["B2B Marketing", "Content Strategy", "Marketing Automation", "Lead Generation"],
    bio: "Expert in B2B go-to-market strategies. Helped 30+ SaaS companies scale from zero to $10M ARR.",
    email: "lisa.wong@execconnect.com",
    linkedin: "linkedin.com/in/lisawongcmo",
  },
  {
    id: "cmo-3",
    name: "Ahmad Rahman",
    role: "CMO",
    title: "Fractional CMO | E-commerce Growth Expert",
    experience: "13+ years in retail and e-commerce",
    image: "/images/cxos/cmo-3.jpg",
    rate: 100,
    rating: 4.8,
    reviews: 38,
    specialties: ["E-commerce", "Social Media", "Influencer Marketing", "Customer Retention"],
    bio: "Scaled multiple e-commerce brands to $50M+. Expert in omnichannel marketing and customer lifetime value.",
    email: "ahmad.rahman@execconnect.com",
  },
  // COOs
  {
    id: "coo-1",
    name: "Michelle Lee",
    role: "COO",
    title: "Fractional COO | Operations Excellence",
    experience: "17+ years optimizing operations",
    image: "/images/cxos/coo-1.jpg",
    rate: 100,
    rating: 4.9,
    reviews: 44,
    specialties: ["Process Optimization", "Supply Chain", "Quality Management", "Lean Operations"],
    bio: "Improved operational efficiency by 30%+ for 60+ companies. Expert in building scalable operations systems.",
    email: "michelle.lee@execconnect.com",
    linkedin: "linkedin.com/in/michelleleecoo",
  },
  {
    id: "coo-2",
    name: "Rajesh Kumar",
    role: "COO",
    title: "Fractional COO | Manufacturing & Logistics",
    experience: "15+ years in manufacturing operations",
    image: "/images/cxos/coo-2.jpg",
    rate: 100,
    rating: 4.8,
    reviews: 35,
    specialties: ["Manufacturing", "Logistics", "Inventory Management", "Vendor Management"],
    bio: "Transformed manufacturing operations for 25+ companies. Reduced costs by 25% while improving quality.",
    email: "rajesh.kumar@execconnect.com",
  },
  {
    id: "coo-3",
    name: "Jennifer Ng",
    role: "COO",
    title: "Fractional COO | Service Operations",
    experience: "12+ years in service business operations",
    image: "/images/cxos/coo-3.jpg",
    rate: 100,
    rating: 5.0,
    reviews: 29,
    specialties: ["Service Delivery", "Team Management", "SOP Development", "Customer Experience"],
    bio: "Scaled service businesses from 10 to 200+ employees. Expert in creating efficient service delivery systems.",
    email: "jennifer.ng@execconnect.com",
    linkedin: "linkedin.com/in/jenniferngcoo",
  },
  // CTOs
  {
    id: "cto-1",
    name: "Kevin Tan",
    role: "CTO",
    title: "Fractional CTO | Digital Transformation",
    experience: "20+ years in technology leadership",
    image: "/images/cxos/cto-1.jpg",
    rate: 100,
    rating: 4.9,
    reviews: 52,
    specialties: ["Digital Transformation", "Cloud Architecture", "DevOps", "AI/ML"],
    bio: "Led digital transformation for 40+ companies. Expert in modernizing legacy systems and building scalable tech stacks.",
    email: "kevin.tan@execconnect.com",
    linkedin: "linkedin.com/in/kevintancto",
  },
  {
    id: "cto-2",
    name: "Nurul Huda",
    role: "CTO",
    title: "Fractional CTO | Product Engineering",
    experience: "16+ years in software product development",
    image: "/images/cxos/cto-2.jpg",
    rate: 100,
    rating: 4.8,
    reviews: 37,
    specialties: ["Product Development", "Agile/Scrum", "Team Building", "Tech Stack Selection"],
    bio: "Built products from zero to millions of users. Expert in product engineering and technical team leadership.",
    email: "nurul.huda@execconnect.com",
  },
  {
    id: "cto-3",
    name: "Michael Chua",
    role: "CTO",
    title: "Fractional CTO | Security & Compliance",
    experience: "18+ years in cybersecurity and compliance",
    image: "/images/cxos/cto-3.jpg",
    rate: 100,
    rating: 4.9,
    reviews: 31,
    specialties: ["Cybersecurity", "Data Privacy", "Compliance", "Risk Management"],
    bio: "Secured 100+ companies against cyber threats. Expert in implementing security frameworks and compliance standards.",
    email: "michael.chua@execconnect.com",
    linkedin: "linkedin.com/in/michaelchuacto",
  },
];

export default function CXOsPage() {
  const [selectedRole, setSelectedRole] = useState<"ALL" | "CFO" | "CMO" | "COO" | "CTO">("ALL");

  const filteredCXOs = selectedRole === "ALL" 
    ? cxos 
    : cxos.filter(cxo => cxo.role === selectedRole);

  const roleColors = {
    CFO: "bg-blue-100 text-blue-800",
    CMO: "bg-purple-100 text-purple-800",
    COO: "bg-green-100 text-green-800",
    CTO: "bg-orange-100 text-orange-800",
  };

  return (
    <Shell>
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Request Expert Review</h1>
          <p className="text-xl text-gray-600 mb-6">
            Experienced experts ready to review your diagnostic and support key decisions
          </p>
          <p className="text-gray-600 mb-8">
            Rate: RM 100/hour | Book a consultation or request expert review when critical decisions are needed
          </p>
        </div>

        {/* Role Filter */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          <Button
            variant={selectedRole === "ALL" ? "default" : "outline"}
            onClick={() => setSelectedRole("ALL")}
          >
            All CXOs
          </Button>
          <Button
            variant={selectedRole === "CFO" ? "default" : "outline"}
            onClick={() => setSelectedRole("CFO")}
          >
            CFOs
          </Button>
          <Button
            variant={selectedRole === "CMO" ? "default" : "outline"}
            onClick={() => setSelectedRole("CMO")}
          >
            CMOs
          </Button>
          <Button
            variant={selectedRole === "COO" ? "default" : "outline"}
            onClick={() => setSelectedRole("COO")}
          >
            COOs
          </Button>
          <Button
            variant={selectedRole === "CTO" ? "default" : "outline"}
            onClick={() => setSelectedRole("CTO")}
          >
            CTOs
          </Button>
        </div>

        {/* CXO Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCXOs.map((cxo) => (
            <Card key={cxo.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                      {cxo.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg mb-1">{cxo.name}</CardTitle>
                    <Badge className={roleColors[cxo.role]}>{cxo.role}</Badge>
                    <p className="text-sm text-gray-600 mt-2">{cxo.title}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{cxo.experience}</p>
                    <p className="text-sm text-gray-700">{cxo.bio}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Specialties</p>
                    <div className="flex flex-wrap gap-1">
                      {cxo.specialties.slice(0, 3).map((spec, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium">{cxo.rating}</span>
                      <span className="text-xs text-gray-500">({cxo.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                      <DollarSign className="w-4 h-4" />
                      <span>RM {cxo.rate}/hr</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/book-cxo/${cxo.id}`} className="flex-1">
                      <Button className="w-full" size="sm">
                        <Clock className="w-4 h-4 mr-2" />
                        Book Consultation
                      </Button>
                    </Link>
                    <Link href={`/cxos/${cxo.id}`}>
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Note about AI Integration */}
        <Card className="mt-12 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-2">Diagnostics + Expert Review</h3>
              <p className="text-gray-700 text-sm mb-4">
                Run a decision diagnostic first for instant insights. When you need human judgment for critical decisions,
                request an expert review or book a consultation.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/get-started">
                  <Button variant="outline">Run a diagnostic first</Button>
                </Link>
                <Link href="/contact">
                  <Button>Book Expert Review</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}

