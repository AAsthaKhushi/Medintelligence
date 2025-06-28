import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { AlertTriangle, AlertCircle, XCircle, CheckCircle } from 'lucide-react';
import { MedicationConflict } from '@shared/schema';

interface ConflictPanelProps {
  conflicts: MedicationConflict[];
}

export function ConflictPanel({ conflicts }: ConflictPanelProps) {
  const criticalConflicts = conflicts.filter(c => c.severity === 'critical');
  const severeConflicts = conflicts.filter(c => c.severity === 'severe');
  const moderateConflicts = conflicts.filter(c => c.severity === 'moderate');
  const minorConflicts = conflicts.filter(c => c.severity === 'minor');

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'severe': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'moderate': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <AlertCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'severe': return 'border-orange-200 bg-orange-50';
      case 'moderate': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  if (conflicts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            No Conflicts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No medication conflicts detected. Your schedule looks good!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Medication Conflicts
          <Badge variant="destructive" className="ml-auto">
            {conflicts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Critical Conflicts */}
          {criticalConflicts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-red-800 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Critical ({criticalConflicts.length})
              </h4>
              {criticalConflicts.map((conflict, index) => (
                <div key={index} className={`p-3 rounded-md border ${getSeverityColor(conflict.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">
                        {conflict.conflictType === 'timing' ? 'Timing Conflict' : 'Drug Interaction'}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        {conflict.description}
                      </p>
                      {conflict.suggestedResolution && (
                        <p className="text-xs text-red-600 mt-1">
                          <strong>Action:</strong> {conflict.suggestedResolution}
                        </p>
                      )}
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      Critical
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Severe Conflicts */}
          {severeConflicts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-orange-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Severe ({severeConflicts.length})
              </h4>
              {severeConflicts.map((conflict, index) => (
                <div key={index} className={`p-3 rounded-md border ${getSeverityColor(conflict.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-800">
                        {conflict.conflictType === 'timing' ? 'Timing Conflict' : 'Drug Interaction'}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        {conflict.description}
                      </p>
                      {conflict.suggestedResolution && (
                        <p className="text-xs text-orange-600 mt-1">
                          <strong>Action:</strong> {conflict.suggestedResolution}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                      Severe
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Moderate Conflicts */}
          {moderateConflicts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-yellow-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Moderate ({moderateConflicts.length})
              </h4>
              {moderateConflicts.map((conflict, index) => (
                <div key={index} className={`p-3 rounded-md border ${getSeverityColor(conflict.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800">
                        {conflict.conflictType === 'timing' ? 'Timing Conflict' : 'Drug Interaction'}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        {conflict.description}
                      </p>
                      {conflict.suggestedResolution && (
                        <p className="text-xs text-yellow-600 mt-1">
                          <strong>Action:</strong> {conflict.suggestedResolution}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                      Moderate
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Minor Conflicts */}
          {minorConflicts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Minor ({minorConflicts.length})
              </h4>
              {minorConflicts.map((conflict, index) => (
                <div key={index} className={`p-3 rounded-md border ${getSeverityColor(conflict.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800">
                        {conflict.conflictType === 'timing' ? 'Timing Conflict' : 'Drug Interaction'}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {conflict.description}
                      </p>
                      {conflict.suggestedResolution && (
                        <p className="text-xs text-blue-600 mt-1">
                          <strong>Action:</strong> {conflict.suggestedResolution}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                      Minor
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                Optimize Schedule
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                Contact Doctor
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 