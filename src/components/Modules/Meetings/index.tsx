import React from 'react';
import { AnnouncementsModule } from '../Announcements/index.tsx';

export const MeetingsModule: React.FC = () => {
  return <AnnouncementsModule initialTab="meetings" />;
};
