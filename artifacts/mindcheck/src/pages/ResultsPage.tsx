import { useRoute, Link } from "wouter";
import { useGetAssessment, getGetAssessmentQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ArrowLeft, CheckCircle, Info, HeartPulse } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format } from "date-fns";

export default function ResultsPage() {
  const [, params] = useRoute("/results/:id");
  const id = params?.id ? parseInt(params.id, 10) : null;
  
  const { data: assessment, isLoading } = useGetAssessment(id!, {
    query: {
      enabled: !!id,
      queryKey: getGetAssessmentQueryKey(id!)
    }
  });

  if (isLoading || !assessment) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const getRiskDetails = (level: string) => {
    switch (level.toLowerCase()) {
      case "low": return { color: "text-emerald-500", bg: "bg-emerald-500/10", icon: CheckCircle };
      case "moderate": return { color: "text-amber-500", bg: "bg-amber-500/10", icon: Info };
      case "high": return { color: "text-destructive", bg: "bg-destructive/10", icon: AlertTriangle };
      default: return { color: "text-muted-foreground", bg: "bg-muted", icon: Info };
    }
  };

  const riskDetails = getRiskDetails(assessment.prediction.risk_level);
  const RiskIcon = riskDetails.icon;

  const chartData = assessment.prediction.feature_importance.map(f => ({
    name: f.label,
    importance: Math.round(f.importance * 100),
    feature: f.feature
  }));

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-2 -ml-3">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Assessment Results</h1>
          <p className="text-muted-foreground mt-1">
            Completed on {format(new Date(assessment.created_at), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
      </div>

      {/* Main Score Card */}
      <Card className="border-0 shadow-lg overflow-hidden bg-card/50 backdrop-blur">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <HeartPulse className="w-64 h-64" />
        </div>
        <CardContent className="p-8 md:p-12 relative z-10">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="col-span-1 border-r border-border/50 pr-8">
              <div className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Overall Risk Level</div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-4 ${riskDetails.bg} ${riskDetails.color}`}>
                <RiskIcon className="w-6 h-6" />
                <span className="text-2xl font-bold">{assessment.prediction.risk_level}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Model confidence: {(assessment.prediction.confidence * 100).toFixed(1)}%
              </p>
            </div>
            
            <div className="col-span-2 grid grid-cols-2 gap-8">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Digital Wellbeing Score</div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-4xl font-bold text-primary">{Math.round(assessment.prediction.digital_wellbeing_score)}</span>
                  <span className="text-muted-foreground pb-1">/ 100</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${assessment.prediction.digital_wellbeing_score}%` }} 
                  />
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Mood Score</div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-4xl font-bold text-primary">{Math.round(assessment.prediction.mood_score)}</span>
                  <span className="text-muted-foreground pb-1">/ 100</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${assessment.prediction.mood_score}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Recommendations */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Clinical Recommendations</CardTitle>
            <CardDescription>Personalized steps to improve your wellbeing</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {assessment.prediction.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-3 bg-muted/40 p-4 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-sm font-bold mt-0.5">
                    {i + 1}
                  </div>
                  <span className="text-sm leading-relaxed">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Feature Importance */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Impact Factors</CardTitle>
            <CardDescription>What influenced your score the most</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    formatter={(value) => [`${value}% impact`, 'Importance']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="importance" radius={[0, 4, 4, 0]} barSize={20}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="hsl(var(--primary))" fillOpacity={0.8 + (index * 0.05)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Answers Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Your Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Social Media Hours</div>
              <div className="font-medium">{assessment.answers.social_media_hours}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Sleep Quality</div>
              <div className="font-medium">{assessment.answers.sleep_quality}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Stress Frequency</div>
              <div className="font-medium">{assessment.answers.stress_frequency}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Social Comparison</div>
              <div className="font-medium">{assessment.answers.social_comparison}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Exercise Frequency</div>
              <div className="font-medium">{assessment.answers.exercise_frequency}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Mood</div>
              <div className="font-medium">{assessment.answers.mood}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
