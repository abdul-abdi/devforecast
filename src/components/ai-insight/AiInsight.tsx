'use client';

import { useEffect, useState, useCallback } from 'react';
import { Sparkles, Lightbulb, MessageSquare, Send } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GitHubProjectData, CombinedWeatherData } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useAiInsight } from '@/lib/api-hooks';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AiInsightProps {
  weatherData?: CombinedWeatherData | null;
  project?: GitHubProjectData | null;
}

// Helper function to format AI response with proper styling
function formatAiMessage(message: string): React.ReactNode {
  if (!message) return null;
  
  // Split the message into sections (by line breaks)
  const sections = message.split('\n').filter(line => line.trim());
  
  return (
    <>
      {sections.map((section, index) => {
        // Format headings (numbered or with colon at the end)
        if (/^\d+\.\s+[A-Z].*:$/.test(section) || /^[A-Z].*:$/.test(section)) {
          return (
            <h3 key={index} className="text-sm font-semibold mt-3 mb-1 text-primary">
              {section}
            </h3>
          );
        }
        
        // Format bullet points
        else if (section.startsWith('- ') || section.startsWith('• ')) {
          return (
            <li key={index} className="ml-5 text-sm my-1">
              {section.substring(2)}
            </li>
          );
        }
        
        // Format numbered points
        else if (/^\d+\.\s+/.test(section)) {
          return (
            <div key={index} className="ml-3 text-sm my-1 flex">
              <span className="mr-1 font-medium">{section.split('.')[0]}.</span>
              <span>{section.substring(section.indexOf('.') + 1).trim()}</span>
            </div>
          );
        }
        
        // Regular paragraph
        else {
          return (
            <p key={index} className="text-sm my-1.5">
              {section}
            </p>
          );
        }
      })}
    </>
  );
}

export default function AiInsight({ weatherData, project }: AiInsightProps) {
  const isProjectSpecificMode = !!project;
  const [repoQuestion, setRepoQuestion] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('insight');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Use our custom hook for AI insights
  const { 
    data: insightData, 
    isLoading, 
    error, 
    askQuestion
  } = useAiInsight(weatherData ?? null, project ?? null);

  // Safely handle question submission with error tracking
  const handleAskQuestion = useCallback(() => {
    if (!repoQuestion.trim()) return;
    
    try {
      askQuestion(repoQuestion);
      setRepoQuestion('');
      setErrorMessage(null);
    } catch (err) {
      console.error('Error asking question:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to ask question. Please try again.');
    }
  }, [askQuestion, repoQuestion]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAskQuestion();
    }
  };

  // Clear any displayed errors when switching tabs
  useEffect(() => {
    setErrorMessage(null);
  }, [activeTab]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    },
    exit: { 
      opacity: 0,
      y: -10,
      transition: { duration: 0.2 }
    }
  };

  // Use this instead of error || errorMessage for display
  const displayError = errorMessage || error;

  // Render insight-only mode for weather section
  if (!isProjectSpecificMode) {
    return (
      <div className="w-full">
        <Separator className="my-2 bg-border/60" />
        
        <div className="flex items-center mb-2 justify-between">
          <div className="flex items-center gap-1.5">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            >
              <Sparkles className="h-4 w-4 text-purple-500" />
            </motion.div>
            <h3 className="text-sm font-medium">AI Assistant</h3>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <Skeleton className="h-16 w-full rounded-md" />
            </motion.div>
          ) : displayError ? (
            <motion.div
              key="error"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <Alert variant="destructive" className="py-3 px-4 text-sm">
                <AlertTitle className="text-sm mb-1 font-medium">Error</AlertTitle>
                <AlertDescription className="text-sm">{displayError}</AlertDescription>
              </Alert>
            </motion.div>
          ) : insightData ? (
            <motion.div
              key="insight"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <Alert 
                className="py-3 px-4 shadow-sm hover:shadow-md transition-shadow bg-card/50 w-full"
              >
                <AlertDescription className="w-full">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-full break-words whitespace-normal"
                  >
                    {formatAiMessage(insightData.message) || "No insight available."}
                  </motion.div>
                </AlertDescription>
              </Alert>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <Alert className="text-center bg-muted/30 py-3 px-4">
                <div className="flex items-center justify-center mb-2">
                  <Lightbulb className="h-5 w-5 text-muted-foreground" />
                </div>
                <AlertDescription className="text-sm">
                  {weatherData?.current
                    ? "Generating insight based on weather..."
                    : "Enter a city to get weather and AI insight"
                  }
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Render full component with tabs for project details section
  return (
    <div className="w-full">
      <Separator className="my-2 bg-border/60" />
      
      <div className="flex items-center mb-2 justify-between">
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          >
            <Sparkles className="h-4 w-4 text-purple-500" />
          </motion.div>
          <h3 className="text-sm font-medium">AI Assistant</h3>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="insight" className="w-full">
        <TabsList className="h-8 w-full bg-muted/50 mb-3">
          <TabsTrigger 
            className="text-xs h-8 flex-1 data-[state=active]:bg-background" 
            value="insight"
          >
            Insights
          </TabsTrigger>
          <TabsTrigger 
            className="text-xs h-8 flex-1 data-[state=active]:bg-background" 
            value="ask"
          >
            Ask
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="insight" className="mt-0 p-0 w-full">
          <AnimatePresence mode="wait">
            {isLoading && activeTab === 'insight' ? (
              <motion.div
                key="loading"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="w-full"
              >
                <Skeleton className="h-16 w-full rounded-md" />
              </motion.div>
            ) : displayError && activeTab === 'insight' ? (
              <motion.div
                key="error"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="w-full"
              >
                <Alert variant="destructive" className="py-3 px-4 text-sm">
                  <AlertTitle className="text-sm mb-1 font-medium">Error</AlertTitle>
                  <AlertDescription className="text-sm">{displayError}</AlertDescription>
                </Alert>
              </motion.div>
            ) : insightData && activeTab === 'insight' ? (
              <motion.div
                key="insight"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="w-full"
              >
                <Alert 
                  className={`
                    ${isProjectSpecificMode ? "border-purple-200 dark:border-purple-800" : ""}
                    py-3 px-4 shadow-sm hover:shadow-md transition-shadow bg-card/50 w-full
                  `}
                >
                  <AlertDescription className="w-full">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="w-full break-words whitespace-normal prose-sm prose-headings:font-medium prose-p:my-1.5"
                    >
                      {formatAiMessage(insightData.message) || "No insight available. Try refreshing."}
                    </motion.div>
                  </AlertDescription>
                </Alert>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="w-full"
              >
                <Alert className="text-center bg-muted/30 py-3 px-4">
                  <div className="flex items-center justify-center mb-2">
                    <Lightbulb className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <AlertDescription className="text-sm">
                    Loading insight for this project...
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="ask" className="mt-0 p-0 w-full">
          <div className="space-y-3 w-full">
            <Alert className="py-3 px-4 bg-card/50 w-full">
              <AlertTitle className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium">Repository Assistant</span>
              </AlertTitle>
              
              <AlertDescription className="w-full">
                <p className="text-sm mb-2">
                  Ask questions about this repository:
                </p>
                
                <ul className="list-disc text-xs ml-5 space-y-1">
                  <li>What is the license?</li>
                  <li>How many open issues does it have?</li>
                  <li>Who are the top contributors?</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-2 w-full">
              <Input
                className="h-9 text-sm flex-1"
                placeholder={`Ask about ${project?.name || 'this repository'}...`}
                value={repoQuestion}
                onChange={(e) => setRepoQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <Button 
                size="sm" 
                className="h-9"
                onClick={handleAskQuestion}
                disabled={isLoading || !repoQuestion.trim()}
              >
                <Send className="h-4 w-4 mr-1" />
                Ask
              </Button>
            </div>

            {displayError && activeTab === 'ask' && (
              <Alert variant="destructive" className="py-3 px-4 text-sm w-full">
                <AlertTitle className="text-sm mb-1 font-medium">Error</AlertTitle>
                <AlertDescription className="text-sm">{displayError}</AlertDescription>
              </Alert>
            )}

            <AnimatePresence mode="wait">
              {isLoading && activeTab === 'ask' ? (
                <motion.div
                  key="loading-question"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="w-full"
                >
                  <Skeleton className="h-20 w-full rounded-md" />
                </motion.div>
              ) : insightData && insightData.question && activeTab === 'ask' ? (
                <motion.div
                  key="answer"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="w-full"
                >
                  <Alert className="py-3 px-4 text-sm bg-card/50 shadow-sm w-full">
                    <AlertTitle className="text-sm mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      <span className="font-medium">{insightData.question}</span>
                    </AlertTitle>
                    <AlertDescription className="w-full prose-sm max-w-none">
                      <div className="text-sm w-full break-words whitespace-normal">
                        {formatAiMessage(insightData.message) || "No answer available. Please try again."}
                      </div>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
