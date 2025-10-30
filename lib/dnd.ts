import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

export { DndContext, SortableContext, verticalListSortingStrategy };

// Custom hook for DnD sensors
export function useDragAndDrop() {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return {
    sensors,
    collisionDetection: closestCenter,
  };
}

// Helper function to handle drag end events
export function handleDragEnd<T extends { id: string }>(
  event: DragEndEvent,
  items: T[],
  onReorder: (newItems: T[]) => void
) {
  const { active, over } = event;

  if (active.id !== over?.id) {
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over?.id);

    const newItems = arrayMove(items, oldIndex, newIndex);
    onReorder(newItems);
  }
}

// Utility to extract ordered IDs from items
export function getOrderedIds<T extends { id: string }>(items: T[]): string[] {
  return items.map((item) => item.id);
}
