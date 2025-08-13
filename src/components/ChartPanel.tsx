
import React, { useState } from 'react';
import { ProcessedData, ChartConfig } from '@/types/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';
import { ChevronDown, Download, Share2, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChartPanelProps {
  data: ProcessedData[];
}

const ChartPanel: React.FC<ChartPanelProps> = ({ data }) => {
  const [chartType, setChartType] = useState<ChartConfig['type']>('bar');
  const [primaryMetric, setPrimaryMetric] = useState<keyof ProcessedData>('totalCheckins');
  const [groupBy, setGroupBy] = useState<keyof ProcessedData>('cleanedClass');

  // COLORS - Modern gradient palette
  const COLORS = [
    '#667eea', '#764ba2', '#667eea', '#f093fb',
    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
    '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
  ];

  const metrics = [
    { key: 'totalCheckins', label: 'Total Check-ins', icon: <Activity className="h-4 w-4" /> },
    { key: 'totalOccurrences', label: 'Total Occurrences', icon: <BarChart3 className="h-4 w-4" /> },
    { key: 'totalRevenue', label: 'Total Revenue', icon: <TrendingUp className="h-4 w-4" /> },
    { key: 'totalCancelled', label: 'Total Cancellations', icon: <Activity className="h-4 w-4" /> },
    { key: 'totalEmpty', label: 'Empty Classes', icon: <BarChart3 className="h-4 w-4" /> },
    { key: 'totalNonEmpty', label: 'Non-Empty Classes', icon: <Activity className="h-4 w-4" /> },
    { key: 'classAverageIncludingEmpty', label: 'Average Attendance (All)', icon: <TrendingUp className="h-4 w-4" /> },
    { key: 'classAverageExcludingEmpty', label: 'Average Attendance (Non-Empty)', icon: <TrendingUp className="h-4 w-4" /> },
    { key: 'totalTime', label: 'Total Hours', icon: <Activity className="h-4 w-4" /> },
    { key: 'totalNonPaid', label: 'Non-Paid Customers', icon: <BarChart3 className="h-4 w-4" /> }
  ];

  const dimensions = [
    { key: 'cleanedClass', label: 'Class Type', icon: <Activity className="h-4 w-4" /> },
    { key: 'dayOfWeek', label: 'Day of Week', icon: <BarChart3 className="h-4 w-4" /> },
    { key: 'location', label: 'Location', icon: <TrendingUp className="h-4 w-4" /> },
    { key: 'teacherName', label: 'Instructor', icon: <Activity className="h-4 w-4" /> },
    { key: 'period', label: 'Period', icon: <BarChart3 className="h-4 w-4" /> }
  ];

  // Prepare chart data by grouping
  const chartData = React.useMemo(() => {
    if (data.length === 0) return [];
    const groups = data.reduce((acc, item) => {
      const key = String(item[groupBy]);
      if (!acc[key]) {
        acc[key] = {
          name: key,
          value: 0,
          count: 0
        };
      }

      // Handle numeric conversion for different metrics
      let value = 0;
      if (primaryMetric === 'totalRevenue' || primaryMetric === 'totalTime') {
        value = parseFloat(String(item[primaryMetric]) || '0');
      } else if (primaryMetric === 'classAverageIncludingEmpty' || primaryMetric === 'classAverageExcludingEmpty') {
        const strValue = String(item[primaryMetric]);
        value = strValue === 'N/A' ? 0 : parseFloat(strValue);
      } else {
        value = Number(item[primaryMetric]);
      }
      acc[key].value += value;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { name: string; value: number; count: number; }>);
    
    return Object.values(groups).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [data, groupBy, primaryMetric]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl p-4 rounded-xl shadow-2xl border border-white/20 dark:border-slate-700/50"
        >
          <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-600 dark:text-slate-400">{entry.name}:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {primaryMetric === 'totalRevenue' 
                  ? `₹${Number(entry.value).toLocaleString('en-IN')}` 
                  : Number(entry.value).toLocaleString()}
              </span>
            </div>
          ))}
        </motion.div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 text-white rounded-t-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="p-2 bg-white/10 rounded-lg"
              >
                <BarChart3 className="h-6 w-6" />
              </motion.div>
              <div>
                <CardTitle className="text-xl font-bold">Advanced Analytics</CardTitle>
                <p className="text-slate-300 text-sm">Interactive data visualization</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                  <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <Download className="mr-2 h-4 w-4" />
                  </motion.div>
                  Export Chart
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </motion.div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Controls */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="space-y-2">
              <Label htmlFor="chartType" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Chart Type</Label>
              <Select value={chartType} onValueChange={value => setChartType(value as ChartConfig['type'])}>
                <SelectTrigger id="chartType" className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                  <SelectValue placeholder="Select chart type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">📊 Bar Chart</SelectItem>
                  <SelectItem value="line">📈 Line Chart</SelectItem>
                  <SelectItem value="pie">🥧 Pie Chart</SelectItem>
                  <SelectItem value="scatter">⭐ Scatter Plot</SelectItem>
                  <SelectItem value="donut">🍩 Donut Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="primaryMetric" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Metric</Label>
              <Select value={primaryMetric as string} onValueChange={value => setPrimaryMetric(value as keyof ProcessedData)}>
                <SelectTrigger id="primaryMetric" className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  {metrics.map(metric => (
                    <SelectItem key={metric.key} value={metric.key}>
                      <div className="flex items-center space-x-2">
                        {metric.icon}
                        <span>{metric.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="groupBy" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Group By</Label>
              <Select value={groupBy as string} onValueChange={value => setGroupBy(value as keyof ProcessedData)}>
                <SelectTrigger id="groupBy" className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                  <SelectValue placeholder="Select dimension" />
                </SelectTrigger>
                <SelectContent>
                  {dimensions.map(dimension => (
                    <SelectItem key={dimension.key} value={dimension.key}>
                      <div className="flex items-center space-x-2">
                        {dimension.icon}
                        <span>{dimension.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>
          
          {/* Chart Area */}
          <motion.div 
            className="h-[500px] w-full bg-gradient-to-br from-slate-50/50 to-white/50 dark:from-slate-800/30 dark:to-slate-900/30 rounded-xl p-4 backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <motion.p 
                  className="text-muted-foreground text-lg"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  No data available for the selected filters.
                </motion.p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      tick={{ fontSize: 12, fill: '#64748b' }} 
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="value" 
                      fill="url(#barGradient)" 
                      name={metrics.find(m => m.key === primaryMetric)?.label || primaryMetric}
                      radius={[4, 4, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#667eea" />
                        <stop offset="100%" stopColor="#764ba2" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                ) : chartType === 'line' ? (
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#667eea" 
                      strokeWidth={3}
                      activeDot={{ r: 8, fill: '#764ba2' }} 
                      name={metrics.find(m => m.key === primaryMetric)?.label || primaryMetric} 
                    />
                  </LineChart>
                ) : chartType === 'pie' || chartType === 'donut' ? (
                  <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <Pie 
                      data={chartData} 
                      cx="50%" 
                      cy="50%" 
                      labelLine={false}
                      outerRadius={chartType === 'pie' ? 150 : 150} 
                      innerRadius={chartType === 'donut' ? 80 : 0} 
                      fill="#8884d8" 
                      dataKey="value" 
                      nameKey="name" 
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                ) : (
                  <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                    <XAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis dataKey="value" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <ZAxis dataKey="count" range={[50, 500]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Scatter 
                      name={metrics.find(m => m.key === primaryMetric)?.label || primaryMetric} 
                      data={chartData} 
                      fill="#667eea" 
                    />
                  </ScatterChart>
                )}
              </ResponsiveContainer>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ChartPanel;
