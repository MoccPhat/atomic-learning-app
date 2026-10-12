import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  Coffee,
  Brain,
  TreePine,
  Clock,
  BookOpen,
  Settings,
  Bell,
  Sliders,
  Music,
  ExternalLink,
  Eye,
  EyeOff,
  Plus,
  Upload,
  Trash2,
  Headphones,
  Disc,
  Radio,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  PomodoroMode,
  PomodoroSettings,
  PomodoroStats,
  AmbientSoundType,
  PomodoroSession,
  LofiTrack,
  TRIPLEG_TRACKS,
} from '../../lib/pomodoro-types';
import {
  getPomodoroSettings,
  savePomodoroSettings,
  getPomodoroStats,
  recordCompletedPomodoro,
  getRecentPomodoroSessions,
} from '../../lib/pomodoro-storage';
import { ambientSound } from '../../lib/ambient-sound';
import {
  lofiOfflineEngine,
  OFFLINE_LOFI_TRACKS,
  OfflineLofiTrackInfo,
} from '../../lib/lofi-offline-engine';
import {
  getAllOfflineAudios,
  saveOfflineAudio,
  deleteOfflineAudio,
  CustomOfflineAudioFile,
} from '../../lib/offline-audio-storage';
import { TreeData } from '../../lib/tree-types';
import { FocusGarden } from './FocusGarden';
import { plantCompletedTree } from '../../lib/focus-garden-storage';
import { TreeSpecies } from '../../lib/focus-garden-types';
import { FocusPetCompanion } from './FocusPetCompanion';
import { FocusPetPlayground } from './FocusPetPlayground';
import { FocusPetHouse } from './FocusPetHouse';
import { rewardFocusMinutes } from '../../lib/focus-pet-storage';

interface PomodoroTimerProps {
  treeData?: TreeData;
  onActivityLogged?: () => void;
  compact?: boolean;
}

type AudioSourceTab = 'lofiOffline' | 'myFiles' | 'ambient' | 'youtube';

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  treeData,
  onActivityLogged,
}) => {
  const [settings, setSettings] = useState<PomodoroSettings>(getPomodoroSettings);
  const [stats, setStats] = useState<PomodoroStats>(getPomodoroStats);
  const [recentSessions, setRecentSessions] = useState<PomodoroSession[]>(getRecentPomodoroSessions);

  // Chế độ xem: 'timer' (Đồng hồ & Lofi), 'garden' (Khu vườn) hoặc 'pet' (Thú cưng)
  const [viewTab, setViewTab] = useState<'timer' | 'garden' | 'pet'>('timer');
  const [selectedSpecies, setSelectedSpecies] = useState<TreeSpecies>('oak');

  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(settings.focusDurationMin * 60);
  const [baseDurationSec, setBaseDurationSec] = useState<number>(settings.focusDurationMin * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [cycleCount, setCycleCount] = useState<number>(1);

  // Môn học & Tuần học đang tập trung
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedWeekId, setSelectedWeekId] = useState<string>('');

  // Tùy chỉnh số phút linh hoạt trực tiếp
  const [customInputMinutes, setCustomInputMinutes] = useState<string>('');
  const [isCustomInputOpen, setIsCustomInputOpen] = useState<boolean>(false);

  // Modal cài đặt thời gian mặc định
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customFocusMin, setCustomFocusMin] = useState(settings.focusDurationMin);
  const [customBreakMin, setCustomBreakMin] = useState(settings.shortBreakDurationMin);

  // Toast thông báo thao tác thành công
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // TRẠM ÂM NHẠC & LOFI (4 TABS)
  const [audioTab, setAudioTab] = useState<AudioSourceTab>('lofiOffline');

  // Tab 1: Lofi Offline (Web Audio Engine)
  const [selectedOfflineTrack, setSelectedOfflineTrack] = useState<OfflineLofiTrackInfo>(
    OFFLINE_LOFI_TRACKS[0]
  );
  const [isPlayingOfflineLofi, setIsPlayingOfflineLofi] = useState<boolean>(false);
  const [offlineLofiVolume, setOfflineLofiVolume] = useState<number>(0.6);

  // Tab 2: Nhạc của tôi (IndexedDB Offline Storage)
  const [myAudioFiles, setMyAudioFiles] = useState<CustomOfflineAudioFile[]>([]);
  const [selectedMyAudioId, setSelectedMyAudioId] = useState<string>('');
  const [isPlayingMyAudio, setIsPlayingMyAudio] = useState<boolean>(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState<boolean>(false);
  const myAudioElementRef = useRef<HTMLAudioElement | null>(null);

  // Tab 3: Âm thanh nền thiên nhiên Offline
  const [ambientType, setAmbientType] = useState<AmbientSoundType>('none');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.5);

  // Tab 4: YouTube Stream @triplegdot
  const [lofiTracks, setLofiTracks] = useState<LofiTrack[]>(TRIPLEG_TRACKS);
  const [selectedLofiTrack, setSelectedLofiTrack] = useState<LofiTrack | null>(TRIPLEG_TRACKS[0]);
  const [isPlayingYtLofi, setIsPlayingYtLofi] = useState<boolean>(false);
  const [showVideo, setShowVideo] = useState<boolean>(true);
  const [customYtInput, setCustomYtInput] = useState<string>('');

  const timerRef = useRef<number | null>(null);

  // Lấy danh sách tất cả môn học và tuần
  const allSubjects = treeData ? treeData.groups.flatMap((g) => g.subjects) : [];
  const currentSubject = allSubjects.find((s) => s.id === selectedSubjectId);
  const availableWeeks = currentSubject?.weeks || [];

  // Tải danh sách file nhạc cá nhân đã lưu trong IndexedDB khi khởi chạy
  useEffect(() => {
    getAllOfflineAudios().then((files) => {
      setMyAudioFiles(files);
      if (files.length > 0 && !selectedMyAudioId) {
        setSelectedMyAudioId(files[0].id);
      }
    });
  }, []);

  // Tắt tất cả các nguồn âm thanh khác khi bật 1 nguồn
  const stopAllOtherAudios = (except: AudioSourceTab) => {
    if (except !== 'lofiOffline' && isPlayingOfflineLofi) {
      lofiOfflineEngine.stop();
      setIsPlayingOfflineLofi(false);
    }
    if (except !== 'myFiles' && isPlayingMyAudio) {
      if (myAudioElementRef.current) {
        myAudioElementRef.current.pause();
      }
      setIsPlayingMyAudio(false);
    }
    if (except !== 'ambient' && ambientType !== 'none') {
      ambientSound.stop();
      setAmbientType('none');
    }
    if (except !== 'youtube' && isPlayingYtLofi) {
      setIsPlayingYtLofi(false);
    }
  };

  // Đổi mode
  const switchMode = (newMode: PomodoroMode, autoStart = false) => {
    setIsRunning(false);
    setMode(newMode);
    let seconds = settings.focusDurationMin * 60;
    if (newMode === 'shortBreak') seconds = settings.shortBreakDurationMin * 60;
    if (newMode === 'longBreak') seconds = settings.longBreakDurationMin * 60;
    setBaseDurationSec(seconds);
    setTimeLeft(seconds);

    if (autoStart) {
      setTimeout(() => setIsRunning(true), 100);
    }
  };

  // Điều chỉnh tăng/giảm số phút trực tiếp trên đồng hồ (+/- 1 phút, +/- 5 phút)
  const handleAdjustMinutes = (deltaMinutes: number) => {
    const deltaSec = deltaMinutes * 60;
    const newTime = Math.max(60, Math.min(180 * 60, timeLeft + deltaSec));
    setTimeLeft(newTime);
    if (!isRunning) {
      setBaseDurationSec(newTime);
    }
  };

  // Áp dụng Preset thời lượng nhanh (15p, 25p, 45p, 60p, 90p)
  const handleApplyPreset = (minutes: number) => {
    const sec = minutes * 60;
    setBaseDurationSec(sec);
    setTimeLeft(sec);
    if (mode === 'focus') {
      const updated: PomodoroSettings = {
        ...settings,
        focusDurationMin: minutes,
      };
      savePomodoroSettings(updated);
      setSettings(updated);
    }
  };

  // Đặt thời gian học tùy ý do người dùng nhập
  const handleApplyCustomMinutes = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customInputMinutes.trim(), 10);
    if (val && val >= 1 && val <= 240) {
      handleApplyPreset(val);
      setIsCustomInputOpen(false);
      setCustomInputMinutes('');
    }
  };

  // Hoàn thành phiên hiện tại
  const handleSessionComplete = () => {
    setIsRunning(false);

    // Phát chuông thiền kết thúc
    if (settings.soundEnabled) {
      ambientSound.playCompletionChime();
    }

    if (mode === 'focus') {
      const subj = allSubjects.find((s) => s.id === selectedSubjectId);
      const wk = availableWeeks.find((w) => w.id === selectedWeekId);

      const actualMinutes = Math.round(baseDurationSec / 60);

      // Trồng cây vào Khu Vườn Tập Trung (Virtual Focus Garden)
      plantCompletedTree(actualMinutes, subj?.name, selectedSpecies);

      // Thưởng EXP & Hạt thức ăn cho Thú Cưng Học Tập (Focus Pet)
      const petReward = rewardFocusMinutes(actualMinutes);
      if (petReward.leveledUp) {
        showToast(`🎉 Thú cưng đã lên Cấp ${petReward.newLevel}! Nhận thêm +${petReward.treatsEarned} hạt thức ăn! 🐾`);
      } else {
        showToast(`Tuyệt vời! Hoàn thành phiên, nhận +${petReward.treatsEarned} hạt thức ăn nuôi Thú Cưng! 🐾`);
      }

      const { updatedStats } = recordCompletedPomodoro({
        mode: 'focus',
        durationMinutes: actualMinutes,
        subjectId: selectedSubjectId || undefined,
        subjectName: subj?.name,
        weekId: selectedWeekId || undefined,
        weekTitle: wk?.title,
      });

      setStats(updatedStats);
      setRecentSessions(getRecentPomodoroSessions());

      if (onActivityLogged) onActivityLogged();

      // Chuyển sang nghỉ ngắn hoặc nghỉ dài
      const nextCycle = cycleCount + 1;
      setCycleCount(nextCycle);
      if (nextCycle % settings.longBreakInterval === 0) {
        switchMode('longBreak', settings.autoStartBreaks);
      } else {
        switchMode('shortBreak', settings.autoStartBreaks);
      }
    } else {
      // Kết thúc giờ nghỉ, quay lại tập trung
      switchMode('focus', settings.autoStartFocus);
    }
  };

  // Đồng hồ đếm ngược mỗi giây
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, settings, cycleCount, selectedSubjectId, selectedWeekId, baseDurationSec]);

  // Xử lý Lofi Offline Engine (Tab 1)
  const handleToggleOfflineLofi = (track?: OfflineLofiTrackInfo) => {
    const targetTrack = track || selectedOfflineTrack;
    if (track) {
      setSelectedOfflineTrack(track);
    }

    if (isPlayingOfflineLofi && (!track || track.id === selectedOfflineTrack.id)) {
      lofiOfflineEngine.stop();
      setIsPlayingOfflineLofi(false);
    } else {
      stopAllOtherAudios('lofiOffline');
      lofiOfflineEngine.playTrack(targetTrack.id);
      lofiOfflineEngine.setVolume(offlineLofiVolume);
      setIsPlayingOfflineLofi(true);
    }
  };

  const handleOfflineLofiVolume = (vol: number) => {
    setOfflineLofiVolume(vol);
    lofiOfflineEngine.setVolume(vol);
  };

  // Xử lý Nhạc của tôi (Tab 2)
  const handleUploadAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingAudio(true);
    try {
      const file = files[0];
      const saved = await saveOfflineAudio(file);
      setMyAudioFiles((prev) => [saved, ...prev]);
      setSelectedMyAudioId(saved.id);
    } catch (err) {
      console.warn('Lỗi lưu audio offline:', err);
    } finally {
      setIsUploadingAudio(false);
      e.target.value = '';
    }
  };

  const handleDeleteAudio = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetFile = myAudioFiles.find((a) => a.id === id);
    const audioName = targetFile?.name || 'bài hát';
    await deleteOfflineAudio(id);
    setMyAudioFiles((prev) => prev.filter((a) => a.id !== id));
    if (selectedMyAudioId === id) {
      if (myAudioElementRef.current) myAudioElementRef.current.pause();
      setIsPlayingMyAudio(false);
      setSelectedMyAudioId('');
    }
    showToast(`Đã xóa bài hát "${audioName}" thành công!`);
  };

  const handleTogglePlayMyAudio = (id?: string) => {
    const targetId = id || selectedMyAudioId;
    if (!targetId) return;

    if (id) setSelectedMyAudioId(id);

    if (isPlayingMyAudio && targetId === selectedMyAudioId) {
      if (myAudioElementRef.current) myAudioElementRef.current.pause();
      setIsPlayingMyAudio(false);
    } else {
      stopAllOtherAudios('myFiles');
      setTimeout(() => {
        if (myAudioElementRef.current) {
          myAudioElementRef.current.play().catch(console.warn);
          setIsPlayingMyAudio(true);
        }
      }, 50);
    }
  };

  // Xử lý Thiên nhiên Offline (Tab 3)
  const handleSoundChange = (type: AmbientSoundType) => {
    setAmbientType(type);
    if (type !== 'none') {
      stopAllOtherAudios('ambient');
    }
    ambientSound.play(type, ambientVolume);
  };

  const handleAmbientVolumeChange = (newVol: number) => {
    setAmbientVolume(newVol);
    ambientSound.setVolume(newVol);
  };

  // Xử lý YouTube Stream @triplegdot (Tab 4)
  const handleSelectYtLofiTrack = (track: LofiTrack) => {
    setSelectedLofiTrack(track);
    stopAllOtherAudios('youtube');
    setIsPlayingYtLofi(true);
  };

  const handleToggleYtLofiPlay = () => {
    const nextState = !isPlayingYtLofi;
    if (nextState) {
      stopAllOtherAudios('youtube');
    }
    setIsPlayingYtLofi(nextState);
  };

  const extractYoutubeId = (input: string): string | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = trimmed.match(regExp);
    if (match && match[2].length === 11) return match[2];
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    return null;
  };

  const handleAddCustomYtTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractYoutubeId(customYtInput);
    if (!id) return;

    const newTrack: LofiTrack = {
      id: `custom-${Date.now()}`,
      title: `Nhạc tùy chọn (${id})`,
      videoId: id,
      tag: 'YouTube Link 🎵',
      duration: 'Mix',
    };

    setLofiTracks((prev) => [newTrack, ...prev]);
    setSelectedLofiTrack(newTrack);
    stopAllOtherAudios('youtube');
    setIsPlayingYtLofi(true);
    setCustomYtInput('');
  };

  // Dọn dẹp âm thanh khi unmount
  useEffect(() => {
    return () => {
      ambientSound.stop();
      lofiOfflineEngine.stop();
      if (myAudioElementRef.current) myAudioElementRef.current.pause();
    };
  }, []);

  // Format phút:giây
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Tính phần trăm tiến trình vòng tròn
  const progressPercent = Math.max(
    0,
    Math.min(100, ((baseDurationSec - timeLeft) / baseDurationSec) * 100)
  );
  const strokeDashoffset = 283 - (283 * progressPercent) / 100;

  // Lưu cài đặt thời gian mặc định
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PomodoroSettings = {
      ...settings,
      focusDurationMin: Math.max(1, Math.min(180, customFocusMin)),
      shortBreakDurationMin: Math.max(1, Math.min(60, customBreakMin)),
    };
    savePomodoroSettings(updated);
    setSettings(updated);
    setIsSettingsOpen(false);
    if (!isRunning) {
      const newSec =
        mode === 'focus' ? updated.focusDurationMin * 60 : updated.shortBreakDurationMin * 60;
      setBaseDurationSec(newSec);
      setTimeLeft(newSec);
    }
  };

  const selectedMyAudio = myAudioFiles.find((a) => a.id === selectedMyAudioId);

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm text-left relative overflow-hidden transition-all">
      {/* Toast Notification khi xóa hoặc thao tác */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-3.5 px-4 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Background Ambient Glow */}
      <div
        className={`absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ${
          mode === 'focus'
            ? 'bg-rose-500/10 dark:bg-rose-500/15'
            : mode === 'shortBreak'
            ? 'bg-emerald-500/10 dark:bg-emerald-500/15'
            : 'bg-indigo-500/10 dark:bg-indigo-500/15'
        }`}
      />

      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <span
            className={`p-2.5 rounded-2xl shadow-xs transition-colors ${
              mode === 'focus'
                ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400'
                : mode === 'shortBreak'
                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400'
                : 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
            }`}
          >
            <Clock className="w-5 h-5" />
          </span>
          <div>
            <h2 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
              Không Gian Tập Trung
            </h2>
          </div>
        </div>

        {/* Switcher giữa Đồng hồ & Khu vườn tập trung */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              onClick={() => setViewTab('timer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewTab === 'timer'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Đồng hồ & Nhạc</span>
            </button>
            <button
              onClick={() => setViewTab('garden')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewTab === 'garden'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <TreePine className="w-3.5 h-3.5 text-emerald-500" />
              <span>Khu vườn (Garden)</span>
            </button>
            <button
              onClick={() => setViewTab('pet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewTab === 'pet'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span className="text-xs">🐾</span>
              <span>Thú cưng (Pet)</span>
            </button>
          </div>

          {/* Nút Cài đặt mặc định */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Cài đặt mặc định phiên Pomodoro"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cài đặt</span>
          </button>
        </div>
      </div>

      {viewTab === 'pet' ? (
        <FocusPetHouse onBackToTimer={() => setViewTab('timer')} />
      ) : viewTab === 'garden' ? (
        <FocusGarden
          currentProgress={progressPercent}
          isTimerRunning={isRunning}
          activeSubjectName={allSubjects.find((s) => s.id === selectedSubjectId)?.name}
          selectedSpecies={selectedSpecies}
          onSelectSpecies={setSelectedSpecies}
        />
      ) : (
        /* Main Spacious Grid: 2 Cột Rộng Rãi Cân Đối */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start relative z-10">
        {/* ========================================================= */}
        {/* CỘT TRÁI (XL: COL 6) - PHÒNG TẬP TRUNG & ĐỒNG HỒ ĐẾM NGƯỢC */}
        {/* ========================================================= */}
        <div className="xl:col-span-6 flex flex-col items-center justify-center p-5 sm:p-7 rounded-3xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 space-y-6">
          {/* Mode Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl text-xs font-bold shadow-xs w-full max-w-md">
            <button
              onClick={() => switchMode('focus')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                mode === 'focus'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>Tập trung</span>
            </button>
            <button
              onClick={() => switchMode('shortBreak')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                mode === 'shortBreak'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Coffee className="w-4 h-4" />
              <span>Nghỉ ngắn</span>
            </button>
            <button
              onClick={() => switchMode('longBreak')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                mode === 'longBreak'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <TreePine className="w-4 h-4" />
              <span>Nghỉ dài</span>
            </button>
          </div>

          {/* Vòng Tròn Đếm Ngược Lớn (Immersive Clock) */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-88 md:h-88 flex items-center justify-center my-1">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              {/* Vòng nền mờ */}
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-slate-200/80 dark:stroke-slate-800 fill-none"
                strokeWidth="5"
              />
              {/* Vòng tiến trình động */}
              <circle
                cx="50"
                cy="50"
                r="45"
                className={`fill-none transition-all duration-1000 ease-linear ${
                  mode === 'focus'
                    ? 'stroke-rose-500'
                    : mode === 'shortBreak'
                    ? 'stroke-emerald-500'
                    : 'stroke-indigo-500'
                }`}
                strokeWidth="5"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>

            {/* Chữ số đếm ngược ở trung tâm */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <span
                className={`text-[11px] font-extrabold uppercase tracking-widest px-3 py-0.5 rounded-full mb-1 ${
                  mode === 'focus'
                    ? 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/70'
                    : mode === 'shortBreak'
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/70'
                    : 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/70'
                }`}
              >
                {mode === 'focus' ? `Phiên #${cycleCount} • ${Math.round(baseDurationSec / 60)} phút` : 'Giải lao'}
              </span>

              <span className="font-mono text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-xs my-1 select-none">
                {formatTime(timeLeft)}
              </span>

              {/* Bộ Nút Stepper Tinh Chỉnh Nhanh Trực Tiếp (-5p, -1p, +1p, +5p) */}
              <div className="flex items-center gap-1.5 mt-2 bg-white/80 dark:bg-slate-900/80 p-1 rounded-xl shadow-xs border border-slate-200/60 dark:border-slate-800">
                <button
                  onClick={() => handleAdjustMinutes(-5)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Giảm 5 phút"
                >
                  -5p
                </button>
                <button
                  onClick={() => handleAdjustMinutes(-1)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Giảm 1 phút"
                >
                  -1p
                </button>
                <span className="text-[10px] font-mono text-slate-400 px-1">Tùy biến</span>
                <button
                  onClick={() => handleAdjustMinutes(1)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Tăng 1 phút"
                >
                  +1p
                </button>
                <button
                  onClick={() => handleAdjustMinutes(5)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Tăng 5 phút"
                >
                  +5p
                </button>
              </div>
            </div>
          </div>

          {/* Hàng Nút Preset Thời Lượng Học & Ô Nhập Phút Tùy Ý */}
          <div className="w-full max-w-md space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 px-1">
              <span>Mốc thời gian học nhanh:</span>
              <button
                type="button"
                onClick={() => setIsCustomInputOpen(!isCustomInputOpen)}
                className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline font-bold"
              >
                {isCustomInputOpen ? 'Đóng ô nhập' : '+ Nhập số phút tùy ý'}
              </button>
            </div>

            {/* Presets 15p, 25p, 45p, 60p, 90p */}
            <div className="grid grid-cols-5 gap-1.5">
              {[15, 25, 45, 60, 90].map((m) => {
                const isSelected = Math.round(baseDurationSec / 60) === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleApplyPreset(m)}
                    className={`py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                      isSelected
                        ? 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/25'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {m}p
                  </button>
                );
              })}
            </div>

            {/* Ô nhập số phút tùy ý */}
            {isCustomInputOpen && (
              <form onSubmit={handleApplyCustomMinutes} className="flex gap-2 pt-1">
                <input
                  type="number"
                  min="1"
                  max="240"
                  placeholder="Nhập số phút (1 - 240)..."
                  value={customInputMinutes}
                  onChange={(e) => setCustomInputMinutes(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!customInputMinutes.trim()}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  Áp dụng
                </button>
              </form>
            )}
          </div>

          {/* Action Buttons: Play/Pause, Reset, Skip */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => {
                setTimeLeft(baseDurationSec);
                setIsRunning(false);
              }}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all shadow-xs border border-slate-200/80 dark:border-slate-800"
              title="Đặt lại thời gian"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-2.5 px-10 py-4 rounded-2xl text-white font-black text-base shadow-xl transition-all active:scale-95 ${
                mode === 'focus'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/30'
                  : mode === 'shortBreak'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Tạm dừng</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Bắt đầu phiên</span>
                </>
              )}
            </button>

            <button
              onClick={handleSessionComplete}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all shadow-xs border border-slate-200/80 dark:border-slate-800"
              title="Bỏ qua / Hoàn thành sớm"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Gắn với Môn học & Tuần học */}
          {allSubjects.length > 0 && (
            <div className="w-full max-w-md p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-brand-500" />
                  <span>Gắn với Môn học đang ôn:</span>
                </span>
                {selectedSubjectId && (
                  <button
                    onClick={() => {
                      setSelectedSubjectId('');
                      setSelectedWeekId('');
                    }}
                    className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Bỏ chọn
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    setSelectedWeekId('');
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="">(Chọn môn học)</option>
                  {allSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                {availableWeeks.length > 0 && (
                  <select
                    value={selectedWeekId}
                    onChange={(e) => setSelectedWeekId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="">(Chọn tuần học)</option>
                    {availableWeeks.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          {/* Thú cưng đồng hành học tập (Bảng điều khiển & tương tác nhanh) */}
          <FocusPetCompanion
            isTimerRunning={isRunning}
            timerMode={mode}
            onOpenPetHouse={() => setViewTab('pet')}
            className="w-full max-w-md"
          />
        </div>

        {/* ========================================================= */}
        {/* CỘT PHẢI (XL: COL 6) - TRẠM ÂM NHẠC TOÀN DIỆN & THỐNG KÊ */}
        {/* ========================================================= */}
        <div className="xl:col-span-6 space-y-6">
          {/* Card Trạm Âm Thanh Đa Năng */}
          <div className="p-5 rounded-3xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            {/* Header Tabs Chọn Nguồn Âm Nhạc */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/80 pb-3">
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/70 dark:bg-slate-900 p-1 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAudioTab('lofiOffline')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                    audioTab === 'lofiOffline'
                      ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Lofi Offline</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 font-extrabold uppercase">
                    Không Cần Mạng
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAudioTab('myFiles')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                    audioTab === 'myFiles'
                      ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Disc className="w-3.5 h-3.5" />
                  <span>Nhạc Của Tôi</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-brand-100 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 font-extrabold uppercase">
                    {myAudioFiles.length} bài
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAudioTab('ambient')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                    audioTab === 'ambient'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Thiên nhiên</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAudioTab('youtube')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                    audioTab === 'youtube'
                      ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>YouTube Stream</span>
                </button>
              </div>

              {audioTab === 'ambient' && (
                <button
                  type="button"
                  onClick={() => ambientSound.playCompletionChime()}
                  className="text-[11px] text-brand-600 dark:text-brand-400 font-bold hover:underline flex items-center gap-1"
                  title="Nghe thử tiếng chuông thiền kết thúc"
                >
                  <Bell className="w-3 h-3" />
                  <span>Thử chuông</span>
                </button>
              )}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* TAB 1: LOFI OFFLINE ENGINE (WEB AUDIO - KHÔNG CẦN INTERNET)   */}
            {/* ------------------------------------------------------------- */}
            {audioTab === 'lofiOffline' && (
              <div className="space-y-4">
                {/* Now Playing Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-pink-500/10 border border-rose-200/80 dark:border-rose-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="p-2.5 rounded-2xl bg-rose-500 text-white shadow-md shadow-rose-500/30">
                      <Music className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                          {selectedOfflineTrack.title}
                        </h4>
                        {isPlayingOfflineLofi && (
                          <span className="flex h-2 w-2 relative shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {selectedOfflineTrack.subTitle}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleOfflineLofi()}
                    className={`px-4 py-2 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-1.5 ${
                      isPlayingOfflineLofi
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25'
                    }`}
                  >
                    {isPlayingOfflineLofi ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Tạm dừng</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Phát Offline</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Danh sách 5 bài Lofi chuẩn Web Audio @triplegdot */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
                    <span>5 bản Lofi Rhodes & Chill Beats thuần Offline:</span>
                    <span className="text-[10px] text-slate-400 font-mono">Web Audio API</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {OFFLINE_LOFI_TRACKS.map((trk) => {
                      const isCurrent = selectedOfflineTrack.id === trk.id;
                      const isPlaying = isCurrent && isPlayingOfflineLofi;
                      return (
                        <button
                          key={trk.id}
                          type="button"
                          onClick={() => handleToggleOfflineLofi(trk)}
                          className={`p-3 rounded-2xl text-left border transition-all flex items-center justify-between ${
                            isPlaying
                              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/20 shadow-xs'
                              : isCurrent
                              ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-xs truncate">{trk.title}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-slate-400">
                                {trk.bpm} BPM
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate mt-0.5 font-medium">
                              {trk.mood} • {trk.keyName}
                            </span>
                          </div>

                          <div className="shrink-0">
                            {isPlaying ? (
                              <span className="p-1.5 rounded-xl bg-rose-500 text-white flex items-center justify-center">
                                <Pause className="w-3.5 h-3.5 fill-current" />
                              </span>
                            ) : (
                              <span className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600 flex items-center justify-center">
                                <Play className="w-3.5 h-3.5 fill-current" />
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Thanh điều chỉnh âm lượng Lofi Offline */}
                <div className="flex items-center gap-3 pt-2 px-1">
                  <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={offlineLofiVolume}
                    onChange={(e) => handleOfflineLofiVolume(parseFloat(e.target.value))}
                    className="w-full accent-rose-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <Volume2 className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="font-mono text-xs text-slate-400 w-10 text-right shrink-0">
                    {Math.round(offlineLofiVolume * 100)}%
                  </span>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 2: NHẠC CỦA TÔI (LƯU OFFLINE QUA INDEXEDDB)               */}
            {/* ------------------------------------------------------------- */}
            {audioTab === 'myFiles' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tải file MP3 / WAV từ máy tính (hoặc nhạc bạn đã tải từ @triplegdot) vào đây để nghe offline 100%.
                  </p>

                  <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingAudio ? 'Đang nạp...' : 'Tải lên file MP3'}</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleUploadAudio}
                      disabled={isUploadingAudio}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* HTML5 Audio Player ngầm cho file cá nhân */}
                {selectedMyAudio && (
                  <audio
                    ref={myAudioElementRef}
                    src={selectedMyAudio.dataUrl}
                    loop
                    onEnded={() => setIsPlayingMyAudio(false)}
                    className="hidden"
                  />
                )}

                {/* Danh sách file cá nhân đã lưu trong máy */}
                {myAudioFiles.length === 0 ? (
                  <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                    <Disc className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Chưa có bài hát nào được lưu trong máy
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Hãy bấm nút <strong>"Tải lên file MP3"</strong> ở trên để nạp các bài hát yêu thích từ máy tính của bạn vào lưu trữ Offline.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {myAudioFiles.map((file) => {
                      const isCurrent = selectedMyAudioId === file.id;
                      const isPlaying = isCurrent && isPlayingMyAudio;
                      return (
                        <div
                          key={file.id}
                          onClick={() => handleTogglePlayMyAudio(file.id)}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                            isPlaying
                              ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-300 dark:border-brand-700 text-brand-900 dark:text-brand-100 ring-2 ring-brand-500/20'
                              : isCurrent
                              ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`p-2 rounded-xl shrink-0 ${
                                isPlaying
                                  ? 'bg-brand-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}
                            >
                              {isPlaying ? (
                                <Pause className="w-3.5 h-3.5 fill-current" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-current" />
                              )}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">{file.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {(file.size / (1024 * 1024)).toFixed(1)} MB • Đã lưu trong máy
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteAudio(file.id, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors shrink-0"
                            title="Xóa bài hát khỏi máy"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 3: THIÊN NHIÊN OFFLINE (WEB AUDIO NATIVE)                  */}
            {/* ------------------------------------------------------------- */}
            {audioTab === 'ambient' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Âm thanh tạo bằng Web Audio API thuần túy, hoạt động offline 100% không cần internet.
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => handleSoundChange('rain')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      ambientType === 'rain'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="block text-base mb-1">🌧️</span>
                    <span>Mưa rơi êm đềm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSoundChange('ocean')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      ambientType === 'ocean'
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="block text-base mb-1">🌊</span>
                    <span>Sóng biển vỗ bờ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSoundChange('whitenoise')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      ambientType === 'whitenoise'
                        ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="block text-base mb-1">☕</span>
                    <span>Tiếng ồn trắng</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSoundChange('none')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      ambientType === 'none'
                        ? 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <span className="block text-base mb-1">🔇</span>
                    <span>Tắt âm thanh</span>
                  </button>
                </div>

                {ambientType !== 'none' && (
                  <div className="flex items-center gap-3 pt-2 px-1">
                    <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={ambientVolume}
                      onChange={(e) => handleAmbientVolumeChange(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <Volume2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-mono text-xs text-slate-400 w-10 text-right shrink-0">
                      {Math.round(ambientVolume * 100)}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 4: YOUTUBE STREAM @triplegdot (KHI CÓ MẠNG INTERNET)      */}
            {/* ------------------------------------------------------------- */}
            {audioTab === 'youtube' && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <a
                    href="https://www.youtube.com/@triplegdot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    <span>Kênh: <strong>ggg. (@triplegdot)</strong></span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowVideo(!showVideo)}
                    className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-all ${
                      showVideo
                        ? 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        : 'border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400'
                    }`}
                  >
                    {showVideo ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Chỉ nghe (Ẩn video)</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Hiện video</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Trình phát Video / Chế độ Chỉ nghe */}
                {selectedLofiTrack && (
                  <div>
                    {isPlayingYtLofi ? (
                      <>
                        {showVideo ? (
                          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-sm border border-slate-200 dark:border-slate-800">
                            <iframe
                              src={`https://www.youtube-nocookie.com/embed/${selectedLofiTrack.videoId}?autoplay=1&enablejsapi=1`}
                              title={selectedLofiTrack.title}
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-indigo-500/10 border border-purple-200/80 dark:border-purple-900/50 flex items-center justify-between">
                            <iframe
                              src={`https://www.youtube-nocookie.com/embed/${selectedLofiTrack.videoId}?autoplay=1&enablejsapi=1`}
                              title={selectedLofiTrack.title}
                              className="w-0 h-0 opacity-0 pointer-events-none absolute -z-10"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            />
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="flex h-3 w-3 relative shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                                  {selectedLofiTrack.title}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                  {selectedLofiTrack.tag} • Đang phát trực tuyến
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={handleToggleYtLofiPlay}
                              className="px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 shadow-xs"
                            >
                              Tạm dừng
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div
                        onClick={handleToggleYtLofiPlay}
                        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white shadow-xs"
                      >
                        <img
                          src={`https://img.youtube.com/vi/${selectedLofiTrack.videoId}/mqdefault.jpg`}
                          alt={selectedLofiTrack.title}
                          className="w-full h-24 object-cover opacity-60 group-hover:opacity-75 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-between px-4 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent">
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300">
                              {selectedLofiTrack.tag}
                            </span>
                            <h5 className="text-xs font-black truncate max-w-[200px]">
                              {selectedLofiTrack.title}
                            </h5>
                          </div>
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 group-hover:bg-purple-500 text-white text-xs font-black shadow-md transition-colors">
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Phát Stream</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 10 Bài YouTube từ kênh @triplegdot */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                    <span>10 bài hát 1-Hour từ kênh @triplegdot:</span>
                    <span className="text-[10px] font-mono text-slate-400">1h mỗi bài</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                    {lofiTracks.map((trk) => {
                      const isCurrent = selectedLofiTrack?.id === trk.id;
                      const isPlaying = isCurrent && isPlayingYtLofi;

                      return (
                        <button
                          key={trk.id}
                          type="button"
                          onClick={() => handleSelectYtLofiTrack(trk)}
                          className={`p-2.5 rounded-xl text-left border text-[11px] transition-all flex flex-col justify-between ${
                            isPlaying
                              ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-200 ring-2 ring-purple-500/20 shadow-xs'
                              : isCurrent
                              ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 w-full">
                            <span className="font-bold truncate">{trk.title}</span>
                            {isPlaying && (
                              <span className="shrink-0 flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            <span>{trk.tag}</span>
                            {trk.duration && <span>{trk.duration}</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Form nạp thêm video YouTube */}
                <form onSubmit={handleAddCustomYtTrack} className="flex gap-1.5 pt-0.5">
                  <input
                    type="text"
                    placeholder="Dán link hoặc ID video @triplegdot khác..."
                    value={customYtInput}
                    onChange={(e) => setCustomYtInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={!customYtInput.trim()}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 shrink-0 transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nạp</span>
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Card Thống Kê Phiên Học Hôm Nay */}
          <div className="p-5 rounded-3xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Tiến Độ Tập Trung Hôm Nay</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Số phiên hoàn thành</span>
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                  {stats.completedSessionsToday} phiên
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Tổng thời gian</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {stats.totalFocusMinutes} phút
                </span>
              </div>
            </div>

            {/* Các phiên học gần đây */}
            {recentSessions.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Lịch sử phiên gần nhất
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {recentSessions.slice(0, 4).map((sess) => (
                    <div
                      key={sess.id}
                      className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                          {sess.subjectName || 'Phiên học tự do'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {sess.durationMinutes} phút tập trung
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(sess.completedAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sân chơi sinh hoạt thú cưng (Focus Pet Playground & Habitat) */}
          <FocusPetPlayground
            isTimerRunning={isRunning}
            timerMode={mode}
            onOpenPetHouse={() => setViewTab('pet')}
            className="w-full"
          />
        </div>
      </div>
      )}

      {/* Modal Cài Đặt Mặc Định Thời Lượng Pomodoro */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in text-left">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-3 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-rose-500" />
              <span>Cài đặt mặc định thời lượng</span>
            </h4>

            <form onSubmit={handleSaveSettings} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Thời gian tập trung mặc định (phút):
                </label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customFocusMin}
                  onChange={(e) => setCustomFocusMin(parseInt(e.target.value) || 25)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Thời gian nghỉ ngắn mặc định (phút):
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={customBreakMin}
                  onChange={(e) => setCustomBreakMin(parseInt(e.target.value) || 5)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
                >
                  Lưu mặc định
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
