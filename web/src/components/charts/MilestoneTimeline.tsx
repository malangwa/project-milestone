interface Milestone {
  id: string;
  name: string;
  dueDate?: string;
  progress: number;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
}

interface MilestoneTimelineProps {
  milestones: Milestone[];
  className?: string;
}

const statusColors = {
  pending: 'bg-gray-300',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  delayed: 'bg-red-500',
};

export const MilestoneTimeline = ({ milestones, className = '' }: MilestoneTimelineProps) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {milestones.map((milestone) => {
        const dueDate = milestone.dueDate
          ? new Date(milestone.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : 'No due date';
        const isOverdue = milestone.dueDate && new Date(milestone.dueDate) < new Date() && milestone.status !== 'completed';

        return (
          <div key={milestone.id} className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${statusColors[milestone.status]}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-900 truncate">{milestone.name}</span>
                <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                  {dueDate}
                </span>
              </div>
              <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${statusColors[milestone.status]}`}
                  style={{ width: `${milestone.progress}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};