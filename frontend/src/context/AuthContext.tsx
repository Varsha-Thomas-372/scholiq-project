import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../api/supabase";
import { createProfile } from "../api/backend";
import { UserRole } from "../types";

interface Profile {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const activeUser = sessionData.session?.user ?? null;
    setUser(activeUser);
    if (!activeUser) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase.from("users").select("*").eq("id", activeUser.id).maybeSingle();
    if (error) {
      throw error;
    }
    if (data) {
      setProfile(data as Profile);
      return;
    }

    const pendingRole = localStorage.getItem("scholiq_pending_role");
    const pendingName = localStorage.getItem("scholiq_pending_name");
    const role: UserRole = pendingRole === "FACULTY" ? "FACULTY" : "STUDENT";
    await createProfile({
      user_id: activeUser.id,
      email: activeUser.email ?? "",
      role,
      name: (activeUser.user_metadata?.full_name as string) || pendingName || undefined
    });
    localStorage.removeItem("scholiq_pending_role");
    localStorage.removeItem("scholiq_pending_name");
    const { data: created } = await supabase.from("users").select("*").eq("id", activeUser.id).single();
    if (created) {
      setProfile(created as Profile);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (!nextSession) {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    refreshProfile().catch(() => undefined);
  }, [user?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const value = useMemo(
    () => ({ session, user, profile, loading, refreshProfile, signOut }),
    [session, user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
