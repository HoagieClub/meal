import { toast } from 'sonner';
import { WeeklyPlan } from '@/types/goals';
import {
  Popover,
  Position,
  Pane,
  Heading,
  Text,
  Button,
  IconButton,
  majorScale,
  minorScale,
} from 'evergreen-ui';
import { CalendarIcon, TrashIcon, BookmarkIcon } from 'lucide-react';

interface SavedPlansManagerProps {
  savedPlans: Record<string, WeeklyPlan>;
  setSavedPlans: (value: Record<string, WeeklyPlan>) => void;
  setCurrentDate: (value: string) => void;
  setStoredPlan: (value: WeeklyPlan | null) => void;
}

export default function SavedPlansManager({
  savedPlans,
  setSavedPlans,
  setCurrentDate,
  setStoredPlan,
}: SavedPlansManagerProps) {
  const loadPlan = (dateString: string, plan: WeeklyPlan) => {
    setCurrentDate(dateString);
    setStoredPlan(plan);
    toast.success(
      `Loaded plan for week of ${new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })}`
    );
  };

  const deletePlan = (dateString: string) => {
    setSavedPlans(
      Object.fromEntries(Object.entries(savedPlans).filter(([key]) => key !== dateString))
    );
    toast.success('Saved plan deleted.');
  };

  return (
    <Popover
      position={Position.BOTTOM_RIGHT}
      content={({ close }) => (
        <Pane
          padding={majorScale(2)}
          width={320}
          display='flex'
          flexDirection='column'
          gap={minorScale(2)}
        >
          <Heading size={400} marginBottom={majorScale(1)}>
            Saved Plans
          </Heading>
          <Pane
            maxHeight={300}
            overflowY='auto'
            display='flex'
            flexDirection='column'
            gap={minorScale(2)}
          >
            {Object.keys(savedPlans).length === 0 ? (
              <Text color='muted'>You have no saved plans.</Text>
            ) : (
              Object.entries(savedPlans).map(([dateString, plan]) => (
                <Pane
                  key={dateString}
                  display='flex'
                  justifyContent='space-between'
                  alignItems='center'
                  gap={minorScale(2)}
                >
                  <Button
                    flex={1}
                    justifyContent='flex-start'
                    onClick={() => {
                      loadPlan(dateString, plan);
                      close();
                    }}
                    gap={minorScale(3)}
                  >
                    <CalendarIcon />
                    Week of{' '}
                    {new Date(dateString).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Button>
                  <IconButton
                    icon={TrashIcon}
                    intent='danger'
                    appearance='minimal'
                    onClick={() => deletePlan(dateString)}
                  />
                </Pane>
              ))
            )}
          </Pane>
        </Pane>
      )}
    >
      <IconButton
        icon={BookmarkIcon}
        appearance='minimal'
        height={32}
        title='View Saved Plans'
        background={'white'}
      />
    </Popover>
  );
}
