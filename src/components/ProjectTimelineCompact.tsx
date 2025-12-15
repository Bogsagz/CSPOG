import { useProjectTimeline } from '@/hooks/useProjectTimeline';
import { Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import xWingIcon from '@/assets/x-wing-icon.png';
import redDwarfIcon from '@/assets/red-dwarf-icon.png';
import enterpriseIcon from '@/assets/enterprise-icon.png';
import starDestroyerIcon from '@/assets/star-destroyer-icon.png';
import deathStarIcon from '@/assets/death-star-icon.png';

interface ProjectTimelineCompactProps {
  projectStartDate: string | null;
  goLiveDate?: string | null;
  fleetSize?: string | null;
  projectId?: string | null;
}

export function ProjectTimelineCompact({ projectStartDate, goLiveDate, fleetSize, projectId }: ProjectTimelineCompactProps) {
  const { milestones } = useProjectTimeline(projectStartDate, goLiveDate || null, projectId);
  const [progress, setProgress] = useState(0);

  // Map fleet sizes to spacecraft icons
  const getSpacecraftIcon = () => {
    switch (fleetSize) {
      case 'X-Wing':
        return xWingIcon;
      case 'Red Dwarf':
        return redDwarfIcon;
      case 'Enterprise':
        return enterpriseIcon;
      case 'Star Destroyer':
        return starDestroyerIcon;
      case 'Death Star':
        return deathStarIcon;
      default:
        return xWingIcon;
    }
  };

  const spacecraftIcon = getSpacecraftIcon();

  useEffect(() => {
    if (!projectStartDate || !goLiveDate) return;

    const today = new Date();
    const startDate = new Date(projectStartDate);
    const endDate = new Date(goLiveDate);
    
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = today.getTime() - startDate.getTime();
    
    const calculatedProgress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
    setProgress(calculatedProgress);
  }, [projectStartDate, goLiveDate]);

  if (!projectStartDate || milestones.length === 0) {
    return (
      <div className="mt-4 p-3 bg-muted/30 rounded-lg border">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Target className="h-4 w-4" />
          No timeline available - Project Start date not set
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
      <p className="text-sm font-medium mb-3 flex items-center gap-2">
        <Target className="h-4 w-4" />
        Project Timeline
        {fleetSize && (
          <span className="text-xs text-muted-foreground ml-auto">
            Fleet: {fleetSize}
          </span>
        )}
      </p>
      <div className="relative pb-12">
        {/* Timeline base line */}
        <div className="absolute left-0 right-0 top-2 h-1 bg-border rounded-full" />
        
        {/* Progress line (shaded path behind spaceship) */}
        <div 
          className="absolute left-0 top-2 h-1 bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-primary/20 blur-sm rounded-full" />
        </div>
        
        {/* Spacecraft icon */}
        <div 
          className="absolute top-0 transition-all duration-500 ease-out z-20"
          style={{ 
            left: `${progress}%`,
            transform: 'translate(-50%, -16px)'
          }}
        >
          <div className="relative animate-pulse">
            <div 
              className="h-[68px] w-[68px] rounded-full bg-background flex items-center justify-center overflow-hidden"
              style={{ 
                filter: 'drop-shadow(0 0 10px hsl(var(--primary) / 0.5))'
              }}
            >
              <img 
                src={spacecraftIcon}
                alt={fleetSize || 'Spacecraft'}
                className="h-11 w-11 object-contain"
                style={{
                  mixBlendMode: 'darken',
                  filter: 'contrast(1.2) brightness(0.9)'
                }}
              />
            </div>
            {/* Trail effect */}
            <div className="absolute inset-0 -z-10">
              <div className="w-16 h-2 bg-gradient-to-l from-primary/40 to-transparent blur-sm absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full" />
            </div>
          </div>
        </div>
        
        {/* Milestones */}
        <div className="relative flex justify-between items-start mt-6">
          {milestones.map((milestone, index) => {
            const milestoneProgress = (index / (milestones.length - 1)) * 100;
            const isPassed = progress >= milestoneProgress;
            
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className={`w-3 h-3 rounded-full border-2 transition-all duration-300 z-10 ${
                  milestone.name === 'End Security Alpha' 
                    ? 'border-primary bg-primary shadow-lg' 
                    : isPassed
                    ? 'border-primary bg-primary'
                    : 'border-border bg-background'
                }`} />
                <div className="mt-2 text-center">
                  <p className={`text-xs font-medium transition-colors ${
                    isPassed ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {milestone.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {milestone.date.toLocaleDateString('en-GB', { 
                      day: 'numeric', 
                      month: 'short'
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
