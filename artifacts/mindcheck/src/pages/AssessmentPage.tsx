import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { useSubmitAssessment } from "@workspace/api-client-react";
import { toast } from "sonner";
import { 
  AssessmentInputSocialMediaHours, 
  AssessmentInputSleepQuality,
  AssessmentInputStressFrequency,
  AssessmentInputSocialComparison,
  AssessmentInputExerciseFrequency,
  AssessmentInputMood
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

const QUESTIONS = [
  {
    id: "social_media_hours",
    title: "How many hours do you spend on social media daily?",
    options: Object.values(AssessmentInputSocialMediaHours),
  },
  {
    id: "sleep_quality",
    title: "How would you rate your sleep quality?",
    options: Object.values(AssessmentInputSleepQuality),
  },
  {
    id: "stress_frequency",
    title: "How often do you feel stressed?",
    options: Object.values(AssessmentInputStressFrequency),
  },
  {
    id: "social_comparison",
    title: "How often do you compare yourself with others on social media?",
    options: Object.values(AssessmentInputSocialComparison),
  },
  {
    id: "exercise_frequency",
    title: "How often do you exercise?",
    options: Object.values(AssessmentInputExerciseFrequency),
  },
  {
    id: "mood",
    title: "Overall, how would you describe your current mood?",
    options: Object.values(AssessmentInputMood),
  }
];

export default function AssessmentPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const submitMutation = useSubmitAssessment();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  const handleOptionSelect = (option: string) => {
    setAnswers(prev => ({
      ...prev,
      [QUESTIONS[currentStep].id]: option
    }));
    
    // Auto-advance after short delay if not on last step
    if (currentStep < QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 400);
    }
  };

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      submitAssessment();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const submitAssessment = () => {
    // Validate all answers present
    if (Object.keys(answers).length < QUESTIONS.length) {
      toast.error("Please answer all questions before submitting.");
      return;
    }

    submitMutation.mutate(
      { data: answers as any },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: ["/api/assessment/history"] });
          queryClient.invalidateQueries({ queryKey: ["/api/assessment/latest"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
          toast.success("Assessment submitted successfully");
          setLocation(`/results/${data.id}`);
        },
        onError: () => {
          toast.error("Failed to submit assessment");
        }
      }
    );
  };

  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;
  const currentQuestion = QUESTIONS[currentStep];
  const hasAnsweredCurrent = !!answers[currentQuestion.id];

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Step {currentStep + 1} of {QUESTIONS.length}
          </span>
          <span className="text-sm font-medium text-primary">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur">
              <CardContent className="p-8 md:p-10">
                <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-center text-foreground leading-tight">
                  {currentQuestion.title}
                </h2>
                
                <div className="grid gap-4">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleOptionSelect(option)}
                      className={`
                        w-full text-left px-6 py-4 rounded-xl border-2 transition-all duration-200
                        ${answers[currentQuestion.id] === option 
                          ? "border-primary bg-primary/5 shadow-sm" 
                          : "border-muted bg-background hover:border-primary/30 hover:bg-muted/50"}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-lg ${answers[currentQuestion.id] === option ? "font-medium text-primary" : "text-foreground"}`}>
                          {option}
                        </span>
                        {answers[currentQuestion.id] === option && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0 || submitMutation.isPending}
          className="rounded-full px-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!hasAnsweredCurrent || submitMutation.isPending}
          className="rounded-full px-8"
        >
          {currentStep === QUESTIONS.length - 1 ? (
            submitMutation.isPending ? "Submitting..." : "Submit"
          ) : (
            <>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
