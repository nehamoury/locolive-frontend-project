import { useState } from 'react';
import { Search, Flag, Trash2, Play, Heart, MessageCircle, Bot } from 'lucide-react';
import { useAdminContent, useAdminDeleteStory, useAdminDeletePost, useAdminDeleteReel } from '../../hooks/useAdmin';
import { nullString } from '../../utils/string';

function formatTime(timestamp: string) {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = Math.floor((now.getTime() - time.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function Reels() {
  const [page] = useState(1);
  const [pageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [contentType, setContentType] = useState<'story' | 'reel' | 'post'>('reel');
  const [filter, setFilter] = useState<'all' | 'flagged' | 'ai'>('all');

  const { data, isLoading, isError } = useAdminContent(page, pageSize, contentType);
  const deleteStoryMutation = useAdminDeleteStory();
  const deletePostMutation = useAdminDeletePost();
  const deleteReelMutation = useAdminDeleteReel();

  const items = data?.items || [];
  const total = data?.total || 0;

  const filteredItems = items.filter(item => {
    const username = nullString(item.username) || nullString(item.user?.username) || '';
    const matchesSearch = username.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'flagged') return matchesSearch && item.is_flagged;
    if (filter === 'ai') return matchesSearch && item.is_ai_generated;
    return matchesSearch;
  });

  const handleDelete = (id: string) => {
    if (contentType === 'story') deleteStoryMutation.mutate(id);
    else if (contentType === 'post') deletePostMutation.mutate(id);
    else if (contentType === 'reel') deleteReelMutation.mutate(id);
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
          <h1 className="text-2xl font-bold text-gray-900">Content Moderation</h1>
          <p className="text-sm text-gray-500">Manage uploaded posts, reels and stories</p>
        </div>
        <span className="text-sm font-medium px-3 py-1 bg-gray-100 rounded-full text-gray-600">
          {total} Total {contentType.charAt(0).toUpperCase() + contentType.slice(1)}s
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center p-1 bg-gray-100 rounded-xl">
           <button 
             onClick={() => setContentType('reel')}
             className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${contentType === 'reel' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
           >
             Reels
           </button>
           <button 
             onClick={() => setContentType('post')}
             className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${contentType === 'post' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
           >
             Posts
           </button>
           <button 
             onClick={() => setContentType('story')}
             className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${contentType === 'story' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
           >
             Stories
           </button>
        </div>

        <div className="flex-1 max-w-md ml-4">
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
            <option value="all">All Items</option>
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
      ) : filteredItems.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">No content found</h3>
            <p className="text-gray-500 text-sm mt-1">There are no {contentType}s to display.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item: any) => {
            const mediaUrl = item.video_url || item.media_url || item.videoUrl || item.mediaUrl;
            const username = nullString(item.username) || nullString(item.user?.username) || 'unknown';
            const likesCount = item.likes_count ?? item.likes ?? 0;
            const commentsCount = item.comments_count ?? item.comments ?? 0;
            const createdAt = item.created_at || item.createdAt || new Date().toISOString();
            const caption = nullString(item.caption) || nullString(item.body_text);

            return (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                {/* Thumbnail / Media */}
                <div className="relative aspect-[9/16] bg-gray-100 flex-shrink-0 group">
                  {(contentType === 'post' || contentType === 'story') && mediaUrl ? (
                    <img src={mediaUrl} alt="Content" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="w-12 h-12 text-gray-400 group-hover:scale-110 transition-transform" />
                    </div>
                  )}
                  
                  {item.is_ai_generated && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-purple-600 rounded-full shadow-sm">
                      <Bot className="w-3 h-3 text-white" />
                      <span className="text-xs font-medium text-white">AI</span>
                    </div>
                  )}
                  {item.is_flagged && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-red-600 rounded-full shadow-sm">
                      <Flag className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="p-3 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF006E] to-[#833AB4] flex items-center justify-center shrink-0">
                      <span className="text-xs font-medium text-white">{username[0].toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">@{username}</p>
                      <p className="text-xs text-gray-400 font-medium">{formatTime(createdAt)}</p>
                    </div>
                  </div>
                  
                  {caption && (
                    <p className="text-xs text-gray-600 line-clamp-2 mb-3 bg-gray-50 p-1.5 rounded-lg border border-gray-100 italic">
                      {caption}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-pink-500" />
                      {likesCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4 text-blue-500" />
                      {commentsCount}
                    </span>
                  </div>
                </div>
              
              {/* Actions */}
              <div className="border-t border-gray-100 p-2 flex gap-2 bg-gray-50/50">
                <button
                  onClick={() => handleFlag(item.id)}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-sm font-bold transition-all ${
                    item.is_flagged 
                      ? 'bg-red-100 text-red-600 shadow-inner' 
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Flag className="w-4 h-4" />
                  {item.is_flagged ? 'Flagged' : 'Flag'}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deleteStoryMutation.isPending || deletePostMutation.isPending || deleteReelMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-600 hover:text-white transition-all disabled:opacity-50 border border-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Reels;