import { Role } from '@prisma/client';

export class Event {
  id: string;
  name: string;
  slug: string;
  dateStart: Date;
  dateEnd: Date;
  description: string;
  banner: string | null;
  userId: string | null;
  published: boolean;
  orgaName: string | null;
  orgaWebsite: string | null;
  eventWebsite: string | null;
  eventAddress: string | null;
  registrationLink: string | null;
  isOnlineEvent: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;

  // Optional: User relation
  user?: {
    id: string;
    email: string;
    nick: string;
    role: Role;
  };
}
