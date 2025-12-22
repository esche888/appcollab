-- Create best_practice_requests table
CREATE TABLE IF NOT EXISTS public.best_practice_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.best_practice_requests ENABLE ROW LEVEL SECURITY;

-- Policies for requests
CREATE POLICY "Requests are viewable by everyone"
  ON public.best_practice_requests
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create requests"
  ON public.best_practice_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requests"
  ON public.best_practice_requests
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own requests"
  ON public.best_practice_requests
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for timestamps
CREATE TRIGGER handle_best_practice_requests_updated_at
  BEFORE UPDATE ON public.best_practice_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Table for tracking votes on requests (to prevent double voting)
CREATE TABLE IF NOT EXISTS public.best_practice_request_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.best_practice_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')), -- Keeping generic, though simple upvote usually implies just 'up'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(request_id, user_id)
);

ALTER TABLE public.best_practice_request_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Request votes are viewable by everyone"
  ON public.best_practice_request_votes
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote on requests"
  ON public.best_practice_request_votes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own request votes"
  ON public.best_practice_request_votes
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own request votes"
  ON public.best_practice_request_votes
  FOR DELETE
  USING (auth.uid() = user_id);
