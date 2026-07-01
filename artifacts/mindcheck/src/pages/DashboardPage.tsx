import { Link } from "wouter";
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, HeartPulse, Brain, AlertTriangle, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: summary, isLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const getRiskColor = (risk: string | null) => {
    switch (risk?.toLowerCase()) {
      case "low": return "text-emerald-500 bg-emerald-500/10";
      case "moderate": return "text-amber-500 bg-amber-500/10";
      case "high": return "text-destructive bg-destructive/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.full_name?.split(" ")[0]}</h1>
          <p className="text-muted-foreground mt-1">Here is an overview of your mental wellbeing.</p>
        </div>
        <Link href="/assessment">
          <Button size="lg" className="rounded-full">
            <FileText className="mr-2 h-4 w-4" />
            New Assessment
          </Button>
        </Link>
      </div>

      {!summary?.total_assessments ? (
        <Card className="bg-primary/5 border-primary/20 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Start Your Journey</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              You haven't taken any assessments yet. Complete your first assessment to unlock personalized insights and recommendations.
            </p>
            <Link href="/assessment">
              <Button>Take First Assessment</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total_assessments}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Lifetime completions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Latest Risk Level</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className={`text-2xl font-bold px-2.5 py-0.5 rounded-md text-sm ${getRiskColor(summary.latest_risk_level)}`}>
                    {summary.latest_risk_level || "N/A"}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Based on your last check-in
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Digital Wellbeing</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold">{summary.latest_digital_wellbeing_score?.toFixed(0) || 0}</div>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                </div>
                <Progress value={summary.latest_digital_wellbeing_score || 0} className="h-2 mt-3" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mood Score</CardTitle>
                <HeartPulse className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold">{summary.latest_mood_score?.toFixed(0) || 0}</div>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                </div>
                <Progress value={summary.latest_mood_score || 0} className="h-2 mt-3" />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Recommendations</CardTitle>
                <CardDescription>Based on your latest assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 bg-muted/50 p-3 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-sm">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Establish screen-free zones</p>
                      <p className="text-xs text-muted-foreground mt-1">Create areas in your home, like the bedroom, where devices are not allowed to improve sleep quality.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-muted/50 p-3 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-sm">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Mindful scrolling</p>
                      <p className="text-xs text-muted-foreground mt-1">Set a 15-minute timer when using social media to prevent infinite scrolling.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/progress">
                    <Button variant="outline" className="w-full">
                      View Full History
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Insights</CardTitle>
                <CardDescription>Your trends at a glance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Risk Trend</span>
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">Your risk level has been stable over the last 3 assessments.</p>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Mood Pattern</span>
                      <HeartPulse className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">Your mood score indicates consistent emotional wellbeing.</p>
                  </div>
                  <div className="border-t pt-4">
                    <Link href="/progress">
                      <Button variant="link" className="px-0 h-auto text-primary">Explore Detailed Analytics</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// Stub for Activity icon since it might not be imported correctly if I didn't add it to the top
function Activity(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
}
