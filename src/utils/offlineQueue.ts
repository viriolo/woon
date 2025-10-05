const QUEUE_KEY = "woon-offline-queue" as const;

export type OfflineCommentAction = {
  id: string;
  type: "comment";
  payload: {
    celebrationId: number;
    text: string;
    createdAt: string;
    userSnapshot: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string;
    };
  };
};

export type OfflineCelebrationAction = {
  id: string;
  type: "celebration";
  payload: {
    celebrationData: {
      title: string;
      description: string;
      imageDataUrl: string;
    };
    userId: string;
    location: { lat: number; lng: number };
    createdAt: string;
  };
};

export type OfflineAction = OfflineCommentAction | OfflineCelebrationAction;
export type OfflineActionInput = Omit<OfflineAction, "id">;

const generateId = () => `offline-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const readQueue = (): OfflineAction[] => {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const stored = window.localStorage.getItem(QUEUE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as OfflineAction[];
  } catch (error) {
    console.warn("Failed to read offline queue", error);
    return [];
  }
};

const writeQueue = (queue: OfflineAction[]) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.warn("Failed to persist offline queue", error);
  }
};

export const offlineQueue = {
  getAll(): OfflineAction[] {
    return readQueue();
  },
  enqueue(action: OfflineActionInput & { id?: string }): OfflineAction {
    const queue = readQueue();
    const entry: OfflineAction = { ...action, id: action.id ?? generateId() } as OfflineAction;
    queue.push(entry);
    writeQueue(queue);
    return entry;
  },
  remove(actionId: string) {
    const queue = readQueue();
    const filtered = queue.filter((item) => item.id !== actionId);
    writeQueue(filtered);
  },
  clear() {
    writeQueue([]);
  },
};
