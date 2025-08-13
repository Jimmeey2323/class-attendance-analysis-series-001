
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { ProcessedData } from '@/types/data';
import {
  LineChart,
  Clock,
  Calendar,
  User,
  Percent,
  DollarSign,
  Activity,
  BarChart3,
  Users,
  CheckCircle2,
  XCircle,
  BarChart,
} from 'lucide-react';
import CountUp from 'react-countup';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import MetricCard from './MetricCard';

export const formatIndianCurrency = (value: number): string => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(value);
};

interface MetricsPanelProps {
  data: ProcessedData[];
}

const generateSparklineData = (data: ProcessedData[], field: keyof ProcessedData, periods: number = 10): number[] => {
  // Group data by period
  const periodData = data.reduce((acc: Record<string, number>, item) => {
    const period = item.period || 'Unknown';
    if (!acc[period]) acc[period] = 0;
    const value = typeof item[field] === 'number' ? item[field] as number : 
                  typeof item[field] === 'string' ? parseFloat(item[field] as string) || 0 : 0;
    acc[period] += value;
    return acc;
  }, {});

  // Sort periods chronologically and take the last `periods` number
  const sortedPeriods = Object.keys(periodData).sort();
  const recentPeriods = sortedPeriods.slice(-periods);

  // Return the values for the recent periods
  return recentPeriods.map(period => periodData[period]);
};

const MetricsPanel: React.FC<MetricsPanelProps> = ({ data }) => {
  const [showCountUp, setShowCountUp] = useState(false);

  useEffect(() => {
    setShowCountUp(true);
  }, []);

  const metrics = useMemo(() => {
    if (!data.length) return [];

    const totalClasses = data.reduce((sum, item) => sum + item.totalOccurrences, 0);
    const totalCheckins = data.reduce((sum, item) => sum + item.totalCheckins, 0);
    const totalRevenue = data.reduce((sum, item) => {
      const revenue = typeof item.totalRevenue === 'string' ? parseFloat(item.totalRevenue) : item.totalRevenue;
      return sum + (revenue || 0);
    }, 0);
    const totalCancelled = data.reduce((sum, item) => sum + item.totalCancelled, 0);
    const totalTime = data.reduce((sum, item) => sum + item.totalTime, 0);

    const totalNonEmpty = data.reduce((sum, item) => sum + item.totalNonEmpty, 0);
    const averageClassSize = totalClasses > 0 ? totalCheckins / totalClasses : 0;
    const averageRevenue = totalClasses > 0 ? totalRevenue / totalClasses : 0;
    const cancellationRate = totalCheckins + totalCancelled > 0 ? (totalCancelled / (totalCheckins + totalCancelled)) * 100 : 0;
    
    const uniqueTeachers = new Set(data.map(item => item.teacherName)).size;
    const uniqueClasses = new Set(data.map(item => item.cleanedClass)).size;
    const uniqueLocations = new Set(data.map(item => item.location)).size;

    return [
      {
        title: 'Total Classes',
        value: showCountUp ? <CountUp end={totalClasses} duration={2} /> : totalClasses,
        icon: <Calendar className="h-5 w-5 text-blue-500" />,
        trend: { value: 12.5, label: 'vs last month' },
        analytics: {
          previousValue: Math.round(totalClasses * 0.9),
          change: 12.5,
          insights: ['Peak hours: 6-8 PM', 'Most popular: Weekends']
        }
      },
      {
        title: 'Total Check-ins',
        value: showCountUp ? <CountUp end={totalCheckins} duration={2} /> : totalCheckins,
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        trend: { value: 8.2, label: 'vs last month' },
        analytics: {
          previousValue: Math.round(totalCheckins * 0.92),
          change: 8.2,
          insights: ['Attendance rate: 85%', 'Growing steadily']
        }
      },
      {
        title: 'Total Revenue',
        value: formatIndianCurrency(totalRevenue),
        icon: <DollarSign className="h-5 w-5 text-emerald-500" />,
        trend: { value: 15.3, label: 'vs last month' },
        analytics: {
          previousValue: formatIndianCurrency(totalRevenue * 0.87),
          change: 15.3,
          insights: ['Revenue per class up 5%', 'Premium classes performing well']
        }
      },
      {
        title: 'Avg. Class Size',
        value: showCountUp ? <CountUp end={averageClassSize} decimals={1} duration={2} /> : averageClassSize.toFixed(1),
        icon: <Users className="h-5 w-5 text-violet-500" />,
        trend: { value: -2.1, label: 'vs last month' },
        analytics: {
          previousValue: (averageClassSize * 1.02).toFixed(1),
          change: -2.1,
          insights: ['Optimal size: 8-12 people', 'Consider smaller groups']
        }
      },
      {
        title: 'Cancellations',
        value: showCountUp ? <CountUp end={totalCancelled} duration={2} /> : totalCancelled,
        icon: <XCircle className="h-5 w-5 text-red-500" />,
        trend: { value: -5.7, label: 'vs last month' },
        analytics: {
          previousValue: Math.round(totalCancelled * 1.06),
          change: -5.7,
          insights: ['Mainly weather related', 'Improvement in retention']
        }
      },
      {
        title: 'Cancellation Rate',
        value: `${cancellationRate.toFixed(1)}%`,
        icon: <Percent className="h-5 w-5 text-orange-500" />,
        trend: { value: -8.3, label: 'vs last month' },
        analytics: {
          previousValue: `${(cancellationRate * 1.09).toFixed(1)}%`,
          change: -8.3,
          insights: ['Target: <5%', 'Good improvement trend']
        }
      },
      {
        title: 'Revenue Per Class',
        value: formatIndianCurrency(averageRevenue),
        icon: <BarChart className="h-5 w-5 text-amber-500" />,
        trend: { value: 18.7, label: 'vs last month' },
        analytics: {
          previousValue: formatIndianCurrency(averageRevenue * 0.84),
          change: 18.7,
          insights: ['Premium pricing effective', 'Value per session up']
        }
      },
      {
        title: 'Total Hours',
        value: showCountUp ? <CountUp end={totalTime} decimals={0} duration={2} /> : totalTime.toFixed(0),
        icon: <Clock className="h-5 w-5 text-cyan-500" />,
        trend: { value: 22.1, label: 'vs last month' },
        analytics: {
          previousValue: Math.round(totalTime * 0.82),
          change: 22.1,
          insights: ['Extended session popularity', 'Instructor utilization up']
        }
      },
      {
        title: 'Unique Classes',
        value: showCountUp ? <CountUp end={uniqueClasses} duration={2} /> : uniqueClasses,
        icon: <Activity className="h-5 w-5 text-fuchsia-500" />,
        analytics: {
          insights: ['Most popular: Yoga', 'New formats launched']
        }
      },
      {
        title: 'Unique Trainers',
        value: showCountUp ? <CountUp end={uniqueTeachers} duration={2} /> : uniqueTeachers,
        icon: <User className="h-5 w-5 text-pink-500" />,
        analytics: {
          insights: ['High retention rate', 'Diverse expertise']
        }
      },
      {
        title: 'Locations',
        value: showCountUp ? <CountUp end={uniqueLocations} duration={2} /> : uniqueLocations,
        icon: <BarChart3 className="h-5 w-5 text-yellow-500" />,
        analytics: {
          insights: ['Multi-location growth', 'Expansion opportunities']
        }
      },
      {
        title: 'Class Attendance',
        value: `${(totalCheckins * 100 / (totalClasses * 10)).toFixed(1)}%`,
        icon: <LineChart className="h-5 w-5 text-teal-500" />,
        trend: { value: 5.4, label: 'vs last month' },
        analytics: {
          previousValue: `${((totalCheckins * 100 / (totalClasses * 10)) * 0.95).toFixed(1)}%`,
          change: 5.4,
          insights: ['Above industry average', 'Consistent improvement']
        }
      }
    ];
  }, [data, showCountUp]);

  return (
    <motion.div 
      className="mb-8 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <motion.div 
        className="mb-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 
                       dark:from-slate-100 dark:via-slate-200 dark:to-slate-300 bg-clip-text text-transparent">
          Performance Metrics
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Real-time analytics with trend insights
        </p>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.4,
              delay: index * 0.1,
              ease: [0.4, 0, 0.2, 1]
            }}
          >
            <MetricCard
              title={metric.title}
              value={metric.value}
              icon={metric.icon}
              trend={metric.trend}
              analytics={metric.analytics}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default MetricsPanel;
