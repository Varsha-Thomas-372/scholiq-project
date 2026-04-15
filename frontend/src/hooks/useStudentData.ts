import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../api/supabase";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { ParsedSyllabus, ScheduleItem, TopicRow } from "../types";

export interface SyllabusLibraryItem {
  id: string;
  subject: string;
  uploaded_at: string;
  topicCount: number;
}

export function useStudentData() {
  const { user } = useAuth();
  const { setCritical } = useTheme();
  const [syllabusId, setSyllabusId] = useState<string | null>(null);
  const [syllabus, setSyllabus] = useState<ParsedSyllabus | null>(null);
  const [syllabusLibrary, setSyllabusLibrary] = useState<SyllabusLibraryItem[]>([]);
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [allTopics, setAllTopics] = useState<TopicRow[]>([]);
  const [schedule, setSchedule] = useState<{ exam_date: string; daily_hours: number; plan_json: ScheduleItem[]; updated_at: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingSyllabusId, setDeletingSyllabusId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    
    // Fetch all syllabuses for this user
    const { data: allSyllabi } = await supabase
      .from("syllabi")
      .select("id,subject,uploaded_at")
      .eq("user_id", user.id)
      .order("uploaded_at", { ascending: false });
    
    const syllabusLibrary = (allSyllabi ?? []).map((s) => ({
      id: s.id,
      subject: s.subject,
      uploaded_at: s.uploaded_at,
      topicCount: 0,
    }));
    setSyllabusLibrary(syllabusLibrary);
    
    // Set active syllabus to the most recent
    const activeSyllabusData = (allSyllabi ?? [])[0] ?? null;
    setSyllabusId(activeSyllabusData?.id ?? null);

    if (activeSyllabusData) {
      // Fetch full syllabus data
      const { data: fullSyllabusRows } = await supabase
        .from("syllabi")
        .select("id,subject,parsed_json,raw_text")
        .eq("id", activeSyllabusData.id)
        .single();
      
      if (fullSyllabusRows) {
        setSyllabus({
          subject: fullSyllabusRows.subject,
          units: fullSyllabusRows.parsed_json.units,
          raw_text: fullSyllabusRows.raw_text,
        });
      }

      // Fetch all topics from ALL syllabuses for global metrics
      const allSyllabusIds = (allSyllabi ?? []).map(s => s.id).join(',');
      let allTopicRows: any[] = [];
      if (allSyllabusIds) {
        const { data: topicsData } = await supabase
          .from("topics")
          .select("*")
          .in("syllabus_id", (allSyllabi ?? []).map(s => s.id));
        allTopicRows = topicsData || [];
      }
      
      // Fetch topics for active syllabus
      const { data: activeSyllabusTopics } = await supabase
        .from("topics")
        .select("*")
        .eq("syllabus_id", activeSyllabusData.id)
        .order("unit");
      
      setTopics((activeSyllabusTopics ?? []) as TopicRow[]);
      
      // Store all topics from all syllabuses for global metrics
      setAllTopics(allTopicRows as TopicRow[]);
      
      // Update library with topic counts
      setSyllabusLibrary((prev) =>
        prev.map((item) => {
          const count = allTopicRows.filter(t => t.syllabus_id === item.id).length;
          return { ...item, topicCount: count };
        })
      );
      
      // Fetch schedule (common across all syllabuses)
      const { data: scheduleRows } = await supabase
        .from("schedules")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1);
      
      const latest = scheduleRows?.[0];
      if (latest) {
        setSchedule({ exam_date: latest.exam_date, daily_hours: latest.daily_hours, plan_json: latest.plan_json ?? [], updated_at: latest.updated_at });
      } else {
        setSchedule(null);
      }
    } else {
      setSyllabus(null);
      setTopics([]);
      setAllTopics([]);
      setSchedule(null);
    }
    setLoading(false);
  }, [user?.id]);

  const deleteSyllabus = useCallback(async (syllabusId: string) => {
    if (!user) return;
    setLoading(true);
    setDeletingSyllabusId(syllabusId);
    try {
      const result = await import("../api/backend").then((mod) => mod.deleteSyllabus(syllabusId, user.id));
      if (!result.ok) {
        throw new Error("Delete failed on backend.");
      }
      await loadData();
    } catch (error: any) {
      console.error("Delete syllabus failed", error);
      window.alert(`Unable to delete syllabus: ${error.message || error}`);
    } finally {
      setDeletingSyllabusId(null);
      setLoading(false);
    }
  }, [loadData, user]);

  const switchSyllabus = useCallback(async (newSyllabusId: string) => {
    setSyllabusId(newSyllabusId);
    if (user) {
      const { data: fullSyllabusRows } = await supabase
        .from("syllabi")
        .select("id,subject,parsed_json,raw_text")
        .eq("id", newSyllabusId)
        .single();
      
      if (fullSyllabusRows) {
        setSyllabus({
          subject: fullSyllabusRows.subject,
          units: fullSyllabusRows.parsed_json.units,
          raw_text: fullSyllabusRows.raw_text,
        });
      }

      const { data: topicRows } = await supabase
        .from("topics")
        .select("*")
        .eq("syllabus_id", newSyllabusId)
        .order("unit");
      
      setTopics((topicRows ?? []) as TopicRow[]);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData().catch(() => setLoading(false));
  }, [loadData]);

  useEffect(() => {
    if (!schedule?.exam_date) {
      setCritical(false);
      return;
    }
    const diff = Math.ceil((new Date(schedule.exam_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    setCritical(diff >= 0 && diff <= 7);
  }, [schedule?.exam_date]);

  const completion = useMemo(() => {
    if (!allTopics.length) return 0;
    const done = allTopics.filter((t) => t.status === "done").length;
    return Math.round((done / allTopics.length) * 100);
  }, [allTopics]);

  return { loading, syllabusId, syllabus, syllabusLibrary, topics, allTopics, schedule, completion, refresh: loadData, switchSyllabus, deleteSyllabus, deletingSyllabusId };
}
