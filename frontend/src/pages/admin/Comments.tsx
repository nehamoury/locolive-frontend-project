import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MessageSquare, 
  Trash2, 
  CheckCircle, 
  AlertTriangle,
  ExternalLink,
  Loader2
} from 'lucide-react';
import adminApi from '../../services/adminApi';
import { toast } from 'react-hot-toast';

const Comments: React.FC = () => {
  const queryClient = useQueryClient();
  const [page] = React.useState(1);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'comments', page],
    queryFn: () => adminApi.getComments(page, pageSize),
  });

  const moderateMutation = useMutation({
    mutationFn: ({ commentId, source, action }: { commentId: string, source: 'post' | 'reel', action: 'approve' | 'delete' }) =>
      adminApi.moderateComment(commentId, source, action),
    onSuccess: (_, variables) => {
      toast.success(`Comment ${variables.action === 'delete' ? 'deleted' : 'approved'}`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] });
    },
    onError: () => {
      toast.error('Failed to moderate comment');
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 i-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const comments = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Comment Moderation</h1>
          <p className="text-gray-400">Review and moderate user comments across posts and reels.</p>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-sm font-medium text-gray-400">User</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-400">Comment</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-400">Source</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-400">Flags</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-400">Date</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {comments.map((comment: any) => (
                <tr key={`${comment.source}-${comment.id}`} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                        {comment.username[0].toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{comment.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-300 max-w-md truncate">{comment.content}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                      comment.source === 'post' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                    }`}>
                      {comment.source.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {comment.is_flagged ? (
                      <span className="flex items-center gap-1.5 text-amber-500 text-xs font-medium bg-amber-500/10 px-2 py-1 rounded-md">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        FLAGGED
                      </span>
                    ) : (
                      <span className="text-gray-500 text-xs">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                    {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(comment.created_at))}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {comment.is_flagged && (
                        <button
                          onClick={() => moderateMutation.mutate({ commentId: comment.id, source: comment.source, action: 'approve' })}
                          className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <CheckCircle className="w-4.5 h-4.5" />
                        </button>
                      )}
                      <button
                        onClick={() => moderateMutation.mutate({ commentId: comment.id, source: comment.source, action: 'delete' })}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:bg-white/10 rounded-lg transition-colors">
                        <ExternalLink className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {comments.length === 0 && (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No comments found to moderate.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Comments;
