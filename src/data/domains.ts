import { DomainId, DomainInfo } from '../types';

export const AWS_DOMAINS: Record<DomainId, DomainInfo> = {
  'domain-1': {
    id: 'domain-1',
    name: 'Cloud Concepts',
    weight: 24,
    questionCount: 16,
    color: '#60A5FA', // Sky Blue
  },
  'domain-2': {
    id: 'domain-2',
    name: 'Security and Compliance',
    weight: 30,
    questionCount: 20,
    color: '#F87171', // Crimson / Shield Red
  },
  'domain-3': {
    id: 'domain-3',
    name: 'Cloud Technology and Services',
    weight: 34,
    questionCount: 22,
    color: '#A78BFA', // Purple
  },
  'domain-4': {
    id: 'domain-4',
    name: 'Billing, Pricing and Support',
    weight: 12,
    questionCount: 7,
    color: '#34D399', // Emerald
  },
};

export const PASSING_PERCENTAGE = 72; // AWS scaled passing score is 700 / 1000 (~70-72%)
export const EXAM_QUESTION_COUNT = 65;
export const EXAM_DURATION_MINUTES = 90;
