import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Activity, ShieldCheck, Brain, Lock, ArrowRight, HeartPulse } from "lucide-react";
import { ThemeProvider } from "@/components/ThemeProvider";

function Navbar() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            MC
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">MindCheck AI</span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
          <a href="#about" className="hover:text-foreground transition-colors">About</a>
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-4">
          {user ? (
            <Link href={user.is_admin ? "/admin/dashboard" : "/dashboard"}>
              <Button>Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="hidden md:inline-flex">Log in</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default function LandingPage() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="mindcheck-theme">
      <div className="min-h-screen flex flex-col bg-background font-sans text-foreground selection:bg-primary/20">
        <Navbar />
        
        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative pt-24 pb-32 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />
            <div className="container mx-auto px-4 md:px-8 text-center max-w-4xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
                <ShieldCheck className="w-4 h-4" />
                <span>Your trusted mental health companion</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-foreground">
                Understand your digital wellbeing with clinical precision.
              </h1>
              <p className="text-xl text-muted-foreground mb-12 leading-relaxed max-w-2xl mx-auto">
                MindCheck AI analyzes your social media habits and digital lifestyle to provide professional, actionable insights for your mental health.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="h-14 px-8 text-lg rounded-full">
                    Start Your Assessment <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full">
                    I already have an account
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="py-24 bg-muted/50">
            <div className="container mx-auto px-4 md:px-8 max-w-6xl">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Clinical insights for your daily life</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  We blend advanced AI analysis with established clinical frameworks to help you navigate the digital world safely.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: Brain,
                    title: "AI-Powered Analysis",
                    description: "Advanced machine learning algorithms identify subtle patterns in your digital habits that impact your mood."
                  },
                  {
                    icon: Activity,
                    title: "Progress Tracking",
                    description: "Visualize your mental wellbeing over time with intuitive, professional-grade progress charts."
                  },
                  {
                    icon: Lock,
                    title: "Strict Privacy",
                    description: "Your health data is encrypted and secure. We adhere to strict privacy standards to protect your information."
                  }
                ].map((feature, i) => (
                  <div key={i} className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How it works */}
          <section id="how-it-works" className="py-24">
            <div className="container mx-auto px-4 md:px-8 max-w-5xl">
              <div className="flex flex-col md:flex-row items-center gap-16">
                <div className="flex-1 space-y-8">
                  <h2 className="text-3xl md:text-4xl font-bold">How MindCheck works</h2>
                  <div className="space-y-6">
                    {[
                      { step: "01", title: "Complete the Assessment", desc: "Answer six simple questions about your digital habits and current wellbeing." },
                      { step: "02", title: "Receive Your Analysis", desc: "Our AI model analyzes your inputs against clinical patterns." },
                      { step: "03", title: "Review Recommendations", desc: "Get personalized, actionable steps to improve your digital mental health." }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground shrink-0">
                          {item.step}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold mb-1">{item.title}</h4>
                          <p className="text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 w-full relative">
                   <div className="aspect-square rounded-3xl bg-gradient-to-tr from-primary/20 to-secondary overflow-hidden flex items-center justify-center shadow-lg border relative">
                      <HeartPulse className="w-32 h-32 text-primary opacity-50" />
                   </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-24 bg-primary text-primary-foreground text-center">
            <div className="container mx-auto px-4 md:px-8 max-w-3xl">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">Ready to understand your digital wellbeing?</h2>
              <p className="text-primary-foreground/80 text-lg mb-10">
                Join thousands of users taking control of their mental health in the digital age.
              </p>
              <Link href="/register">
                <Button size="lg" variant="secondary" className="h-14 px-10 text-lg rounded-full bg-white text-primary hover:bg-white/90">
                  Create Your Free Account
                </Button>
              </Link>
            </div>
          </section>
        </main>

        <footer className="bg-card border-t py-12">
          <div className="container mx-auto px-4 md:px-8 text-center text-muted-foreground">
            <div className="flex justify-center items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                MC
              </div>
              <span className="font-semibold text-foreground">MindCheck AI</span>
            </div>
            <p className="text-sm">© {new Date().getFullYear()} MindCheck AI. All rights reserved.</p>
            <p className="text-xs mt-2 max-w-md mx-auto">
              MindCheck AI is an informational tool and does not replace professional medical advice, diagnosis, or treatment.
            </p>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}
