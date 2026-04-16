import api from './api';

export const mapService = {
  getNearbyStories: (lat: number, lng: number) => 
    api.get(`/feed?latitude=${lat}&longitude=${lng}`),
  recordCrossing: (targetUserId: string) => 
    api.post('/record-crossing', { targetUserId }),
};

export default mapService;
