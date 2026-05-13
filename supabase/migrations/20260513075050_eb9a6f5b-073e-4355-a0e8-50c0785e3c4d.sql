
-- ============ ENUMS ============
CREATE TYPE public.gender_t AS ENUM ('male', 'female', 'non_binary', 'other');
CREATE TYPE public.relationship_goal_t AS ENUM ('serious', 'marriage', 'friendship', 'casual', 'open');
CREATE TYPE public.tribe_importance_t AS ENUM ('very_important', 'somewhat_important', 'not_important', 'open_to_all');
CREATE TYPE public.like_status_t AS ENUM ('pending', 'matched', 'rejected');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  gender public.gender_t,
  date_of_birth DATE,
  bio TEXT,
  region TEXT,
  town TEXT,
  nationality TEXT DEFAULT 'Namibian',
  tribe TEXT,
  languages TEXT[] DEFAULT '{}',
  religion TEXT,
  education TEXT,
  occupation TEXT,
  hobbies TEXT[] DEFAULT '{}',
  lifestyle TEXT[] DEFAULT '{}',
  relationship_goal public.relationship_goal_t,
  photos TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  profile_completed BOOLEAN NOT NULL DEFAULT false,
  last_active TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- ============ PREFERENCES ============
CREATE TABLE public.preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_gender public.gender_t,
  min_age INT NOT NULL DEFAULT 18,
  max_age INT NOT NULL DEFAULT 60,
  preferred_regions TEXT[] DEFAULT '{}',
  preferred_languages TEXT[] DEFAULT '{}',
  preferred_tribes TEXT[] DEFAULT '{}',
  tribe_importance public.tribe_importance_t DEFAULT 'open_to_all',
  preferred_relationship_goal public.relationship_goal_t,
  preferred_hobbies TEXT[] DEFAULT '{}',
  open_to_long_distance BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON public.preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============ LIKES ============
CREATE TABLE public.profile_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.like_status_t NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (from_user_id, to_user_id),
  CHECK (from_user_id <> to_user_id)
);

ALTER TABLE public.profile_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view likes they sent or received"
  ON public.profile_likes FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send likes"
  ON public.profile_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can delete their sent likes"
  ON public.profile_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = from_user_id);

CREATE INDEX idx_likes_to_user ON public.profile_likes(to_user_id);
CREATE INDEX idx_likes_from_user ON public.profile_likes(from_user_id);

-- ============ CONVERSATIONS ============
-- canonical pair: user_a < user_b lex order to dedupe
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_a, user_b),
  CHECK (user_a < user_b)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Participants can create conversations"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Participants can update conversations"
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE INDEX idx_conv_user_a ON public.conversations(user_a);
CREATE INDEX idx_conv_user_b ON public.conversations(user_b);

-- ============ MESSAGES ============
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- helper: is current user a participant of given conversation?
CREATE OR REPLACE FUNCTION public.is_conv_participant(_conv UUID, _uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = _conv AND (_uid = c.user_a OR _uid = c.user_b)
  );
$$;

CREATE POLICY "Participants can view messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (public.is_conv_participant(conversation_id, auth.uid()));

CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_conv_participant(conversation_id, auth.uid())
  );

CREATE POLICY "Sender or recipient can mark messages read"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (public.is_conv_participant(conversation_id, auth.uid()));

CREATE INDEX idx_messages_conv ON public.messages(conversation_id, created_at DESC);

-- ============ NEW USER TRIGGER ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ UPDATED_AT TRIGGERS ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_preferences_updated BEFORE UPDATE ON public.preferences
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_likes;

-- ============ STORAGE: profile-photos bucket ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view profile photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload own photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
