export interface Tutorial {
  id: string;
  title: string;
  description?: string;
  category?: string;
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TutorialStep {
  id: string;
  tutorialId: string;
  position: number;
  title?: string;
  description: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TutorialWithSteps extends Tutorial {
  steps: TutorialStep[];
}
