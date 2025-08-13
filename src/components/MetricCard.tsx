
import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MetricCardProps {
  title: string;
  value: string | number | React.ReactNode;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  analytics?: {
    previousValue?: string | number;
    change?: number;
    insights?: string[];
  };
}

const MetricCard = ({ title, value, icon, trend, className, analytics }: MetricCardProps) => {
  const isPositiveTrend = trend ? trend.value >= 0 : true;

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        whileHover={{ y: -2 }}
        className={cn("relative group h-full", className)}
      >
        <Card className={cn(
          "h-full p-4 transition-all duration-300 ease-out",
          "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm",
          "border border-slate-200 dark:border-slate-700",
          "hover:shadow-lg hover:border-primary/30 dark:hover:border-primary/40",
          "group-hover:bg-white/90 dark:group-hover:bg-slate-800/90"
        )}>
          {/* Header with Icon and Trend */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className={cn(
                "p-2 rounded-lg transition-colors duration-300",
                "bg-slate-100 dark:bg-slate-700",
                "group-hover:bg-primary/10 dark:group-hover:bg-primary/20"
              )}>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {icon}
                </motion.div>
              </div>
              
              {analytics && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      className="cursor-help"
                    >
                      <Info className="h-3 w-3 text-slate-400 hover:text-primary transition-colors" />
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="space-y-1 text-xs">
                      {analytics.previousValue && (
                        <p>Previous: {analytics.previousValue}</p>
                      )}
                      {analytics.change && (
                        <p>Change: {analytics.change > 0 ? '+' : ''}{analytics.change}%</p>
                      )}
                      {analytics.insights?.map((insight, index) => (
                        <p key={index} className="text-slate-300">{insight}</p>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            
            {trend && (
              <motion.div 
                className={cn(
                  "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
                  isPositiveTrend 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}
                whileHover={{ scale: 1.05 }}
              >
                {isPositiveTrend ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{Math.abs(trend.value)}%</span>
              </motion.div>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2 line-clamp-2">
            {title}
          </h3>

          {/* Value Display */}
          <div className="flex-1 flex items-end">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="w-full"
            >
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors duration-300">
                {value}
              </div>
            </motion.div>
          </div>

          {/* Subtle bottom accent */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 
                         opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Card>
      </motion.div>
    </TooltipProvider>
  );
};

export default MetricCard;
