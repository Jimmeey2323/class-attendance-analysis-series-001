import React, { useState, useEffect, useMemo } from 'react';
import { ProcessedData } from '@/types/data';
import { 
  Search, ChevronDown, ChevronRight, ArrowUp, ArrowDown,
  Settings, Eye, EyeOff, Layers, Type, Palette, Bookmark,
  BookmarkX, Filter, MapPin, Calendar, BarChart3, Clock,
  ListFilter, User, ListChecks, IndianRupee, LayoutGrid,
  LayoutList, Kanban, LineChart, Download, Sliders
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trainerAvatars } from './Dashboard';
import { formatIndianCurrency } from './MetricsPanel';
import { motion, AnimatePresence } from 'framer-motion';

interface DataTableProps {
  data: ProcessedData[];
  trainerAvatars: Record<string, string>;
}

// Define column type for better type safety
interface ColumnDefinition {
  key: string;
  label: string;
  numeric: boolean;
  currency: boolean;
  iconComponent?: React.ReactNode;
  visible?: boolean;
}

export function DataTable({ data, trainerAvatars }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    teacherName: true,
    location: true,
    cleanedClass: true,
    dayOfWeek: true,
    period: true,
    date: true,
    classTime: true,
    totalCheckins: true,
    totalRevenue: true,
    totalOccurrences: true,
    classAverageIncludingEmpty: true,
    classAverageExcludingEmpty: true,
    totalCancelled: true
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [viewMode, setViewMode] = useState("default");
  const [groupBy, setGroupBy] = useState("class-day-time-location");
  const [tableView, setTableView] = useState("grouped");
  const [rowHeight, setRowHeight] = useState(35);

  const groupedData = useMemo(() => {
    const getGroupKey = (item: ProcessedData) => {
      switch(groupBy) {
        case "class-day-time-location-trainer":
          return `${item.cleanedClass}|${item.dayOfWeek}|${item.classTime}|${item.location}|${item.teacherName}`;
        case "class-day-time-location":
          return `${item.cleanedClass}|${item.dayOfWeek}|${item.classTime}|${item.location}`;
        case "class-day-time":
          return `${item.cleanedClass}|${item.dayOfWeek}|${item.classTime}`;
        case "class-time":
          return `${item.cleanedClass}|${item.classTime}`;
        case "class-day":
          return `${item.cleanedClass}|${item.dayOfWeek}`;
        case "class-location":
          return `${item.cleanedClass}|${item.location}`;
        case "day-time":
          return `${item.dayOfWeek}|${item.classTime}`;
        case "location":
          return `${item.location}`;
        case "trainer":
          return `${item.teacherName}`;
        case "month": {
          const date = item.date;
          const month = date ? new Date(date.split(',')[0]).toLocaleString('default', { month: 'long', year: 'numeric' }) : "Unknown";
          return month;
        }
        case "none":
        default:
          return `row-${data.indexOf(item)}`;
      }
    };

    if (tableView === "flat" || groupBy === "none") {
      // For flat view, create individual rows for each occurrence
      const flatRows: any[] = [];
      
      data.forEach((item, itemIndex) => {
        if (item.occurrences && item.occurrences.length > 0) {
          // Create a row for each occurrence
          item.occurrences.forEach((occurrence, occIndex) => {
            flatRows.push({
              ...item,
              key: `flat-${itemIndex}-${occIndex}`,
              isChild: true,
              // Individual occurrence data
              displayOccurrences: 1, // Each row represents 1 class
              totalCheckins: occurrence.checkins,
              totalRevenue: occurrence.revenue,
              totalCancelled: occurrence.cancelled,
              totalNonPaid: occurrence.nonPaid,
              totalEmpty: occurrence.isEmpty ? 1 : 0,
              totalNonEmpty: occurrence.isEmpty ? 0 : 1,
              totalOccurrences: 1,
              classAverageIncludingEmpty: occurrence.checkins,
              classAverageExcludingEmpty: occurrence.isEmpty ? 'N/A' : occurrence.checkins,
              date: occurrence.date
            });
          });
        } else {
          // Fallback for items without occurrences array
          flatRows.push({
            ...item,
            key: `flat-${itemIndex}`,
            isChild: true,
            displayOccurrences: 1,
            totalEmpty: item.totalCheckins === 0 ? 1 : 0,
            totalNonEmpty: item.totalCheckins > 0 ? 1 : 0,
            classAverageIncludingEmpty: item.totalCheckins,
            classAverageExcludingEmpty: item.totalCheckins === 0 ? 'N/A' : item.totalCheckins
          });
        }
      });
      
      return flatRows;
    }
    
    const groups: Record<string, any> = {};
    
    data.forEach(item => {
      const groupKey = getGroupKey(item);
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          teacherName: item.teacherName,
          cleanedClass: item.cleanedClass,
          dayOfWeek: item.dayOfWeek,
          classTime: item.classTime,
          location: item.location,
          period: item.period,
          date: item.date,
          children: [],
          totalCheckins: 0,
          totalRevenue: 0,
          totalOccurrences: 0,
          totalCancelled: 0,
          totalEmpty: 0,
          totalNonEmpty: 0,
          totalNonPaid: 0,
          totalPayout: 0,
          totalTips: 0,
          displayOccurrences: 0,
          allOccurrences: []
        };
      }
      
      // Create individual child rows for each occurrence
      if (item.occurrences && item.occurrences.length > 0) {
        item.occurrences.forEach((occurrence, occIndex) => {
          groups[groupKey].children.push({
            ...item,
            key: `${item.uniqueID}-occ-${occIndex}`,
            // Individual occurrence data
            displayOccurrences: 1, // Each child row represents 1 class
            totalCheckins: occurrence.checkins,
            totalRevenue: occurrence.revenue,
            totalCancelled: occurrence.cancelled,
            totalNonPaid: occurrence.nonPaid,
            totalEmpty: occurrence.isEmpty ? 1 : 0,
            totalNonEmpty: occurrence.isEmpty ? 0 : 1,
            totalOccurrences: 1,
            classAverageIncludingEmpty: occurrence.checkins,
            classAverageExcludingEmpty: occurrence.isEmpty ? 'N/A' : occurrence.checkins,
            date: occurrence.date
          });
        });
        
        // Collect all occurrences for group totals
        groups[groupKey].allOccurrences.push(...item.occurrences);
      } else {
        // Fallback for items without occurrences array
        groups[groupKey].children.push({
          ...item,
          displayOccurrences: 1,
          totalEmpty: item.totalCheckins === 0 ? 1 : 0,
          totalNonEmpty: item.totalCheckins > 0 ? 1 : 0,
          classAverageIncludingEmpty: item.totalCheckins,
          classAverageExcludingEmpty: item.totalCheckins === 0 ? 'N/A' : item.totalCheckins
        });
        
        // Create synthetic occurrence for group calculation
        groups[groupKey].allOccurrences.push({
          date: item.date,
          checkins: item.totalCheckins,
          revenue: Number(item.totalRevenue),
          cancelled: item.totalCancelled || 0,
          nonPaid: item.totalNonPaid || 0,
          isEmpty: item.totalCheckins === 0
        });
      }
      
      // Update group totals from original item data
      groups[groupKey].totalCheckins += Number(item.totalCheckins);
      groups[groupKey].totalRevenue += Number(item.totalRevenue);
      groups[groupKey].totalOccurrences += Number(item.totalOccurrences);
      groups[groupKey].totalCancelled += Number(item.totalCancelled || 0);
      groups[groupKey].totalNonPaid += Number(item.totalNonPaid || 0);
      groups[groupKey].totalPayout += Number(item.totalPayout || 0);
      groups[groupKey].totalTips += Number(item.totalTips || 0);
    });
    
    // Calculate group-level metrics based on all occurrences
    Object.values(groups).forEach((group: any) => {
      // Set displayOccurrences to the total count of all occurrences in the group
      group.displayOccurrences = group.allOccurrences.length;
      
      // Calculate empty and non-empty based on all occurrences
      group.totalEmpty = group.allOccurrences.filter((occ: any) => occ.isEmpty).length;
      group.totalNonEmpty = group.allOccurrences.filter((occ: any) => !occ.isEmpty).length;
      
      // Calculate averages for each group
      group.classAverageIncludingEmpty = group.displayOccurrences > 0 
        ? Number((group.totalCheckins / group.displayOccurrences).toFixed(1))
        : 'N/A';
        
      group.classAverageExcludingEmpty = group.totalNonEmpty > 0 
        ? Number((group.totalCheckins / group.totalNonEmpty).toFixed(1))
        : 'N/A';
        
      // Clean up the temporary allOccurrences array
      delete group.allOccurrences;
    });
    
    return Object.values(groups);
  }, [data, groupBy, tableView]);

  const groupingOptions = [
    { id: "class-day-time-location-trainer", label: "Class + Day + Time + Location + Trainer" },
    { id: "class-day-time-location", label: "Class + Day + Time + Location" },
    { id: "class-day-time", label: "Class + Day + Time" },
    { id: "class-time", label: "Class + Time" },
    { id: "class-day", label: "Class + Day" },
    { id: "class-location", label: "Class + Location" },
    { id: "day-time", label: "Day + Time" },
    { id: "location", label: "Location" },
    { id: "trainer", label: "Trainer" },
    { id: "month", label: "Month" },
    { id: "none", label: "No Grouping" }
  ];
  
  const viewModes = [
    { id: "default", label: "Default View" },
    { id: "compact", label: "Compact View" },
    { id: "detailed", label: "Detailed View" },
    { id: "financials", label: "Financial Focus" },
    { id: "attendance", label: "Attendance Focus" },
    { id: "trainer", label: "Trainer Focus" },
    { id: "analytics", label: "Analytics View" },
    { id: "all", label: "All Columns" }
  ];

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groupedData;
    
    const searchLower = searchTerm.toLowerCase();
    
    return groupedData.filter((group: any) => {
      // Search in parent row
      const parentMatch = [
        group.teacherName,
        group.cleanedClass,
        group.dayOfWeek,
        group.location,
        group.classTime,
        group.period,
      ].some(field => field && String(field).toLowerCase().includes(searchLower));
      
      if (parentMatch) return true;
      
      // Search in child rows
      if (group.children) {
        return group.children.some((child: ProcessedData) => 
          Object.values(child).some(val => 
            val && typeof val === 'string' && val.toLowerCase().includes(searchLower)
          )
        );
      }
      
      return false;
    });
  }, [groupedData, searchTerm]);
  
  const sortedGroups = useMemo(() => {
    if (!sortConfig) return filteredGroups;
    
    return [...filteredGroups].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      const isNumeric = !isNaN(Number(aValue)) && !isNaN(Number(bValue));
      
      if (isNumeric) {
        return sortConfig.direction === 'asc'
          ? Number(aValue) - Number(bValue)
          : Number(bValue) - Number(aValue);
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredGroups, sortConfig]);

  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedGroups.slice(startIndex, startIndex + pageSize);
  }, [sortedGroups, currentPage, pageSize]);
  
  const totals = useMemo(() => {
    return filteredGroups.reduce((acc: any, group: any) => {
      acc.totalCheckins += Number(group.totalCheckins || 0);
      acc.totalRevenue += Number(group.totalRevenue || 0);
      acc.totalOccurrences += Number(group.totalOccurrences || 0);
      acc.totalCancelled += Number(group.totalCancelled || 0);
      acc.displayOccurrences += Number(group.displayOccurrences || 0);
      acc.totalEmpty += Number(group.totalEmpty || 0);
      acc.totalNonEmpty += Number(group.totalNonEmpty || 0);
      return acc;
    }, {
      totalCheckins: 0,
      totalRevenue: 0,
      totalOccurrences: 0,
      totalCancelled: 0,
      displayOccurrences: 0,
      totalEmpty: 0,
      totalNonEmpty: 0
    });
  }, [filteredGroups]);
  
  const getColumns = (): ColumnDefinition[] => {
    const baseColumns: ColumnDefinition[] = [
      { key: "cleanedClass", label: "Class Type", iconComponent: <ListChecks className="h-4 w-4" />, numeric: false, currency: false, visible: true },
      { key: "dayOfWeek", label: "Day", iconComponent: <Calendar className="h-4 w-4" />, numeric: false, currency: false, visible: true },
      { key: "classTime", label: "Time", iconComponent: <Clock className="h-4 w-4" />, numeric: false, currency: false, visible: true },
      { key: "location", label: "Location", iconComponent: <MapPin className="h-4 w-4" />, numeric: false, currency: false, visible: true },
    ];
    
    const attendanceColumns: ColumnDefinition[] = [
      { key: "displayOccurrences", label: "Classes", numeric: true, currency: false, iconComponent: <ListFilter className="h-4 w-4" />, visible: true },
      { key: "totalEmpty", label: "Empty", numeric: true, currency: false, iconComponent: <ListFilter className="h-4 w-4" />, visible: true },
      { key: "totalNonEmpty", label: "Non-empty", numeric: true, currency: false, iconComponent: <ListFilter className="h-4 w-4" />, visible: true },
      { key: "totalCheckins", label: "Checked In", numeric: true, currency: false, iconComponent: <ListChecks className="h-4 w-4" />, visible: true },
      { key: "classAverageIncludingEmpty", label: "Avg. (All)", numeric: true, currency: false, iconComponent: <BarChart3 className="h-4 w-4" />, visible: true },
      { key: "classAverageExcludingEmpty", label: "Avg. (Non-empty)", numeric: true, currency: false, iconComponent: <BarChart3 className="h-4 w-4" />, visible: true }
    ];
    
    const financialColumns: ColumnDefinition[] = [
      { key: "totalRevenue", label: "Revenue", numeric: true, currency: true, iconComponent: <IndianRupee className="h-4 w-4" />, visible: true },
      { key: "totalCancelled", label: "Late Cancels", numeric: true, currency: false, iconComponent: <Calendar className="h-4 w-4" />, visible: true },
      { key: "totalPayout", label: "Payout", numeric: true, currency: true, iconComponent: <IndianRupee className="h-4 w-4" />, visible: true },
      { key: "totalTips", label: "Tips", numeric: true, currency: true, iconComponent: <IndianRupee className="h-4 w-4" />, visible: true }
    ];
    
    const detailedColumns: ColumnDefinition[] = [
      { key: "teacherName", label: "Trainer", iconComponent: <User className="h-4 w-4" />, numeric: false, currency: false, visible: true },
      { key: "period", label: "Period", iconComponent: <Calendar className="h-4 w-4" />, numeric: false, currency: false, visible: true },
      { key: "date", label: "Date", iconComponent: <Calendar className="h-4 w-4" />, numeric: false, currency: false, visible: true },
    ];

    switch(viewMode) {
      case "compact":
        return [...baseColumns.slice(0, 2), 
                { key: "classTime", label: "Time", iconComponent: <Clock className="h-4 w-4" />, numeric: false, currency: false, visible: true },
                { key: "displayOccurrences", label: "Classes", numeric: true, currency: false, iconComponent: <ListFilter className="h-4 w-4" />, visible: true },
                { key: "totalCheckins", label: "Checked In", numeric: true, currency: false, iconComponent: <ListChecks className="h-4 w-4" />, visible: true },
                { key: "classAverageIncludingEmpty", label: "Avg. (All)", numeric: true, currency: false, iconComponent: <BarChart3 className="h-4 w-4" />, visible: true },
                financialColumns[0]];
      case "detailed":
        return [...baseColumns, ...attendanceColumns, ...financialColumns, ...detailedColumns];
      case "financials":
        return [...baseColumns.slice(0, 3), financialColumns[0], financialColumns[2], financialColumns[3]];
      case "attendance":
        return [...baseColumns.slice(0, 3), ...attendanceColumns, financialColumns[1]];
      case "trainer":
        return [detailedColumns[0], ...baseColumns.slice(0, 3), attendanceColumns[3], financialColumns[0]];
      case "analytics":
        return [...baseColumns.slice(0, 3), attendanceColumns[4], attendanceColumns[5], financialColumns[0]];
      case "all":
        return [
          ...detailedColumns,
          ...baseColumns, 
          ...attendanceColumns,
          ...financialColumns
        ];
      default:
        return [...baseColumns, ...attendanceColumns.slice(0, 4), financialColumns[0]];
    }
  };

  const columns = getColumns();
  const visibleColumns = columns.filter(col => 
    columnVisibility[col.key] !== false
  );
  
  const toggleRowExpansion = (key: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const toggleColumnVisibility = (column: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };
  
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const totalPages = Math.ceil(sortedGroups.length / pageSize);
  
  const resetColumnVisibility = () => {
    setColumnVisibility({
      teacherName: true,
      location: true,
      cleanedClass: true,
      dayOfWeek: true,
      period: true,
      date: true,
      classTime: true,
      totalCheckins: true,
      totalRevenue: true,
      totalOccurrences: true,
      classAverageIncludingEmpty: true,
      classAverageExcludingEmpty: true,
      totalCancelled: true
    });
  };

  const exportCSV = () => {
    const headers = Object.keys(data[0] || {}).filter(key => key !== 'children' && key !== 'key');
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
      const values = headers.map(header => {
        const val = row[header as keyof ProcessedData];
        return `"${val}"`;
      });
      csvRows.push(values.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'class_data_export.csv');
    link.click();
  };
  
  const formatCellValue = (key: string, value: any): React.ReactNode => {
    if (value === undefined || value === null) return "-";
    
    if (Array.isArray(value)) {
      return value.length.toString();
    }
    
    if (typeof value === 'object' && value.constructor === Object) {
      return "-";
    }

    if (value instanceof Set) {
      return value.size.toString();
    }
    
    const column = columns.find(col => col.key === key);
    if (!column) return String(value);
    
    if (column.currency && typeof value === 'number') {
      return formatIndianCurrency(value);
    }
    
    if (column.numeric) {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        return numValue.toLocaleString();
      }
    }
    
    return String(value);
  };
  
  const getSafeValue = (item: any, key: string): React.ReactNode => {
    const value = item[key];
    return formatCellValue(key, value);
  };
  
  return (
    <div className="relative">
      {/* Enhanced Modern Header Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-700/50 dark:border-slate-800/50 p-6 rounded-t-xl shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute left-3 top-1/2 transform -translate-y-1/2"
            >
              <Search className="h-4 w-4 text-slate-400" />
            </motion.div>
            <Input
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search classes, trainers, locations..."
              className="pl-9 bg-slate-800/50 dark:bg-slate-900/50 backdrop-blur-md border-slate-600/50 dark:border-slate-700/50 text-slate-100 placeholder:text-slate-400 shadow-lg focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400/50 transition-all"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Enhanced Controls with darker modern styling */}
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="w-[200px] bg-slate-800/60 dark:bg-slate-900/60 backdrop-blur-md border-slate-600/50 dark:border-slate-700/50 text-slate-100 shadow-lg hover:bg-slate-700/60 transition-all">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Filter className="h-4 w-4 text-blue-400" />
                  </motion.div>
                  <SelectValue placeholder="Group By" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-slate-800/95 dark:bg-slate-900/95 backdrop-blur-md border-slate-600/50 dark:border-slate-700/50 text-slate-100">
                <SelectGroup>
                  <SelectLabel className="text-slate-300 font-medium">Grouping Options</SelectLabel>
                  {groupingOptions.map(option => (
                    <SelectItem key={option.id} value={option.id} className="focus:bg-blue-500/20 text-slate-100">{option.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="w-[160px] bg-slate-800/60 dark:bg-slate-900/60 backdrop-blur-md border-slate-600/50 dark:border-slate-700/50 text-slate-100 shadow-lg hover:bg-slate-700/60 transition-all">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotateY: [0, 180, 360] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Eye className="h-4 w-4 text-emerald-400" />
                  </motion.div>
                  <SelectValue placeholder="View Mode" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-slate-800/95 dark:bg-slate-900/95 backdrop-blur-md border-slate-600/50 dark:border-slate-700/50 text-slate-100">
                <SelectGroup>
                  <SelectLabel className="text-slate-300 font-medium">View Mode</SelectLabel>
                  {viewModes.map(mode => (
                    <SelectItem key={mode.id} value={mode.id} className="focus:bg-emerald-500/20 text-slate-100">{mode.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Tabs value={tableView} onValueChange={setTableView} className="w-[180px]">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-600/30">
                <TabsTrigger value="grouped" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white text-slate-300">Grouped</TabsTrigger>
                <TabsTrigger value="flat" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white text-slate-300">Flat</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1.5 bg-slate-800/60 dark:bg-slate-900/60 backdrop-blur-md border-slate-600/50 dark:border-slate-700/50 text-slate-100 shadow-lg hover:bg-slate-700/60 hover:border-amber-400/50 transition-all">
                  <motion.div
                    animate={{ rotate: [0, 180, 360] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Settings className="h-4 w-4 text-amber-400" />
                  </motion.div>
                  <span className="hidden sm:inline">Customize</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800/95 dark:bg-slate-900/95 backdrop-blur-md border-slate-600/50 dark:border-slate-700/50 text-slate-100">
                <DialogHeader>
                  <DialogTitle className="text-slate-100">Table Customization</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-200">Visible Columns</h4>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={resetColumnVisibility}
                      className="text-xs bg-slate-700/50 border-slate-600/50 text-slate-200 hover:bg-slate-600/50"
                    >
                      Reset
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                    {columns.map(col => (
                      <div key={col.key} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`column-${col.key}`} 
                          checked={columnVisibility[col.key] !== false} 
                          onCheckedChange={() => toggleColumnVisibility(col.key)}
                          className="border-slate-500 data-[state=checked]:bg-blue-500"
                        />
                        <Label htmlFor={`column-${col.key}`} className="flex items-center gap-1.5 text-slate-200">
                          {col.iconComponent && (
                            <span className="text-slate-400">{col.iconComponent}</span>
                          )}
                          {col.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-slate-200">Items per page</h4>
                    <RadioGroup value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                      <div className="flex items-center space-x-4">
                        {[5, 10, 25, 50].map(size => (
                          <div key={size} className="flex items-center space-x-2">
                            <RadioGroupItem value={size.toString()} id={`page-${size}`} className="border-slate-500" />
                            <Label htmlFor={`page-${size}`} className="text-slate-200">{size}</Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" size="sm" onClick={exportCSV} className="bg-slate-800/60 dark:bg-slate-900/60 backdrop-blur-md border-slate-600/50 dark:border-slate-700/50 text-slate-100 shadow-lg hover:bg-slate-700/60 hover:border-green-400/50 transition-all">
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Download className="mr-2 h-4 w-4 text-green-400" />
              </motion.div>
              Export CSV
            </Button>
          </div>
        </div>
      </div>
      
      {/* Enhanced Table Container */}
      <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-2xl rounded-b-xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <motion.tr 
                className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-600/50 dark:border-slate-700/50"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {tableView === "grouped" && groupBy !== "none" && (
                  <TableHead className="w-[40px] border-r border-slate-600/50 dark:border-slate-700/50 bg-slate-800/80 dark:bg-slate-900/80"></TableHead>
                )}
                {visibleColumns.map((column, index) => (
                  <motion.th 
                    key={column.key}
                    className={cn(
                      "h-[60px] px-6 font-bold text-slate-100 border-r border-slate-600/50 dark:border-slate-700/50 last:border-r-0 bg-gradient-to-b from-slate-800/90 to-slate-900/90 dark:from-slate-900/90 dark:to-slate-950/90",
                      column.numeric ? "text-right" : "text-left",
                      "hover:bg-slate-700/70 dark:hover:bg-slate-800/70 transition-colors cursor-pointer select-none whitespace-nowrap shadow-lg"
                    )}
                    onClick={() => requestSort(column.key)}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div className={cn(
                      "flex items-center gap-3",
                      column.numeric ? "justify-end" : "justify-start"
                    )}>
                      {!column.numeric && column.iconComponent && (
                        <motion.span 
                          className="text-blue-400"
                          animate={{ 
                            rotate: [0, 5, -5, 0],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            delay: index * 0.2
                          }}
                        >
                          {column.iconComponent}
                        </motion.span>
                      )}
                      <span className="font-bold text-sm tracking-wide uppercase">{column.label}</span>
                      {column.numeric && column.iconComponent && (
                        <motion.span 
                          className="text-emerald-400"
                          animate={{ 
                            rotate: [0, 5, -5, 0],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            delay: index * 0.2
                          }}
                        >
                          {column.iconComponent}
                        </motion.span>
                      )}
                      <motion.div
                        animate={sortConfig?.key === column.key ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        {getSortIndicator(column.key)}
                      </motion.div>
                    </div>
                  </motion.th>
                ))}
              </motion.tr>
            </TableHeader>
            <TableBody>
              {paginatedGroups.length > 0 ? (
                <>
                  {paginatedGroups.map((group: any, groupIndex) => (
                    <React.Fragment key={group.key}>
                      {/* Enhanced Parent Row */}
                      <motion.tr 
                        className={cn(
                          "cursor-pointer hover:bg-blue-50/50 dark:hover:bg-slate-800/30 transition-all duration-300 border-b border-slate-200/50 dark:border-slate-700/50 group",
                          expandedRows[group.key] && "bg-blue-50/30 dark:bg-slate-800/20 shadow-lg border-blue-200/50 dark:border-blue-700/30",
                          groupIndex % 2 === 0 ? "bg-slate-50/30 dark:bg-slate-900/20" : "bg-white dark:bg-slate-800/10"
                        )}
                        onClick={() => toggleRowExpansion(group.key)}
                        style={{ height: `${rowHeight + 10}px` }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: groupIndex * 0.05 }}
                        whileHover={{ scale: 1.002 }}
                      >
                        {tableView === "grouped" && groupBy !== "none" && (
                          <TableCell className="py-2 border-r border-slate-200/50 dark:border-slate-700/50 bg-slate-100/50 dark:bg-slate-800/30">
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors rounded-full">
                              <motion.div
                                animate={{ rotate: expandedRows[group.key] ? 0 : -90 }}
                                transition={{ duration: 0.2 }}
                              >
                                {expandedRows[group.key] ? (
                                  <ChevronDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                ) : (
                                  <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                )}
                              </motion.div>
                            </Button>
                          </TableCell>
                        )}
                        
                        {/* Enhanced table cells with better styling */}
                        {visibleColumns.map(column => {
                          if (column.key === 'teacherName') {
                            return (
                              <TableCell key={column.key} className={cn(
                                "py-4 px-6 border-r border-slate-200/50 dark:border-slate-700/50 last:border-r-0", 
                                column.numeric ? "text-right" : "text-left"
                              )}>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10 ring-2 ring-blue-400/30 shadow-lg">
                                    <AvatarImage src={trainerAvatars[group.teacherName]} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm">
                                      {group.teacherName?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{group.teacherName}</span>
                                </div>
                              </TableCell>
                            );
                          }
                          
                          if (column.key === 'cleanedClass' && tableView === 'grouped') {
                            return (
                              <TableCell key={column.key} className={cn(
                                "py-4 px-6 border-r border-slate-200/50 dark:border-slate-700/50 last:border-r-0", 
                                column.numeric ? "text-right" : "text-left"
                              )}>
                                <div className="flex items-center gap-3">
                                  <Badge variant="secondary" className="font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 shadow-lg px-3 py-1">
                                    {group.displayOccurrences || 0}
                                  </Badge>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{group.cleanedClass}</span>
                                </div>
                              </TableCell>
                            );
                          }
                          
                          // Enhanced numeric cells with better styling
                          return (
                            <TableCell key={column.key} className={cn(
                              "py-4 px-6 border-r border-slate-200/50 dark:border-slate-700/50 last:border-r-0", 
                              column.numeric ? "text-right" : "text-left"
                            )}>
                              <span className={cn(
                                column.numeric && "font-mono font-semibold text-sm",
                                column.currency && "text-emerald-600 dark:text-emerald-400 font-bold",
                                column.key === 'totalEmpty' && "text-red-600 dark:text-red-400 font-bold",
                                column.key === 'totalNonEmpty' && "text-green-600 dark:text-green-400 font-bold",
                                "whitespace-nowrap"
                              )}>
                                {getSafeValue(group, column.key)}
                              </span>
                            </TableCell>
                          );
                        })}
                      </motion.tr>
                      
                      {/* Enhanced Child Rows with improved animation */}
                      {group.children && expandedRows[group.key] && (
                        <AnimatePresence>
                          {group.children.map((item: ProcessedData, index: number) => (
                            <motion.tr 
                              key={`${group.key}-child-${index}`}
                              initial={{ opacity: 0, y: -10, height: 0 }}
                              animate={{ opacity: 1, y: 0, height: 'auto' }}
                              exit={{ opacity: 0, y: -10, height: 0 }}
                              transition={{ duration: 0.2, delay: index * 0.03 }}
                              className="bg-gradient-to-r from-slate-50/80 via-blue-50/30 to-slate-50/80 dark:from-slate-800/40 dark:via-slate-700/20 dark:to-slate-800/40 text-sm border-b border-slate-200/30 dark:border-slate-700/30 hover:bg-gradient-to-r hover:from-blue-50/60 hover:via-blue-100/40 hover:to-blue-50/60 dark:hover:from-slate-700/50 dark:hover:via-slate-600/30 dark:hover:to-slate-700/50 transition-all duration-200"
                              style={{ height: `${rowHeight}px` }}
                            >
                              {tableView === "grouped" && groupBy !== "none" && (
                                <TableCell className="border-r border-slate-200/50 dark:border-slate-700/50 bg-slate-100/70 dark:bg-slate-800/50">
                                  <div className="w-8 h-8 flex items-center justify-center">
                                    <motion.div 
                                      className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 shadow-sm"
                                      animate={{ scale: [1, 1.2, 1] }}
                                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                                    ></motion.div>
                                  </div>
                                </TableCell>
                              )}
                              
                              {/* Enhanced child row cells */}
                              {visibleColumns.map(column => (
                                <TableCell key={`child-${column.key}`} className={cn(
                                  "py-3 px-6 border-r border-slate-200/50 dark:border-slate-700/50 last:border-r-0", 
                                  column.numeric ? "text-right" : "text-left"
                                )}>
                                  <span className={cn(
                                    "text-slate-600 dark:text-slate-300",
                                    column.numeric && "font-mono text-xs font-medium",
                                    column.currency && "text-emerald-600/80 dark:text-emerald-400/80",
                                    column.key === 'totalEmpty' && "text-red-600/80 dark:text-red-400/80",
                                    column.key === 'totalNonEmpty' && "text-green-600/80 dark:text-green-400/80",
                                    "whitespace-nowrap"
                                  )}>
                                    {getSafeValue(item, column.key)}
                                  </span>
                                </TableCell>
                              ))}
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      )}
                    </React.Fragment>
                  ))}
                  
                  {/* Enhanced Totals Row */}
                  <motion.tr 
                    className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-t-2 border-blue-500/30 font-bold text-slate-100 shadow-xl"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    style={{ height: `${rowHeight + 10}px` }}
                  >
                    {tableView === "grouped" && groupBy !== "none" && (
                      <TableCell className="border-r border-slate-600/50 bg-slate-800/90">
                        <div className="flex items-center justify-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          >
                            <BarChart3 className="h-5 w-5 text-blue-400" />
                          </motion.div>
                        </div>
                      </TableCell>
                    )}
                    
                    {visibleColumns.map((column, index) => {
                      let totalValue = "";
                      
                      if (column.key === 'cleanedClass') {
                        totalValue = `${filteredGroups.length} Groups`;
                      } else if (column.key === 'displayOccurrences') {
                        totalValue = totals.displayOccurrences.toString();
                      } else if (column.key === 'totalEmpty') {
                        totalValue = totals.totalEmpty.toString();
                      } else if (column.key === 'totalNonEmpty') {
                        totalValue = totals.totalNonEmpty.toString();
                      } else if (column.key === 'totalCheckins') {
                        totalValue = totals.totalCheckins.toString();
                      } else if (column.key === 'totalRevenue') {
                        totalValue = formatIndianCurrency(totals.totalRevenue);
                      } else if (column.key === 'totalOccurrences') {
                        totalValue = totals.totalOccurrences.toString();
                      } else if (column.key === 'totalCancelled') {
                        totalValue = totals.totalCancelled.toString();
                      } else if (column.key === 'classAverageIncludingEmpty') {
                        const avg = totals.displayOccurrences > 0 ? totals.totalCheckins / totals.displayOccurrences : 0;
                        totalValue = avg.toFixed(1);
                      } else if (index === 0) {
                        totalValue = "TOTALS";
                      } else {
                        totalValue = "-";
                      }
                      
                      return (
                        <TableCell 
                          key={`total-${column.key}`} 
                          className={cn(
                            "py-4 px-6 border-r border-slate-600/50 last:border-r-0 text-slate-100 font-bold",
                            column.numeric ? "text-right" : "text-left",
                            "whitespace-nowrap shadow-lg"
                          )}
                        >
                          <motion.span
                            animate={{ 
                              textShadow: [
                                "0 0 0px rgba(59, 130, 246, 0)",
                                "0 0 10px rgba(59, 130, 246, 0.8)",
                                "0 0 0px rgba(59, 130, 246, 0)"
                              ]
                            }}
                            transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
                          >
                            {totalValue}
                          </motion.span>
                        </TableCell>
                      );
                    })}
                  </motion.tr>
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 1} className="text-center py-16 text-slate-500">
                    <div className="flex flex-col items-center gap-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Search className="h-12 w-12 text-slate-400/50" />
                      </motion.div>
                      <span className="text-lg font-medium">No results found</span>
                      <span className="text-sm text-slate-400">Try adjusting your search criteria</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Enhanced Footer with better styling */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-t border-slate-700/50 dark:border-slate-800/50 p-6 rounded-b-xl shadow-2xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Enhanced Summary Stats */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300">
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 shadow-lg"></div>
              <span className="font-bold text-slate-100">{filteredGroups.length}</span>
              <span>{tableView === "grouped" ? "Groups" : "Rows"}</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <ListChecks className="h-4 w-4 text-emerald-400" />
              <span className="font-bold text-slate-100">{totals.totalCheckins.toLocaleString()}</span>
              <span>Total Check-ins</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <IndianRupee className="h-4 w-4 text-amber-400" />
              <span className="font-bold text-slate-100">{formatIndianCurrency(totals.totalRevenue)}</span>
              <span>Total Revenue</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <Calendar className="h-4 w-4 text-blue-400" />
              <span className="font-bold text-slate-100">{totals.displayOccurrences.toLocaleString()}</span>
              <span>Total Classes</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <ListFilter className="h-4 w-4 text-red-400" />
              <span className="font-bold text-slate-100">{totals.totalEmpty.toLocaleString()}</span>
              <span>Empty</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <ListFilter className="h-4 w-4 text-green-400" />
              <span className="font-bold text-slate-100">{totals.totalNonEmpty.toLocaleString()}</span>
              <span>Non-empty</span>
            </motion.div>
          </div>
          
          {/* Enhanced Pagination */}
          <Pagination>
            <PaginationContent className="bg-slate-800/80 dark:bg-slate-900/80 backdrop-blur-md rounded-lg border border-slate-600/50 dark:border-slate-700/50 px-3 py-2 shadow-xl">
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => goToPage(currentPage - 1)}
                  className={cn(
                    "transition-all text-slate-300 hover:text-slate-100",
                    currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-blue-500/20 hover:border-blue-400/50"
                  )}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNumber;
                
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      isActive={pageNumber === currentPage}
                      onClick={() => goToPage(pageNumber)}
                      className={cn(
                        "cursor-pointer transition-all",
                        pageNumber === currentPage 
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg border-0" 
                          : "hover:bg-blue-500/20 text-slate-300 hover:text-slate-100 hover:border-blue-400/50"
                      )}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => goToPage(currentPage + 1)}
                  className={cn(
                    "transition-all text-slate-300 hover:text-slate-100",
                    currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-blue-500/20 hover:border-blue-400/50"
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
        
        <div className="mt-4 text-xs text-center text-slate-400">
          Showing <span className="font-bold text-slate-200">{Math.min((currentPage - 1) * pageSize + 1, sortedGroups.length)}</span> to <span className="font-bold text-slate-200">{Math.min(currentPage * pageSize, sortedGroups.length)}</span> of <span className="font-bold text-slate-200">{sortedGroups.length}</span> {tableView === "grouped" ? "groups" : "rows"}
        </div>
      </div>
    </div>
  );
}
