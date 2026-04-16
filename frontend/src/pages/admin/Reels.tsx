import { useState } from 'react';
import { Search, Flag, Trash2, Play, Heart, MessageCircle, Bot } from 'lucide-react';
import { useAdminStories, useAdminDeleteStory } from '../../hooks/useAdmin';

function formatTime(timestamp: string) {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = Math.floor((now.getTime() - time.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function Reels() {
  const [page] = useState(1);
  const [pageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'flagged' | 'ai'>('all');

  const { data, isLoading, isError } = useAdminStories(page, pageSize);
  const deleteMutation = useAdminDeleteStory();

  const reels = data?.items || [];
  const total = data?.total || 0;

  const filteredReels = reels.filter(reel => {
    // We assume backend returns user object inside story. If not, this needs adjustment based on actual API response.
    const matchesSearch = 
      reel?.user?.username?.toLowerCase()?.includes(searchQuery.toLowerCase()) || '';
    if (filter === 'all') return matchesSearch;
    if (filter === 'flagged') return matchesSearch && reel.isFlagged;
    if (filter === 'ai') return matchesSearch && reel.isAI;
    return matchesSearch;
  });

  const handleDelete = (reelId: string) => {
    deleteMutation.mutate(reelId);
  };

  const handleFlag = (reelId: string) => {
     console.log('Flag action for reel', reelId);
  };


  if (isError) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Error loading reels. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reels & Content</h1>
          <p className="text-sm text-gray-500">Manage uploaded reels and stories</p>
        </div>
        <span className="text-sm font-medium px-3 py-1 bg-gray-100 rounded-full text-gray-600">
          {total} Total Reels
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF006E]/20 focus:border-[#FF006E]"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF006E]/20 focus:border-[#FF006E]"
          >
            <option value="all">All Reels</option>
            <option value="flagged">Flagged</option>
            <option value="ai">AI Generated</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
             <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
               <div className="aspect-[9/16] bg-gray-100"></div>
               <div className="p-3 bg-gray-50 h-24"></div>
             </div>
          ))}
        </div>
      ) : filteredReels.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">No reels found</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredReels.map((reel: any) => (
            <div key={reel.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
              {/* Thumbnail */}
              <div className="relative aspect-[9/16] bg-gray-100 flex-shrink-0">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="w-12 h-12 text-gray-400" />
                </div>
                {reel.isAI && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-purple-600 rounded-full">
                    <Bot className="w-3 h-3 text-white" />
                    <span className="text-xs font-medium text-white">AI</span>
                  </div>
                )}
                {reel.isFlagged && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-red-600 rounded-full">
                    <Flag className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              
              {/* Info */}
              <div className="p-3 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF006E] to-[#833AB4] flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-white">{reel.user?.username?.[0] || '?'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">@{reel.user?.username || 'unknown'}</p>
                    <p className="text-xs text-gray-500">{formatTime(reel.createdAt || new Date().toISOString())}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {reel.likes || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    {reel.comments || 0}
                  </span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="border-t border-gray-100 p-2 flex gap-2">
                <button
                  onClick={() => handleFlag(reel.id)}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    reel.isFlagged 
                      ? 'bg-red-100 text-red-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Flag className="w-4 h-4" />
                  {reel.isFlagged ? 'Flagged' : 'Flag'}
                </button>
                <button
                  onClick={() => handleDelete(reel.id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Reels;