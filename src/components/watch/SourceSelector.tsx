import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Zap,
  Shield,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface StreamingSource {
  id: string;
  name: string;
  url: string;
  quality?: string;
  isWorking?: boolean;
  isLoading?: boolean;
  error?: string;
  responseTime?: number;
  isRecommended?: boolean;
  features?: string[];
}

interface SourceSelectorProps {
  sources: StreamingSource[];
  activeSourceId?: string;
  onSourceSelect: (source: StreamingSource) => void;
  onSourceTest?: (source: StreamingSource) => Promise<boolean>;
  autoSelectBest?: boolean;
  isCompact?: boolean;
}

export const SourceSelector: React.FC<SourceSelectorProps> = ({
  sources,
  activeSourceId,
  onSourceSelect,
  onSourceTest,
  autoSelectBest = true,
  isCompact = false
}) => {
  const [testingSourceId, setTestingSourceId] = useState<string | null>(null);
  const [sourceStatuses, setSourceStatuses] = useState<Record<string, StreamingSource>>({});

  useEffect(() => {
    // Initialize source statuses
    const initialStatuses: Record<string, StreamingSource> = {};
    sources.forEach(source => {
      initialStatuses[source.id] = { ...source };
    });
    setSourceStatuses(initialStatuses);

    // Auto-test sources if enabled
    if (autoSelectBest && onSourceTest) {
      testAllSources();
    }
  }, [sources, autoSelectBest, onSourceTest]);

  const testAllSources = async () => {
    if (!onSourceTest) return;

    const updatedStatuses = { ...sourceStatuses };
    
    // Test sources in parallel but with staggered delays
    const testPromises = sources.map(async (source, index) => {
      // Stagger the tests to avoid overwhelming the servers
      await new Promise(resolve => setTimeout(resolve, index * 200));
      
      updatedStatuses[source.id] = { 
        ...source, 
        isLoading: true, 
        error: undefined 
      };
      setSourceStatuses({ ...updatedStatuses });

      const startTime = Date.now();
      try {
        const isWorking = await onSourceTest(source);
        const responseTime = Date.now() - startTime;
        
        updatedStatuses[source.id] = {
          ...source,
          isWorking,
          isLoading: false,
          responseTime,
          error: isWorking ? undefined : 'Source not available'
        };
      } catch (error) {
        updatedStatuses[source.id] = {
          ...source,
          isWorking: false,
          isLoading: false,
          error: 'Failed to test source'
        };
      }
      
      setSourceStatuses({ ...updatedStatuses });
    });

    await Promise.all(testPromises);

    // Auto-select the best working source
    const workingSources = Object.values(updatedStatuses)
      .filter(source => source.isWorking)
      .sort((a, b) => (a.responseTime || Infinity) - (b.responseTime || Infinity));

    if (workingSources.length > 0 && !activeSourceId) {
      onSourceSelect(workingSources[0]);
    }
  };

  const testSingleSource = async (source: StreamingSource) => {
    if (!onSourceTest) return;

    setTestingSourceId(source.id);
    const updatedStatuses = { ...sourceStatuses };
    
    updatedStatuses[source.id] = { 
      ...source, 
      isLoading: true, 
      error: undefined 
    };
    setSourceStatuses(updatedStatuses);

    const startTime = Date.now();
    try {
      const isWorking = await onSourceTest(source);
      const responseTime = Date.now() - startTime;
      
      updatedStatuses[source.id] = {
        ...source,
        isWorking,
        isLoading: false,
        responseTime,
        error: isWorking ? undefined : 'Source not available'
      };
    } catch (error) {
      updatedStatuses[source.id] = {
        ...source,
        isWorking: false,
        isLoading: false,
        error: 'Failed to test source'
      };
    }
    
    setSourceStatuses(updatedStatuses);
    setTestingSourceId(null);
  };

  const getSourceIcon = (source: StreamingSource) => {
    const status = sourceStatuses[source.id] || source;
    
    if (status.isLoading) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
    }
    
    if (status.isWorking === true) {
      return <CheckCircle className="w-4 h-4 text-purple-400" />;
    }
    
    if (status.isWorking === false) {
      return <XCircle className="w-4 h-4 text-red-400" />;
    }
    
    return <AlertCircle className="w-4 h-4 text-yellow-400" />;
  };

  const getSourceBadge = (source: StreamingSource) => {
    const status = sourceStatuses[source.id] || source;
    
    if (status.isRecommended) {
      return (
        <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-400/30">
          <Zap className="w-3 h-3 mr-1" />
          Recommended
        </Badge>
      );
    }
    
    if (status.quality) {
      return (
        <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
          {status.quality}
        </Badge>
      );
    }
    
    return null;
  };

  const getResponseTimeColor = (responseTime?: number) => {
    if (!responseTime) return 'text-gray-400';
    if (responseTime < 1000) return 'text-purple-400';
    if (responseTime < 3000) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (isCompact) {
    return (
      <div className="frosted-glass p-4 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Streaming Sources</h3>
          <Button
            onClick={testAllSources}
            size="sm"
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {sources.map((source) => {
            const status = sourceStatuses[source.id] || source;
            const isActive = activeSourceId === source.id;
            
            return (
              <motion.button
                key={source.id}
                onClick={() => onSourceSelect(source)}
                className={`glass-card p-3 rounded-lg text-left transition-all duration-200 ${
                  isActive 
                    ? 'ring-2 ring-purple-400/50 bg-purple-400/10' 
                    : 'hover:bg-white/5'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white truncate">
                    {source.name}
                  </span>
                  {getSourceIcon(source)}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="frosted-glass p-6 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Streaming Sources</h3>
        <div className="flex items-center space-x-2">
          <Button
            onClick={testAllSources}
            size="sm"
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Test All
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {sources.map((source, index) => {
            const status = sourceStatuses[source.id] || source;
            const isActive = activeSourceId === source.id;
            const isTesting = testingSourceId === source.id;
            
            return (
              <motion.div
                key={source.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: index * 0.1 } }}
                exit={{ opacity: 0, y: -20 }}
                className={`glass-card p-4 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'ring-2 ring-purple-400/50 bg-purple-400/10 shimmer-border' 
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {getSourceIcon(source)}
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-white">{source.name}</h4>
                        {getSourceBadge(source)}
                        {isActive && (
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">
                            <Play className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-1">
                        {status.responseTime && (
                          <span className={`text-xs ${getResponseTimeColor(status.responseTime)}`}>
                            {status.responseTime}ms
                          </span>
                        )}
                        
                        {status.error && (
                          <span className="text-xs text-red-400">{status.error}</span>
                        )}
                        
                        {status.features && status.features.length > 0 && (
                          <div className="flex items-center space-x-1">
                            {status.features.includes('secure') && (
                              <Shield className="w-3 h-3 text-purple-400" />
                            )}
                            {status.features.includes('global') && (
                              <Globe className="w-3 h-3 text-blue-400" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => testSingleSource(source)}
                      size="sm"
                      variant="ghost"
                      disabled={isTesting || status.isLoading}
                      className="text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                    </Button>
                    
                    <Button
                      onClick={() => onSourceSelect(source)}
                      size="sm"
                      disabled={status.isWorking === false}
                      className={`${
                        isActive
                          ? 'bg-purple-500/20 text-purple-300 border-purple-400/30'
                          : 'frosted-glass border-white/20 hover:bg-white/10 text-white'
                      }`}
                    >
                      {isActive ? 'Playing' : 'Select'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {sources.length === 0 && (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <p className="text-white/70">No streaming sources available</p>
        </div>
      )}
    </div>
  );
};