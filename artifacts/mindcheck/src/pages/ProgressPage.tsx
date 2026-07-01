import { useGetAssessmentHistory, getGetAssessmentHistoryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { ArrowRight, Activity, TrendingUp } from "lucide-react";

export default function ProgressPage() {
  const { data: history, isLoading } = useGetAssessmentHistory({
    query: { queryKey: getGetAssessmentHistoryQueryKey() }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Your Progress</h1>
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h2 className="text-xl font-medium mb-2">No history yet</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Complete your first assessment to start tracking your mental wellbeing journey.
            </p>
            <Link href="/assessment">
              <Button>Take Assessment</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format data for chart
  const chartData = [...history].reverse().map(assessment => ({
    date: format(new Date(assessment.created_at), "MMM d"),
    wellbeing: Math.round(assessment.prediction.digital_wellbeing_score),
    mood: Math.round(assessment.prediction.mood_score),
    risk: assessment.prediction.risk_level
  }));

  const getRiskBadgeColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "low": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      case "moderate": return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      case "high": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Progress</h1>
        <p className="text-muted-foreground mt-1">Track your mental wellbeing trends over time.</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Score Trends
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.5rem",
                    boxShadow: "var(--shadow-sm)"
                  }}
                  itemStyle={{ fontWeight: 500 }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                <Line 
                  type="monotone" 
                  name="Digital Wellbeing"
                  dataKey="wellbeing" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  name="Mood Score"
                  dataKey="mood" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: "hsl(var(--chart-2))", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assessment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead className="text-right">Wellbeing Score</TableHead>
                  <TableHead className="text-right">Mood Score</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="font-medium">
                      {format(new Date(assessment.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskBadgeColor(assessment.prediction.risk_level)}`}>
                        {assessment.prediction.risk_level}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {Math.round(assessment.prediction.digital_wellbeing_score)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {Math.round(assessment.prediction.mood_score)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/results/${assessment.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
