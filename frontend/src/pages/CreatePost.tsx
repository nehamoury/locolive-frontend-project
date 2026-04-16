import { type FC } from 'react';
import { Camera, MapPin, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const CreatePost: FC = () => {
  return (
    <div className="min-h-screen bg-[#f9e8ff] text-black p-6">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Create New Post</h1>
          <button className="p-2 hover:bg-black/5 rounded-full text-black/40 hover:text-black transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="aspect-square w-full rounded-2xl bg-primary/5 border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-primary/10 transition-colors">
          <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center">
            <Camera className="w-8 h-8 text-purple-500" />
          </div>
          <div className="text-center">
            <p className="font-bold text-black">Take a photo or video</p>
            <p className="text-sm text-black/40">or click to upload from gallery</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-black/60 uppercase tracking-widest">Caption</label>
            <textarea 
              className="w-full h-32 bg-primary/5 border border-primary/10 rounded-xl p-4 text-black focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-black/20"
              placeholder="Write a caption..."
            ></textarea>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-black/60 uppercase tracking-widest">Location</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" />
              <Input className="pl-12" placeholder="Add location..." />
            </div>
          </div>

          <Button className="w-full py-4 text-lg mt-4">
            Post Story
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
