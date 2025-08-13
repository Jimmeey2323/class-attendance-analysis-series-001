
import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MetricCardProps {
  title: string;
  value: string | number;
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        whileHover={{ scale: 1.02, y: -4 }}
        className="relative group"
      >
        <Card className={cn(
          "overflow-hidden backdrop-blur-xl relative transition-all duration-500 ease-out",
          "bg-gradient-to-br from-white/80 via-white/60 to-white/40",
          "dark:from-slate-800/80 dark:via-slate-800/60 dark:to-slate-900/40",
          "border border-white/30 dark:border-slate-700/50",
          "hover:border-primary/30 dark:hover:border-primary/40",
          "shadow-lg hover:shadow-2xl hover:shadow-primary/10",
          "group-hover:backdrop-blur-2xl",
          className
        )}>
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent 
                         dark:from-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-secondary/20 
                         opacity-0 group-hover:opacity-100 blur-xl transition-all duration-700 -z-10" />
          
          {/* Content */}
          <div className="relative z-10 p-6 space-y-4">
            {/* Header with Icon and Analytics */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <motion.div 
                  className={cn(
                    "p-3 rounded-xl transition-all duration-300",
                    "bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5",
                    "dark:from-primary/25 dark:via-primary/15 dark:to-primary/10",
                    "group-hover:from-primary/25 group-hover:via-primary/20 group-hover:to-primary/10",
                    "shadow-lg group-hover:shadow-xl group-hover:shadow-primary/20"
                  )}
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, 0]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut",
                      delay: Math.random() * 2
                    }}
                  >
                    {icon}
                  </motion.div>
                </motion.div>
                
                <div>
                  <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 
                               tracking-wide uppercase group-hover:text-primary transition-colors duration-300">
                    {title}
                  </h3>
                  {analytics && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div 
                          className="flex items-center mt-1 cursor-help"
                          whileHover={{ scale: 1.05 }}
                        >
                          <Info className="h-3 w-3 text-slate-400 mr-1 animate-pulse" />
                          <span className="text-xs text-slate-400">Analytics</span>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-2">
                          {analytics.previousValue && (
                            <p className="text-xs">Previous: {analytics.previousValue}</p>
                          )}
                          {analytics.change && (
                            <p className="text-xs">Change: {analytics.change > 0 ? '+' : ''}{analytics.change}%</p>
                          )}
                          {analytics.insights?.map((insight, index) => (
                            <p key={index} className="text-xs text-slate-300">{insight}</p>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
              
              {trend && (
                <motion.div 
                  className={cn(
                    "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
                    "backdrop-blur-sm transition-all duration-300",
                    isPositiveTrend 
                      ? "bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                      : "bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}
                  whileHover={{ scale: 1.05 }}
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.div
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {isPositiveTrend ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                  </motion.div>
                  <span className="font-semibold">{Math.abs(trend.value)}%</span>
                  <span className="opacity-75 text-[10px]">{trend.label}</span>
                </motion.div>
              )}
            </div>

            {/* Value Display */}
            <div className="relative">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                whileHover={{ scale: 1.05 }}
                className="relative"
              >
                <span className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 
                               dark:from-slate-100 dark:via-slate-200 dark:to-slate-300 bg-clip-text text-transparent
                               group-hover:from-primary group-hover:via-primary/80 group-hover:to-primary/60 
                               transition-all duration-500">
                  {value}
                </span>
                
                {/* Shine Effect on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                               translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 
                               skew-x-12 opacity-0 group-hover:opacity-100" />
              </motion.div>
            </div>

            {/* Progress Bar for Analytics */}
            {analytics?.change !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Performance</span>
                  <span>{analytics.change > 0 ? 'Improving' : 'Declining'}</span>
                </div>
                <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      analytics.change > 0 
                        ? "bg-gradient-to-r from-green-400 to-green-600" 
                        : "bg-gradient-to-r from-red-400 to-red-600"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(Math.abs(analytics.change), 100)}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Interactive Border Effect */}
          <div className="absolute inset-0 border-2 border-primary/20 rounded-lg opacity-0 
                         group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          {/* Corner Accent */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/10 to-transparent 
                         opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </Card>
      </motion.div>
    </TooltipProvider>
  );
};

export default MetricCard;
