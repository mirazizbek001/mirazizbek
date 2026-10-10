import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Compass,
  Heart,
  Home,
  ImagePlus,
  KeyRound,
  LogOut,
  MessageCircle,
  Mic,
  Moon,
  MoreHorizontal,
  Pause,
  Pin,
  PinOff,
  Pencil,
  Flag,
  Phone,
  Play,
  PlusSquare,
  Reply,
  Search,
  Send,
  Share2,
  Square,
  Sun,
  Trash2,
  User,
  Video,
  Volume2,
  X,
  ChevronLeft,
  Grid3X3,
  Check,
  Plus,
  Users,
  VolumeX,
  Camera,
  Settings,
  Contact,
} from "lucide-react";
import {
  useC,
  kidsUnsafeFile,
  isVideoFile,
  kidsUnsafeText,
  readMedia,
  readImg,
  ago,
  hm,
  seg,
  ensureCsrfToken,
  csrfToken,
} from "../context/AppContext";
import { Av, EmojiPicker, Modal } from "../components/Shared";

const audioWave = [
  7, 12, 9, 16, 11, 19, 10, 14, 21, 12, 17, 8, 15, 22, 11, 18, 9, 14, 20, 10,
  16, 8, 13, 18, 9, 15, 11, 7,
];
const audioTime = (seconds) =>
  `${Math.floor((seconds || 0) / 60)}:${Math.floor((seconds || 0) % 60)
    .toString()
    .padStart(2, "0")}`;
const presenceLabel = (presence, now = Date.now()) => {
  if (!presence) return "Offline";
  if (presence.online) return "Online";
  if (!presence.lastSeen) return "Offline";
  const lastSeen = new Date(presence.lastSeen);
  const elapsed = Math.max(0, now - lastSeen.getTime());
  if (elapsed < 60000) return "Oxirgi faollik: hozirgina";
  if (elapsed < 3600000)
    return `Oxirgi faollik: ${Math.floor(elapsed / 60000)} daqiqa oldin`;
  const today = new Date(now).toDateString() === lastSeen.toDateString();
  const time = lastSeen.toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return today
    ? `Oxirgi faollik: bugun ${time}`
    : `Oxirgi faollik: ${lastSeen.toLocaleDateString("uz-UZ", { day: "numeric", month: "short" })} ${time}`;
};

function VoiceMessagePlayer({
  src,
  mine,
  durationHint = 0,
  onDurationCorrected,
}) {
  const audio = useRef(null);
  const reportedDuration = useRef(durationHint || 0);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(durationHint || 0);
  const progress = duration ? Math.min(1, Math.max(0, position / duration)) : 0;
  const correctDuration = (value) => {
    if (!Number.isFinite(value) || value <= 0) return;
    const corrected = Math.max(1, Math.round(value));
    setDuration(corrected);
    if (!durationHint && reportedDuration.current !== corrected) {
      reportedDuration.current = corrected;
      onDurationCorrected?.(corrected);
    }
  };
  const loadDuration = async (event) => {
    const declaredDuration = event.currentTarget.duration;
    if (durationHint > 0) {
      setDuration(durationHint);
      return;
    }
    if (Number.isFinite(declaredDuration))
      setDuration(declaredDuration > 60 ? 0 : declaredDuration);
    if (
      !Number.isFinite(declaredDuration) ||
      declaredDuration <= 60 ||
      src.length > 700000 ||
      !window.AudioContext
    )
      return;
    const audioContext = new window.AudioContext();
    try {
      const encoded = await fetch(src).then((response) =>
        response.arrayBuffer(),
      );
      const decoded = await audioContext.decodeAudioData(encoded);
      if (decoded.duration > 0 && decoded.duration < declaredDuration)
        correctDuration(decoded.duration);
    } catch {
      /* Some browsers cannot decode the recorded container for duration inspection. */
    } finally {
      audioContext.close().catch(() => {});
    }
  };
  const togglePlayback = () => {
    if (!audio.current) return;
    if (audio.current.paused)
      audio.current
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    else {
      audio.current.pause();
      setPlaying(false);
    }
  };
  const seek = (event) => {
    const next = Number(event.target.value);
    if (audio.current) audio.current.currentTime = next;
    setPosition(next);
  };
  return (
    <div
      className={`flex w-[min(74vw,300px)] items-center gap-3 rounded-[15px] border px-3 py-2.5 shadow-sm ${mine ? "border-[#7bb3ff] bg-[#4f92ec] text-white" : "border-[#dfeeff]/80 bg-[#6aa5f0]/75 text-white"}`}
    >
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        className="hidden"
        onLoadedMetadata={loadDuration}
        onTimeUpdate={(event) => setPosition(event.currentTarget.currentTime)}
        onEnded={(event) => {
          if (
            !durationHint &&
            event.currentTarget.currentTime > 0 &&
            event.currentTarget.currentTime < duration
          )
            correctDuration(event.currentTarget.currentTime);
          setPlaying(false);
          setPosition(0);
        }}
      />
      <button
        type="button"
        onClick={togglePlayback}
        aria-label={
          playing ? "Ovozli xabarni pauza qilish" : "Ovozli xabarni tinglash"
        }
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${mine ? "bg-white/15 hover:bg-white/25" : "bg-[#ff8a1f] text-white hover:bg-[#e8750a]"}`}
      >
        {playing ? (
          <Pause size={18} fill="currentColor" />
        ) : (
          <Play size={18} fill="currentColor" className="translate-x-px" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div
          className="flex h-6 items-center justify-between gap-[2px]"
          aria-hidden="true"
        >
          {audioWave.map((height, index) => (
            <span
              key={index}
              className={`w-[2px] shrink-0 rounded-full transition-colors ${index / audioWave.length < progress ? (mine ? "bg-[#2a70d8]" : "bg-[#ff8a1f]") : mine ? "bg-white/35" : "bg-white/30"}`}
              style={{ height }}
            />
          ))}
        </div>
        <input
          type="range"
          min="0"
          max={duration || 1}
          step="0.1"
          value={Math.min(position, duration || 0)}
          onChange={seek}
          aria-label="Ovozli xabar vaqtini o‘zgartirish"
          className="mt-1 block h-1 w-full cursor-pointer accent-orange-500"
        />
        <div
          className={`mt-1 flex justify-between text-[10px] tabular-nums ${mine ? "text-white/70" : "text-[#d4e6ff]"}`}
        >
          <span>{audioTime(position)}</span>
          <span>{audioTime(duration)}</span>
        </div>
      </div>
      <Volume2
        size={16}
        className={mine ? "shrink-0 text-white/65" : "shrink-0 text-[#ffd24d]"}
        aria-hidden="true"
      />
    </div>
  );
}

function Messages({ peer, setPeer }) {
  const { db, me, byId, A, open, accessInfo, presenceByUser } = useC();
  const [t, setT] = useState("");
  const [q, setQ] = useState("");
  const [menuMessage, setMenuMessage] = useState(null);
  const [messageMenuPosition, setMessageMenuPosition] = useState(null);
  const [chatMenu, setChatMenu] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [heartMessage, setHeartMessage] = useState(null);
  const [shareQuery, setShareQuery] = useState("");
  const [forwardMessage, setForwardMessage] = useState(null);
  const [forwardQuery, setForwardQuery] = useState("");
  const [reportMessage, setReportMessage] = useState(null);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [reportingMessage, setReportingMessage] = useState(false);
  const messagePane = useRef(null);
  const recorderRef = useRef(null);
  const discardVoiceRef = useRef(false);
  const recordingStartedAt = useRef(0);
  const longPressTimer = useRef(null);
  const longPressTriggered = useRef(false);
  const skipContextMenu = useRef(false);
  const lastMessageTap = useRef(null);
  const now = Date.now();
  const [viewportMetrics, setViewportMetrics] = useState(() => {
    const viewport = window.visualViewport;
    const height = viewport?.height || window.innerHeight;
    return {
      height,
      offsetTop: viewport?.offsetTop || 0,
    };
  });
  const restricted = Boolean(accessInfo.restriction?.active);
  const sharePostId = (() => {
    try {
      return new URLSearchParams(window.location.search).get("share");
    } catch {
      return null;
    }
  })();
  const sharePost = sharePostId ? db.posts.find((post) => post.id === sharePostId) : null;
  const followedIds = new Set(
    db.follows.filter((follow) => follow.a === me.id).map((follow) => follow.b),
  );
  const shareUsers = db.users.filter(
    (user) => user.id !== me.id && followedIds.has(user.id),
  );
  const shareResults = shareQuery
    ? shareUsers.filter((user) =>
        `${user.username} ${user.name}`.toLowerCase().includes(shareQuery.toLowerCase()),
      )
    : shareUsers;
  const forwardUsers = db.users.filter(
    (user) =>
      user.id !== me.id &&
      !db.blockedUsers.includes(user.id) &&
      !db.blockedByUsers.includes(user.id) &&
      (!forwardQuery.trim() ||
        `${user.username} ${user.name}`
          .toLowerCase()
          .includes(forwardQuery.trim().toLowerCase())),
  );
  const forwardToUser = (userId) => {
    if (!forwardMessage) return;
    const content = {
      text: forwardMessage.text || "",
      ...(forwardMessage.src && {
        src: forwardMessage.src,
        mediaType: forwardMessage.mediaType,
        mediaDuration: forwardMessage.mediaDuration,
      }),
      ...(forwardMessage.reelId && { reelId: forwardMessage.reelId }),
      ...(forwardMessage.storyId && {
        storyId: forwardMessage.storyId,
        storyOwner: forwardMessage.storyOwner,
      }),
    };
    if (A.send(userId, content)) {
      setForwardMessage(null);
      setForwardQuery("");
      A.toast("Xabar jo‘natildi");
    }
  };
  const submitMessageReport = async () => {
    if (!reportMessage) return;
    setReportingMessage(true);
    const reported = await A.reportMessage(
      reportMessage.id,
      reportReason,
      reportDetails,
    );
    setReportingMessage(false);
    if (reported) {
      setReportMessage(null);
      setReportDetails("");
    }
  };
  useEffect(() => {
    const updateViewportHeight = () => {
      const viewport = window.visualViewport;
      const height = viewport?.height || window.innerHeight;
      setViewportMetrics({
        height,
        offsetTop: viewport?.offsetTop || 0,
      });
    };
    window.visualViewport?.addEventListener("resize", updateViewportHeight);
    window.visualViewport?.addEventListener("scroll", updateViewportHeight);
    window.addEventListener("resize", updateViewportHeight);
    window.addEventListener("focusin", updateViewportHeight);
    return () => {
      window.visualViewport?.removeEventListener(
        "resize",
        updateViewportHeight,
      );
      window.visualViewport?.removeEventListener(
        "scroll",
        updateViewportHeight,
      );
      window.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("focusin", updateViewportHeight);
    };
  }, []);
  useEffect(() => {
    setReplyToMessage(null);
    setEditingMessage(null);
  }, [peer]);
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(
      () => setRecordingSeconds((seconds) => seconds + 1),
      1000,
    );
    return () => clearInterval(timer);
  }, [recording]);
  useEffect(
    () => () => {
      discardVoiceRef.current = true;
      const recorder = recorderRef.current;
      if (recorder?.state === "recording") recorder.stop();
    },
    [],
  );
  const deletedIds = new Set(
    db.deletedMessages.map((message) => String(message.id)),
  );
  const hiddenChats = new Map(
    db.hiddenChats
      .filter((chat) => chat.owner === me.id)
      .map((chat) => [
        chat.peer,
        {
          cutoff: chat.cutoff,
          messageIds: new Set((chat.messageIds || []).map(String)),
        },
      ]),
  );
  const conversations = new Map();
  db.messages.forEach((message) => {
    if (message.from !== me.id && message.to !== me.id) return;
    if ((message.hiddenFor || []).includes(me.id)) return;
    if (deletedIds.has(String(message.id))) return;
    const peerId = message.from === me.id ? message.to : message.from;
    const hiddenChat = hiddenChats.get(peerId);
    if (hiddenChat?.messageIds.has(String(message.id))) return;
    if (hiddenChat && message.t <= hiddenChat.cutoff) return;

    let conversation = conversations.get(peerId);
    if (!conversation) {
      conversation = { messages: [], lastMessage: null, unread: 0 };
      conversations.set(peerId, conversation);
    }
    conversation.messages.push(message);
    if (
      !conversation.lastMessage ||
      message.t > conversation.lastMessage.t
    )
      conversation.lastMessage = message;
    if (message.from === peerId && !message.read) conversation.unread += 1;
  });
  const ids = [...conversations.entries()]
    .sort(([, first], [, second]) => second.lastMessage.t - first.lastMessage.t)
    .map(([id]) => id);
  if (peer && !conversations.has(peer)) ids.unshift(peer);
  const chat = peer
    ? [...(conversations.get(peer)?.messages || [])].sort(
        (a, b) => a.t - b.t,
      )
    : [];
  const pinnedMessages = chat
    .filter((message) => message.pinnedAt)
    .sort(
      (a, b) =>
        Number(a.pinnedAt) - Number(b.pinnedAt) || Number(a.t) - Number(b.t),
    );
  const pu = peer && byId(peer);
  useEffect(() => {
    if (
      peer &&
      db.messages.some((m) => m.to === me.id && m.from === peer && !m.read)
    )
      A.readMsgs(peer);
  }, [db.messages, peer]);
  useEffect(() => {
    if (messagePane.current)
      messagePane.current.scrollTop = messagePane.current.scrollHeight;
  }, [chat.length, peer]);
  useEffect(() => {
    const dismissMenus = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest("[data-chat-menu-root]")) setChatMenu(null);
      if (!target.closest("[data-message-menu-root]")) {
        setMenuMessage(null);
        setMessageMenuPosition(null);
      }
    };
    const dismissOnEscape = (event) => {
      if (event.key === "Escape") {
        setChatMenu(null);
        setMenuMessage(null);
        setMessageMenuPosition(null);
      }
    };
    document.addEventListener("pointerdown", dismissMenus);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissMenus);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, []);
  const found = q
    ? db.users.filter(
        (u) =>
          u.id !== me.id &&
          (u.username + u.name).toLowerCase().includes(q.toLowerCase()),
      )
    : [];
  const showMessageMenu = (id, message, trigger) => {
    if (menuMessage === id) {
      setMenuMessage(null);
      setMessageMenuPosition(null);
      return;
    }
    setMenuMessage(id);
    const pane = messagePane.current?.getBoundingClientRect();
    const canReact = !message.callEvent;
    const menuWidth = canReact ? 316 : 192;
    const menuActions =
      (message.from !== me.id ? 48 : 0) +
      (!message.callEvent ? 48 : 0) +
      (!message.callEvent ? 48 : 0) +
      (!message.callEvent ? 48 : 0) +
      (message.from === me.id && message.text && !message.src ? 48 : 0) +
      (message.from === me.id ? 96 : 0);
    const menuHeight =
      (canReact ? 150 : 0) +
      menuActions;
    const minX = (pane?.left || 0) + 8;
    const maxX = Math.max(
      minX,
      (pane?.right || window.innerWidth) - menuWidth - 8,
    );
    const left = Math.min(maxX, Math.max(minX, trigger.right - menuWidth));
    const minY = (pane?.top || 0) + 8;
    const maxY = Math.max(
      minY,
      (pane?.bottom || window.innerHeight) - menuHeight - 8,
    );
    let top = trigger.top - menuHeight - 8;
    if (top < minY) top = trigger.bottom + 8;
    top = Math.min(maxY, Math.max(minY, top));
    setMessageMenuPosition({ top, left });
  };
  const toggleMenu = (id, event, message) =>
    showMessageMenu(id, message, event.currentTarget.getBoundingClientRect());
  const onMessageTouchStart = (event, message) => {
    if (event.touches.length !== 1) return;
    longPressTriggered.current = false;
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      skipContextMenu.current = true;
      showMessageMenu(message.id, message, rect);
      setTimeout(() => {
        skipContextMenu.current = false;
        longPressTriggered.current = false;
      }, 1000);
    }, 500);
  };
  const cancelMessageLongPress = () => clearTimeout(longPressTimer.current);
  const onMessageTap = (event, message) => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      event.preventDefault();
      return;
    }
    const now = Date.now();
    if (
      lastMessageTap.current?.id === message.id &&
      now - lastMessageTap.current.at < 350
    ) {
      lastMessageTap.current = null;
      if (!message.callEvent) {
        if (A.reactMessage(message.id)) {
          setHeartMessage(message.id);
          setTimeout(
            () =>
              setHeartMessage((current) =>
                current === message.id ? null : current,
              ),
            650,
          );
        }
      }
      return;
    }
    lastMessageTap.current = { id: message.id, at: now };
  };
  const toggleChatMenu = (type, id) =>
    setChatMenu((current) =>
      current?.type === type && current.id === id ? null : { type, id },
    );
  const deleteChat = async (id) => {
    if (!window.confirm("Bu chat sizning ro‘yxatingizdan o‘chirilsinmi?"))
      return;
    if (await A.deleteChat(id)) {
      if (peer === id) setPeer(null);
      setChatMenu(null);
    }
  };
  const blockedByMe = (id) => db.blockedUsers.includes(id);
  const blockedByPeer = (id) => db.blockedByUsers.includes(id);
  const conversationBlocked =
    peer && (blockedByMe(peer) || blockedByPeer(peer));
  const peerPresence = peer ? presenceByUser[peer] : null;
  const send = () => {
    if (!t.trim()) return;
    if (editingMessage) {
      A.editMessage(editingMessage, t);
      setEditingMessage(null);
    } else {
      if (
        A.send(peer, {
          text: t.trim(),
          ...(replyToMessage && { replyTo: replyMetadata(replyToMessage) }),
        })
      )
        setReplyToMessage(null);
    }
    setT("");
  };
  const replyMetadata = (message) => ({
    id: message.id,
    from: message.from,
    text: message.text || "",
    mediaType: message.mediaType || "",
  });
  const beginReply = (message) => {
    setReplyToMessage(message);
    setEditingMessage(null);
    setT("");
    setMenuMessage(null);
    setMessageMenuPosition(null);
  };
  const messagePreview = (message) =>
    message?.text ||
    (message?.mediaType === "audio"
      ? "🎙 Ovozli xabar"
      : message?.mediaType === "video"
        ? "🎥 Video"
        : message?.src
          ? "📷 Rasm"
          : message?.reelId
            ? "🎬 Reels"
            : message?.storyId
              ? "📖 Story"
              : "Xabar");
  const sharePostToUser = (userId) => {
    if (!sharePostId) return;
    const caption = sharePost?.caption?.trim();
    const shareText = caption
      ? `Post: ${caption}`
      : "Menga bu postni yubordim";
    A.send(userId, { text: shareText });
    setPeer(userId);
    const query = new URLSearchParams(window.location.search);
    query.delete("share");
    const next = query.toString() ? `?${query.toString()}` : "";
    window.history.replaceState({}, "", `${window.location.pathname}${next}`);
    setShareQuery("");
  };
  const startVoiceRecording = async () => {
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      A.toast("Bu brauzerda ovoz yozib bo‘lmaydi.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      const chunks = [];
      discardVoiceRef.current = false;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        recorderRef.current = null;
        setRecording(false);
        setRecordingSeconds(0);
        if (discardVoiceRef.current) return;
        const blob = new Blob(chunks, {
          type: recorder.mimeType || "audio/webm",
        });
        if (!blob.size) {
          A.toast("Ovoz yozuvi bo‘sh.");
          return;
        }
        if (blob.size > 25 * 1024 * 1024) {
          A.toast("Ovozli xabar hajmi 25 MB dan oshmasin.");
          return;
        }
        const mediaDuration = Math.max(
          1,
          Math.round((Date.now() - recordingStartedAt.current) / 1000),
        );
        recordingStartedAt.current = 0;
        if (
          A.send(peer, {
            src: await readMedia(blob),
            mediaType: "audio",
            mediaDuration,
            ...(replyToMessage && {
              replyTo: replyMetadata(replyToMessage),
            }),
          })
        )
          setReplyToMessage(null);
      };
      recorder.onerror = () => {
        stream.getTracks().forEach((track) => track.stop());
        recorderRef.current = null;
        setRecording(false);
        A.toast("Ovoz yozishda xatolik.");
      };
      recorderRef.current = recorder;
      recorder.start();
      recordingStartedAt.current = Date.now();
      setRecordingSeconds(0);
      setRecording(true);
    } catch (error) {
      A.toast(
        error.name === "NotAllowedError"
          ? "Mikrofonga ruxsat bering."
          : "Mikrofonni ishga tushirib bo‘lmadi.",
      );
    }
  };
  const stopVoiceRecording = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };
  const cancelVoiceRecording = () => {
    discardVoiceRef.current = true;
    stopVoiceRecording();
  };
  useEffect(() => {
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") {
      discardVoiceRef.current = true;
      recorder.stop();
    }
  }, [peer]);
  const big = (m) =>
    m.text &&
    seg(m.text).length <= 3 &&
    /^[\p{Extended_Pictographic}\u200d\ufe0f\s]+$/u.test(m.text);
  return (
    <div
      style={{
        "--message-viewport-height": `${viewportMetrics.height}px`,
        "--message-viewport-top": `${viewportMetrics.offsetTop}px`,
      }}
      className="message-page mx-auto flex w-full overflow-hidden border-neutral-200 bg-[#2a70d8] !border-[#6aa5f0] !bg-[#2f7fe6] md:h-dvh md:border-x"
    >
      <div
        className={`${peer ? "hidden md:flex" : "flex"} w-full flex-col border-r border-neutral-200 !border-[#6aa5f0] md:w-[350px]`}
      >
        <div className="p-5 pb-3">
          <b className="text-xl">{me.username}</b>
          <div className="relative mt-4">
            <Search
              size={16}
              className="absolute left-3 top-3 text-neutral-400"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Yangi xabar uchun qidirish"
              className="w-full rounded-lg border border-transparent bg-neutral-100 py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-neutral-500 !border-[#6aa5f0] !bg-[#3a80e4] placeholder:!text-[#d4e6ff]"
            />
          </div>
        </div>
        {sharePostId && (
          <div className="border-b border-neutral-200 px-4 py-3 !border-[#6aa5f0]">
            <div className="mb-2 flex items-center justify-between gap-2">
              <b className="text-sm">Postni yuborish</b>
              <button
                type="button"
                onClick={() => {
                  const query = new URLSearchParams(window.location.search);
                  query.delete("share");
                  const next = query.toString() ? `?${query.toString()}` : "";
                  window.history.replaceState({}, "", `${window.location.pathname}${next}`);
                }}
                className="text-xs text-white/80 hover:text-white"
              >
                Yopish
              </button>
            </div>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-2.5 text-neutral-300"
              />
              <input
                value={shareQuery}
                onChange={(e) => setShareQuery(e.target.value)}
                placeholder="Follow qilganlardan qidirish"
                className="w-full rounded-[15px] border border-white/20 bg-[#3a80e4] py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/70"
              />
            </div>
            <div className="mt-3 max-h-52 space-y-1 overflow-y-auto">
              {shareResults.length ? (
                shareResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => sharePostToUser(u.id)}
                    className="flex w-full items-center gap-3 rounded-[12px] px-2 py-2 text-left transition hover:bg-[#4f92ec]"
                  >
                    <Av u={u} s={38} />
                    <div className="min-w-0 flex-1">
                      <b className="block truncate text-sm">{u.username}</b>
                      <span className="block truncate text-xs text-white/70">
                        {u.name || "User"}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-[12px] bg-[#2a70d8]/80 px-3 py-2 text-xs text-white/80">
                  Follow qilgan foydalanuvchilar yo‘q yoki topilmadi.
                </div>
              )}
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {q
            ? found.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setPeer(u.id);
                    setQ("");
                  }}
                  className="flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-[#4f92ec] hover:!bg-[#4f92ec]"
                >
                  <Av u={u} s={48} />
                  <div>
                    <b className="block text-sm">{u.username}</b>
                    <span className="text-xs text-neutral-500">{u.name}</span>
                  </div>
                </button>
              ))
            : ids.map((id) => {
                const u = byId(id);
                const conversation = conversations.get(id);
                const lastMessage = conversation?.lastMessage;
                const unread = conversation?.unread || 0;
                const previewText = lastMessage
                  ? `${lastMessage.from === me.id ? "Siz: " : ""}${lastMessage.text || (lastMessage.mediaType === "audio" ? "🎙 Ovozli xabar" : "📷 Rasm")}`
                  : "Xabar yozing";
                const badgeText =
                  unread > 0 ? (unread > 9 ? "9+" : `${unread}+`) : "";
                const presence = presenceByUser[id];
                if (!u) return null;
                return (
                  <div
                    key={id}
                    className={`relative flex items-center gap-2 border-l-2 px-3 py-2.5 transition-colors hover:bg-[#4f92ec] hover:!bg-[#4f92ec] ${peer === id ? "border-l-[#ffd24d] bg-[#3a80e4] !bg-[#4f92ec]" : "border-l-transparent"}`}
                  >
                    <button
                      onClick={() => setPeer(id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span className="relative shrink-0">
                        <Av u={u} s={54} />
                        <span
                          aria-label={presence?.online ? "Online" : "Offline"}
                          title={presenceLabel(presence, now)}
                          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white !border-[#6aa5f0] ${presence?.online ? "bg-[#ff8a1f]" : "bg-neutral-500"}`}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <b className="block truncate text-sm">
                          {u.name || u.username}
                        </b>
                        <span
                          className={`block truncate text-xs ${unread ? "font-bold" : "text-neutral-500"}`}
                        >
                          {previewText}
                        </span>
                      </div>
                      {badgeText && (
                        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#ff3040] px-1 text-[10px] font-bold text-white">
                          {badgeText}
                        </span>
                      )}
                    </button>
                    <button
                      data-chat-menu-root
                      onClick={() => toggleChatMenu("row", id)}
                      aria-label={`${u.username} chat amallari`}
                      title="Chat amallari"
                      className="rounded-full p-2 text-neutral-500 hover:bg-neutral-200 hover:!bg-[#4f92ec]"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                    {chatMenu?.type === "row" && chatMenu.id === id && (
                      <div
                        data-chat-menu-root
                        className="absolute right-2 top-12 z-30 min-w-48 overflow-hidden rounded-xl border border-[#6aa5f0] bg-[#0b2f6e] py-1 text-sm text-white shadow-xl !border-[#6aa5f0] !bg-[#0b2f6e] !text-white"
                      >
                        <button
                          onClick={() => deleteChat(id)}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-left font-medium text-red-300 transition-colors hover:!bg-red-500/15 hover:!text-red-200"
                        >
                          <Trash2 size={16} /> Chatni o‘chirish
                        </button>
                        <button
                          onClick={() => {
                            A.setUserBlocked(id, !blockedByMe(id));
                            setChatMenu(null);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-left font-medium text-[#eaf3ff] transition-colors hover:!bg-[#1a5fc8] hover:!text-white"
                        >
                          <X size={16} />{" "}
                          {blockedByMe(id) ? "Blokdan chiqarish" : "Bloklash"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          {!ids.length && !q && (
            <p className="p-8 text-center text-sm text-neutral-500">
              Suhbatlar yo‘q. Yuqoridan foydalanuvchini qidirib xobar yozing.
            </p>
          )}
        </div>
      </div>
      <div
        className={`${peer ? "flex" : "hidden md:flex"} relative min-w-0 flex-1 flex-col`}
      >
        {pu ? (
          <>
            <div className="relative flex items-center gap-2 border-b border-neutral-200 px-4 py-3 !border-[#6aa5f0]">
              <button onClick={() => setPeer(null)} className="md:hidden">
                <ChevronLeft />
              </button>
              <button
                onClick={() => open.profile(pu.id)}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <Av u={pu} s={40} />
                <div className="min-w-0 text-left">
                  <b className="block truncate text-sm">
                    {pu.name || pu.username}
                  </b>
                  <span
                    className={`block whitespace-normal break-words text-xs leading-4 ${peerPresence?.online && !conversationBlocked ? "font-semibold text-[#ffd24d] !text-[#ffd24d]" : "text-neutral-500"}`}
                  >
                    {conversationBlocked
                      ? blockedByMe(peer)
                        ? "Siz bloklagansiz"
                        : "Siz bloklangansiz"
                      : presenceLabel(peerPresence)}
                  </span>
                </div>
              </button>
              <button
                onClick={() => A.startCall(peer, "audio")}
                disabled={conversationBlocked || restricted}
                aria-label="Audio qo‘ng‘iroq"
                title="Audio qo‘ng‘iroq"
                className="rounded-full p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-emerald-600 disabled:opacity-40 hover:!bg-[#4f92ec] hover:!text-emerald-400"
              >
                <Phone size={19} />
              </button>
              <button
                onClick={() => A.startCall(peer, "video")}
                disabled={conversationBlocked || restricted}
                aria-label="Video qo‘ng‘iroq"
                title="Video qo‘ng‘iroq"
                className="rounded-full p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-[#ffd24d] disabled:opacity-40 hover:!bg-[#4f92ec]"
              >
                <Video size={19} />
              </button>
              <button
                data-chat-menu-root
                onClick={() => toggleChatMenu("header", peer)}
                aria-label="Chat amallari"
                title="Chat amallari"
                className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 hover:!bg-[#4f92ec]"
              >
                <MoreHorizontal size={20} />
              </button>
              {chatMenu?.type === "header" && chatMenu.id === peer && (
                <div
                  data-chat-menu-root
                  className="absolute right-3 top-14 z-30 min-w-48 overflow-hidden rounded-xl border border-[#6aa5f0] bg-[#0b2f6e] py-1 text-sm text-white shadow-xl !border-[#6aa5f0] !bg-[#0b2f6e] !text-white"
                >
                  <button
                    onClick={() => deleteChat(peer)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left font-medium text-red-300 transition-colors hover:!bg-red-500/15 hover:!text-red-200"
                  >
                    <Trash2 size={16} /> Chatni o‘chirish
                  </button>
                  <button
                    onClick={() => {
                      A.setUserBlocked(peer, !blockedByMe(peer));
                      setChatMenu(null);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left font-medium text-[#eaf3ff] transition-colors hover:!bg-[#1a5fc8] hover:!text-white"
                  >
                    <X size={16} />{" "}
                    {blockedByMe(peer) ? "Blokdan chiqarish" : "Bloklash"}
                  </button>
                </div>
              )}
            </div>
            {pinnedMessages.length > 0 && (
              <div className="flex flex-col gap-1.5 border-b border-[#6aa5f0] bg-[#174d9e] px-3 py-2 sm:flex-row sm:items-center sm:gap-2">
                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <Pin size={16} className="shrink-0 text-[#ffd24d]" />
                  <span className="shrink-0 text-xs font-semibold text-[#ffd24d]">
                    Qadalgan:
                  </span>
                  <span className="ml-auto shrink-0 text-[10px] text-white/70 sm:ml-0">
                    {pinnedMessages.length}/4
                  </span>
                </div>
                <div className="grid w-full min-w-0 grid-cols-2 gap-1.5 sm:flex sm:flex-1 sm:gap-2 sm:overflow-x-auto sm:no-scrollbar">
                  {pinnedMessages.map((message) => (
                    <button
                      key={message.id}
                      type="button"
                      onClick={() =>
                        document
                          .getElementById(`chat-message-${message.id}`)
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          })
                      }
                      className="min-w-0 truncate rounded-full border border-white/20 bg-white/10 px-3 py-1 text-left text-xs text-white transition hover:bg-white/20 sm:max-w-36 sm:shrink-0"
                      title={messagePreview(message)}
                    >
                      {messagePreview(message)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div
              ref={messagePane}
              onScroll={() => {
                setMenuMessage(null);
                setMessageMenuPosition(null);
              }}
              className="message-pane flex-1 space-y-1 overflow-y-auto no-scrollbar px-4 py-4"
            >
              {!chat.length && (
                <div className="grid h-full place-items-center text-center">
                  <div>
                    <div className="mx-auto w-fit">
                      <Av u={pu} s={90} />
                    </div>
                    <b className="mt-3 block text-xl">{pu.name}</b>
                    <span className="text-sm text-neutral-500">
                      @{pu.username}
                    </span>
                    <p className="mt-2 text-sm text-neutral-500">
                      Birinchi xabarni yozing 👋
                    </p>
                  </div>
                </div>
              )}
              {chat.map((m, i) => {
                const my = m.from === me.id,
                  lastMine =
                    my && i === chat.map((x) => x.from).lastIndexOf(me.id);
                const prev = chat[i - 1];
                const next = chat[i + 1];
                const sameGroup =
                  prev &&
                  prev.from === m.from &&
                  Math.abs(prev.t - m.t) < 60000;
                const showTime =
                  !sameGroup &&
                  (!next ||
                    next.from !== m.from ||
                    Math.abs(next.t - m.t) >= 60000);
                return (
                  <div
                    key={m.id}
                    id={`chat-message-${m.id}`}
                    className={`flex flex-col ${my ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`group/message relative flex max-w-full items-center gap-1 ${my ? "flex-row-reverse" : ""}`}
                    >
                      <div
                        onTouchStart={(event) => onMessageTouchStart(event, m)}
                        onTouchEnd={cancelMessageLongPress}
                        onTouchCancel={cancelMessageLongPress}
                        onTouchMove={cancelMessageLongPress}
                        onClick={(event) => onMessageTap(event, m)}
                        onContextMenu={(event) => {
                          event.preventDefault();
                          if (!skipContextMenu.current)
                            toggleMenu(m.id, event, m);
                        }}
                        className="relative max-w-[min(78vw,520px)] touch-pan-y select-none"
                      >
                        {m.replyTo && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              document
                                .getElementById(`chat-message-${m.replyTo.id}`)
                                ?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "center",
                                });
                            }}
                            className="mb-1 block w-full max-w-full rounded-lg border-l-[3px] border-[#ffd24d] bg-[#174d9e]/90 px-3 py-2 text-left text-xs text-white"
                          >
                            <span className="mb-0.5 block truncate font-semibold text-[#ffd24d]">
                              {byId(m.replyTo.from)?.username ||
                                "Foydalanuvchi"}
                            </span>
                            <span className="block truncate text-white/85">
                              {messagePreview(m.replyTo)}
                            </span>
                          </button>
                        )}
                        {m.pinnedAt && (
                          <span
                            className="absolute -top-2 right-2 z-10 grid h-6 w-6 place-items-center rounded-full border border-[#6aa5f0] bg-[#0b2f6e] text-[#ffd24d] shadow"
                            title="Qadalgan xabar"
                          >
                            <Pin size={13} />
                          </span>
                        )}
                        {m.storyId &&
                          (() => {
                            const story = db.stories.find(
                              (item) => item.id === m.storyId,
                            );
                            return (
                              <button
                                type="button"
                                onClick={() =>
                                  story
                                    ? open.story(story.id)
                                    : A.toast("Bu Story endi mavjud emas")
                                }
                                className="mb-1 flex h-14 w-44 max-w-full items-center gap-2 overflow-hidden rounded-lg border-l-2 border-pink-500 bg-neutral-100 text-left hover:bg-neutral-200 !bg-[#3a80e4] hover:!bg-[#6aa5f0]"
                              >
                                <span className="grid h-full w-10 shrink-0 place-items-center overflow-hidden bg-[#0f3f8c]">
                                  {story?.type === "video" ? (
                                    <video
                                      src={story.media}
                                      muted
                                      playsInline
                                      preload="metadata"
                                      className="h-full w-full object-cover"
                                    />
                                  ) : story?.media ? (
                                    <img
                                      src={story.media}
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <Play size={18} className="text-white" />
                                  )}
                                </span>
                                <span className="min-w-0 px-1">
                                  <b className="block text-[10px] text-neutral-500 !text-[#d4e6ff]">
                                    Story’ga javob
                                  </b>
                                  <span className="block truncate text-xs">
                                    {story?.caption || "Story’ni ko‘rish"}
                                  </span>
                                </span>
                              </button>
                            );
                          })()}
                        {m.reelId &&
                          (() => {
                            const reel = db.reels.find(
                              (item) => item.id === m.reelId,
                            );
                            const owner = reel && byId(reel.userId);
                            return (
                              <div className="w-[210px] max-w-full overflow-hidden rounded-2xl border border-[#6aa5f0] bg-[#3a80e4]">
                                <div className="px-3 py-2">
                                  {owner ? (
                                    <button
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        open.profile(owner.id);
                                      }}
                                      className="flex max-w-full items-center gap-2 text-left"
                                    >
                                      <Av u={owner} s={28} />
                                      <span className="truncate text-xs font-bold">
                                        @{owner.username}
                                      </span>
                                    </button>
                                  ) : (
                                    <b className="block truncate text-xs">
                                      Reels
                                    </b>
                                  )}
                                </div>
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    if (reel) open.reel(reel.id);
                                    else A.toast("Bu Reels endi mavjud emas");
                                  }}
                                  className="block w-full text-left transition hover:opacity-90"
                                >
                                  <span className="block aspect-[9/14] w-full bg-[#0f3f8c]">
                                    {reel?.type === "video" ? (
                                      <video
                                        src={`${reel.media}#t=0.1`}
                                        muted
                                        playsInline
                                        preload="metadata"
                                        className="h-full w-full object-cover"
                                      />
                                    ) : reel?.media ? (
                                      <img
                                        src={reel.media}
                                        alt=""
                                        className="h-full w-full object-cover"
                                      />
                                    ) : null}
                                  </span>
                                  <span className="block px-3 py-2">
                                    {reel?.caption && (
                                      <span className="block truncate text-xs text-neutral-500">
                                        {reel.caption}
                                      </span>
                                    )}
                                  </span>
                                </button>
                              </div>
                            );
                          })()}
                        {m.callEvent ? (
                          <div
                            className={`flex min-w-44 items-center gap-3 rounded-[15px] px-4 py-3 ${my ? "bg-[#4f92ec] text-white" : "bg-[#3a80e4] text-white"}`}
                          >
                            <span
                              className={`grid h-9 w-9 place-items-center rounded-full ${m.callEvent.status === "ended" ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"}`}
                            >
                              <Phone size={18} />
                            </span>
                            <span>
                              <b className="block text-sm">
                                {m.callEvent.mode === "video"
                                  ? "Video qo‘ng‘iroq"
                                  : "Audio qo‘ng‘iroq"}
                              </b>
                              <span className="block text-xs opacity-70">
                                {m.callEvent.status === "ended"
                                  ? `Tugadi · ${String(Math.floor(m.callEvent.duration / 60)).padStart(2, "0")}:${String(m.callEvent.duration % 60).padStart(2, "0")}`
                                  : m.callEvent.status === "declined"
                                    ? "Rad etildi"
                                    : m.callEvent.status === "failed"
                                      ? "Ulanmadi"
                                      : "Javobsiz"}
                              </span>
                            </span>
                          </div>
                        ) : m.src ? (
                          m.mediaType === "video" ? (
                            <video
                              src={m.src}
                              controls
                              playsInline
                              className="max-h-[360px] max-w-[min(70vw,420px)] rounded-2xl bg-[#0f3f8c] object-contain"
                            />
                          ) : m.mediaType === "audio" ? (
                            <VoiceMessagePlayer
                              src={m.src}
                              mine={my}
                              durationHint={m.mediaDuration}
                              onDurationCorrected={(duration) =>
                                A.updateVoiceDuration(m.id, duration)
                              }
                            />
                          ) : (
                            <img
                              src={m.src}
                              alt=""
                              className="max-h-[360px] max-w-[min(70vw,420px)] rounded-2xl object-cover"
                            />
                          )
                        ) : m.reelId ? null : big(m) ? (
                          <span className="text-5xl leading-tight">
                            {m.text}
                          </span>
                        ) : (
                          <div
                            className={`w-fit max-w-full whitespace-pre-wrap break-words rounded-[15px] border px-4 py-2 text-[15px] shadow-sm ${my ? "border-[#7bb3ff] bg-[#4f92ec] text-white" : "border-[#dfeeff]/80 bg-[#6aa5f0]/75 text-white"}`}
                          >
                            {m.text}
                            {m.edited && (
                              <span className="ml-2 text-[10px] opacity-70">
                                tahrirlangan
                              </span>
                            )}
                          </div>
                        )}
                        {Object.keys(m.reactions || {}).length > 0 && (
                          <span className="absolute -bottom-4 right-2 z-20 flex max-w-[calc(100%-8px)] items-center gap-1 rounded-full border border-[#6aa5f0] bg-[#0b2f6e] px-2 py-1 shadow-md">
                            {Object.entries(
                              Object.values(m.reactions || {}).reduce(
                                (counts, emoji) => {
                                  counts[emoji] = (counts[emoji] || 0) + 1;
                                  return counts;
                                },
                                {},
                              ),
                            ).map(([emoji, count]) => (
                              <button
                                key={emoji}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  A.reactMessage(m.id, emoji);
                                }}
                                aria-label={`${emoji} reaksiyasi`}
                                title={`${count} ta reaksiya`}
                                className="grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-transparent px-0.5 text-base leading-none text-white hover:!bg-transparent"
                              >
                                {emoji}
                              </button>
                            ))}
                          </span>
                        )}
                        {heartMessage === m.id && (
                          <Heart
                            size={64}
                            fill="#ff3040"
                            className="pointer-events-none absolute inset-0 z-10 m-auto text-[#ff3040] drop-shadow-2xl"
                          />
                        )}
                        {menuMessage === m.id && messageMenuPosition && (
                          <div
                            data-message-menu-root
                            className={`z-[80] overflow-y-auto rounded-xl border border-[#6aa5f0] bg-[#0b2f6e] py-1 text-left text-sm text-white shadow-xl !border-[#6aa5f0] !bg-[#0b2f6e] !text-white ${!m.callEvent ? "w-[min(300px,calc(100vw-24px))]" : "min-w-48"}`}
                            style={{
                              position: "fixed",
                              top: messageMenuPosition.top,
                              left: messageMenuPosition.left,
                              maxHeight: `${Math.max(
                                120,
                                Math.min(
                                  window.innerHeight - 16,
                                  (messagePane.current?.clientHeight ||
                                    window.innerHeight) - 16,
                                ),
                              )}px`,
                            }}
                          >
                            {!m.callEvent && (
                              <EmojiPicker
                                compact
                                cls="!w-full !border-0 !bg-transparent !shadow-none"
                                onPick={(emoji) => {
                                  A.reactMessage(m.id, emoji);
                                  setMenuMessage(null);
                                  setMessageMenuPosition(null);
                                }}
                              />
                            )}
                            {!my && (
                              <button
                                onClick={() => {
                                  setReportMessage(m);
                                  setReportReason("spam");
                                  setReportDetails("");
                                  setMenuMessage(null);
                                  setMessageMenuPosition(null);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-medium text-red-300 transition-colors hover:!bg-red-500/15 hover:!text-red-200"
                              >
                                <Flag size={16} /> Shikoyat qilish
                              </button>
                            )}
                            {!m.callEvent && (
                              <button
                                type="button"
                                onClick={() => {
                                  A.toggleMessagePin(m.id);
                                  setMenuMessage(null);
                                  setMessageMenuPosition(null);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-medium text-[#eaf3ff] transition-colors hover:!bg-[#1a5fc8] hover:!text-white"
                              >
                                {m.pinnedAt ? (
                                  <PinOff size={16} />
                                ) : (
                                  <Pin size={16} />
                                )}
                                {m.pinnedAt ? "Qadashdan olish" : "Qadash"}
                              </button>
                            )}
                            {!m.callEvent && (
                              <button
                                onClick={() => {
                                  setForwardMessage(m);
                                  setForwardQuery("");
                                  setMenuMessage(null);
                                  setMessageMenuPosition(null);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-medium text-[#eaf3ff] transition-colors hover:!bg-[#1a5fc8] hover:!text-white"
                              >
                                <Send size={16} /> Jo‘natish
                              </button>
                            )}
                            {!m.callEvent && (
                              <button
                                onClick={() => beginReply(m)}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-medium text-[#eaf3ff] transition-colors hover:!bg-[#1a5fc8] hover:!text-white"
                              >
                                <Reply size={16} /> Javob yozish
                              </button>
                            )}
                            {my && m.text && !m.src && (
                              <button
                                onClick={() => {
                                  setReplyToMessage(null);
                                  setEditingMessage(m.id);
                                  setT(m.text);
                                  setMenuMessage(null);
                                  setMessageMenuPosition(null);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-medium text-[#eaf3ff] transition-colors hover:!bg-[#1a5fc8] hover:!text-white"
                              >
                                <Pencil size={16} /> Tahrirlash
                              </button>
                            )}
                            {my && (
                              <button
                                onClick={() => {
                                  A.deleteMessage(m.id, true);
                                  setMenuMessage(null);
                                  setMessageMenuPosition(null);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-semibold text-red-300 transition-colors hover:!bg-red-500/15 hover:!text-red-200"
                              >
                                <Trash2 size={16} /> Hammadan o‘chirish
                              </button>
                            )}
                            {my && (
                              <button
                                onClick={() => {
                                  A.deleteMessage(m.id);
                                  setMenuMessage(null);
                                  setMessageMenuPosition(null);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-medium text-[#eaf3ff] transition-colors hover:!bg-[#1a5fc8] hover:!text-white"
                              >
                                <Trash2 size={16} /> O‘zimdan o‘chirish
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        data-message-menu-root
                        aria-label="Xabar amallari"
                        title="Xabar amallari"
                        onClick={(event) => toggleMenu(m.id, event, m)}
                        className={`shrink-0 rounded-full p-1 text-neutral-500 hover:bg-neutral-100 hover:!bg-[#4f92ec] sm:opacity-0 sm:group-hover/message:opacity-100 ${menuMessage === m.id ? "opacity-100" : ""}`}
                      >
                        <MoreHorizontal size={17} />
                      </button>
                    </div>
                    {showTime && (
                      <span className="mb-1 px-2 text-[10px] text-neutral-400">
                        {hm(m.t)}
                        {m.edited ? " · tahrirlangan" : ""}
                        {lastMine && (m.read ? " · O‘qildi" : " · Yuborildi")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {editingMessage && (
              <div className="mx-4 flex items-center justify-between border-l-2 border-[#ff8a1f] px-3 py-1 text-xs text-neutral-500">
                <span>
                  Tahrirlanmoqda:{" "}
                  {
                    db.messages.find((message) => message.id === editingMessage)
                      ?.text
                  }
                </span>
                <button
                  onClick={() => {
                    setEditingMessage(null);
                    setT("");
                  }}
                  className="px-2 py-1"
                >
                  Bekor qilish
                </button>
              </div>
            )}
            {replyToMessage && !editingMessage && (
              <div className="mx-3 mb-2 flex min-w-0 items-center gap-3 rounded-xl border-l-[3px] border-[#ffd24d] bg-[#174d9e] px-3 py-2 text-white">
                <Reply size={17} className="shrink-0 text-[#ffd24d]" />
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-[#ffd24d]">
                    {byId(replyToMessage.from)?.username || "Foydalanuvchi"}
                  </span>
                  <span className="block truncate text-xs text-white/85">
                    {messagePreview(replyToMessage)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyToMessage(null)}
                  aria-label="Javobni bekor qilish"
                  className="shrink-0 rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {conversationBlocked && (
              <p className="mx-4 mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 !bg-amber-950/30 !text-amber-200">
                {blockedByMe(peer)
                  ? "Siz bu foydalanuvchini bloklagansiz."
                  : "Bu foydalanuvchi sizni bloklagan."}{" "}
                Xabar yuborish uchun blokni bekor qiling.
              </p>
            )}
            <div className="message-composer flex items-center gap-1.5 rounded-[15px] border-t border-neutral-200 bg-white/95 px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] !border-[#6aa5f0] bg-transparent md:m-4 md:gap-2 md:border-0 md:bg-transparent md:px-0 md:py-0 md:pb-0">
              <button
                onClick={recording ? stopVoiceRecording : startVoiceRecording}
                disabled={restricted || conversationBlocked}
                aria-label={
                  recording
                    ? "Ovoz yozuvini to‘xtatib yuborish"
                    : "Ovozli xabar yozish"
                }
                title={recording ? "To‘xtatib yuborish" : "Ovozli xabar yozish"}
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition disabled:opacity-40 ${recording ? "bg-red-600 text-white hover:bg-red-500" : "hover:bg-neutral-100 hover:!bg-[#4f92ec]"}`}
              >
                {recording ? (
                  <Square size={17} fill="currentColor" />
                ) : (
                  <Mic size={21} />
                )}
              </button>
              <div
                className={`flex min-w-0 flex-1 items-center gap-0.5 rounded-[15px] border-2 bg-neutral-50 px-2 py-1.5 transition focus-within:ring-2 focus-within:ring-0 !border-[#6aa5f0] !bg-[#2a70d8] ${recording ? "border-red-300 bg-red-50 !border-red-900 !bg-red-950/20" : "border-neutral-300"}`}
              >
                {recording ? (
                  <>
                    <span className="flex-1 text-sm font-medium text-red-600 !text-red-300">
                      <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
                      Ovoz yozilmoqda ·{" "}
                      {String(Math.floor(recordingSeconds / 60)).padStart(
                        2,
                        "0",
                      )}
                      :{String(recordingSeconds % 60).padStart(2, "0")}
                    </span>
                    <button
                      onClick={cancelVoiceRecording}
                      aria-label="Ovoz yozuvini bekor qilish"
                      title="Bekor qilish"
                      className="rounded-full p-2 text-neutral-500 hover:bg-[#3a80e4] hover:!bg-[#4f92ec]"
                    >
                      <X size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      value={t}
                      enterKeyHint="send"
                      disabled={restricted || conversationBlocked}
                      onChange={(e) => setT(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && send()}
                      placeholder={
                        restricted
                          ? "Admin cheklovi faol"
                          : conversationBlocked
                            ? "Chat bloklangan"
                            : "Xabar yozing..."
                      }
                      className="min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-white/70 disabled:opacity-50"
                    />
                    {!editingMessage && (
                      <label
                        title={
                          restricted
                            ? "Admin cheklovi faol"
                            : conversationBlocked
                              ? "Chat bloklangan"
                              : `Rasm yoki video yuborish: ${pu.username}`
                        }
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${restricted || conversationBlocked ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-neutral-100 hover:!bg-[#4f92ec]"}`}
                      >
                        <ImagePlus size={21} />
                        <input
                          type="file"
                          accept="image/*,video/*,.mov,.m4v,.mp4,.webm"
                          disabled={restricted || conversationBlocked}
                          className="hidden"
                          onChange={async (event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            if (!file) return;
                            const fileError = kidsUnsafeFile(file);
                            if (fileError) {
                              A.toast(fileError);
                              return;
                            }
                            const video = isVideoFile(file);
                            if (
                              A.send(peer, {
                                src: video
                                  ? await readMedia(file)
                                  : await readImg(file, 800),
                                mediaType: video ? "video" : "image",
                                ...(replyToMessage && {
                                  replyTo: replyMetadata(replyToMessage),
                                }),
                              })
                            )
                              setReplyToMessage(null);
                          }}
                        />
                      </label>
                    )}
                    <button
                      onClick={send}
                      disabled={restricted || conversationBlocked || !t.trim()}
                      aria-label={
                        editingMessage ? "O‘zgarishni saqlash" : "Yuborish"
                      }
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 !text-white hover:!bg-[#4f92ec]"
                    >
                      {editingMessage ? (
                        <Check size={20} />
                      ) : (
                        <Send size={20} />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="grid flex-1 place-items-center text-center">
            <div>
              <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border-2 border-current">
                <Send size={42} strokeWidth={1.4} />
              </div>
              <h2 className="mt-4 text-xl">Sizning xabarlaringiz</h2>
              <p className="text-sm text-neutral-500">
                Do‘stlaringizga rasm, emoji va xabar yuboring.
              </p>
            </div>
          </div>
        )}
      </div>
      {reportMessage && (
        <Modal close={() => !reportingMessage && setReportMessage(null)}>
          <div className="flex items-center justify-between border-b border-[#6aa5f0] p-4">
            <b>Xabar ustidan shikoyat</b>
            <button
              onClick={() => setReportMessage(null)}
              disabled={reportingMessage}
              aria-label="Yopish"
            >
              <X size={20} />
            </button>
          </div>
          <div className="space-y-4 p-4">
            <p className="text-sm text-[#d4e6ff]">
              @{byId(reportMessage.from)?.username || "foydalanuvchi"} yuborgan
              xabar sababini tanlang.
            </p>
            <label className="block text-sm font-semibold">
              Sabab
              <select
                value={reportReason}
                onChange={(event) => setReportReason(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#6aa5f0] bg-[#3a80e4] px-3 py-2.5 font-normal text-white"
              >
                <option value="adult">18+ kontent</option>
                <option value="violence">Zo‘ravonlik</option>
                <option value="harassment">Haqorat yoki nafrat</option>
                <option value="spam">Spam yoki aldov</option>
                <option value="other">Boshqa</option>
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Izoh{" "}
              <span className="font-normal text-[#d4e6ff]">(ixtiyoriy)</span>
              <textarea
                value={reportDetails}
                onChange={(event) => setReportDetails(event.target.value)}
                maxLength={500}
                rows={3}
                className="mt-1.5 w-full resize-none rounded-lg border border-[#6aa5f0] bg-[#3a80e4] px-3 py-2 text-sm text-white"
                placeholder="Qo‘shimcha ma’lumot..."
              />
            </label>
            <button
              onClick={submitMessageReport}
              disabled={reportingMessage}
              className="w-full rounded-lg bg-red-500 px-4 py-2.5 font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
            >
              {reportingMessage ? "Yuborilmoqda..." : "Shikoyatni yuborish"}
            </button>
          </div>
        </Modal>
      )}
      {forwardMessage && (
        <Modal close={() => setForwardMessage(null)}>
          <div className="flex items-center justify-between border-b border-[#6aa5f0] p-4">
            <b>Xabarni jo‘natish</b>
            <button
              onClick={() => setForwardMessage(null)}
              aria-label="Yopish"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-4">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-3 text-[#d4e6ff]"
              />
              <input
                value={forwardQuery}
                onChange={(event) => setForwardQuery(event.target.value)}
                placeholder="Foydalanuvchini qidirish"
                className="w-full rounded-lg border border-[#6aa5f0] bg-[#3a80e4] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-[#d4e6ff]"
              />
            </div>
            <div className="mt-3 max-h-[55vh] space-y-1 overflow-y-auto">
              {forwardUsers.length ? (
                forwardUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => forwardToUser(user.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-[#4f92ec]"
                  >
                    <Av u={user} s={40} />
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-sm">
                        @{user.username}
                      </b>
                      <span className="block truncate text-xs text-[#d4e6ff]">
                        {user.name || "User"}
                      </span>
                    </span>
                    <Send size={17} />
                  </button>
                ))
              ) : (
                <p className="p-5 text-center text-sm text-[#d4e6ff]">
                  Foydalanuvchi topilmadi.
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Messages;
