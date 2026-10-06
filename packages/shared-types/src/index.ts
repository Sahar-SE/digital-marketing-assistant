export interface BrandDNA {
  id?: string;
  userId: string;
  brandName: string;
  productCategory: string;
  toneDescriptors: string[];
  audienceDescription: string;
  styleReferences: string[];
  ethicalPositioning: string;
  status: 'incomplete' | 'complete';
  questionnaireComplete: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  id: string;
  email: string;
  createdAt: Date;
  phase: 'phase_1' | 'phase_2' | 'phase_3';
  generationCredits: number;
}
