'use client';

import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { Send, X, Bot, Camera, ImagePlus, Mic, ArrowUpRight, ArrowDownLeft, CheckCircle2, ChevronDown } from 'lucide-react';
import { getCategoryLabel } from '@/lib/categories';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthProvider';

// --- Types ---
interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    transaction?: any;
    saved?: boolean;
    mediaType?: 'voice' | 'image';
    attachment?: string;
}

// --- Helper Components ---

const TypingIndicator = () => (
    <div className="flex gap-1 items-center p-2">
        <div className="w-1.5 h-1.5 bg-[#00875A] rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-1.5 h-1.5 bg-[#00875A] rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-1.5 h-1.5 bg-[#00875A] rounded-full animate-bounce" />
    </div>
);

// WhatsApp-style Voice Note Bubble
const VoiceNoteBubble = ({ audioSrc, duration }: { audioSrc: string; duration?: number }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setProgress(pct);
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    const formatDuration = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-3 min-w-[180px]">
            <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0 shadow-md active:scale-95 transition"
            >
                {isPlaying ? (
                    <div className="flex gap-0.5">
                        <div className="w-1 h-4 bg-white rounded-full" />
                        <div className="w-1 h-4 bg-white rounded-full" />
                    </div>
                ) : (
                    <div className="w-0 h-0 border-l-[10px] border-l-white border-y-[6px] border-y-transparent ml-1" />
                )}
            </button>

            {/* Waveform */}
            <div className="flex-1 flex flex-col gap-1">
                <div className="relative h-6 flex items-center gap-[2px]">
                    {/* Fake waveform bars */}
                    {[3, 5, 8, 4, 7, 10, 6, 8, 5, 9, 4, 7, 5, 8, 6, 4, 7, 5, 3].map((h, i) => (
                        <div
                            key={i}
                            className="w-[3px] rounded-full transition-colors"
                            style={{
                                height: `${h * 2}px`,
                                backgroundColor: progress > (i / 19) * 100 ? '#14b8a6' : 'rgba(255,255,255,0.3)'
                            }}
                        />
                    ))}
                    {/* Progress overlay */}
                    <div
                        className="absolute left-0 top-0 h-full bg-teal-400/20 rounded"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <span className="text-[10px] text-white/60">{formatDuration(duration || 0)}</span>
            </div>

            <audio
                ref={audioRef}
                src={audioSrc}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onLoadedMetadata={() => {
                    if (audioRef.current && !duration) {
                        // Duration will be set from recording
                    }
                }}
            />
        </div>
    );
};

// Image Bubble - Shows actual image
const ImageBubble = ({ src, onClick }: { src: string; onClick?: () => void }) => (
    <div
        className="relative rounded-xl overflow-hidden cursor-pointer group max-w-[240px]"
        onClick={onClick}
    >
        <img
            src={src}
            alt="Uploaded"
            className="w-full h-auto max-h-[200px] object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <ImagePlus size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    </div>
);

const TransactionCard = ({ transaction, onSave, isSaved }: { transaction: any, onSave: () => void, isSaved?: boolean }) => {
    return (
        <div className="mt-2 relative w-full group max-w-[280px]">
            {/* Main Card Container with Ticket Shape - TWO-TONE (MINT HEADER / WHITE BODY) */}
            <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 overflow-hidden relative">

                {/* 1. Header Section (Category & Icon) - MINT GRADIENT */}
                <div className="bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] p-2.5 border-b border-dashed border-emerald-100/60 relative z-10">

                    {/* Premium Texture Overlay (Header Only) */}
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-0"
                        style={{
                            backgroundImage: 'radial-gradient(#00875A 0.5px, transparent 0.5px)',
                            backgroundSize: '8px 8px'
                        }}
                    />

                    {/* Ticket Notches (Decorative) */}
                    <div className="absolute left-[-5px] bottom-[-5px] w-2.5 h-2.5 rounded-full bg-[#f4f5f7] z-10 box-shadow-inner" />
                    <div className="absolute right-[-5px] bottom-[-5px] w-2.5 h-2.5 rounded-full bg-[#f4f5f7] z-10 box-shadow-inner" />

                    <div className="flex justify-between items-start relative z-10">
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm bg-white/80 backdrop-blur-sm ${transaction.type === 'expense'
                                ? 'text-[#FF5630]'
                                : 'text-[#00875A]'
                                }`}>
                                {transaction.type === 'expense' ? <ArrowUpRight size={16} strokeWidth={2.5} /> : <ArrowDownLeft size={16} />}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase font-bold text-emerald-800/60 tracking-wider mb-0.5">
                                    {transaction.type === 'expense' ? 'PENGELUARAN' : 'PEMASUKAN'}
                                </span>
                                <span className="text-xs font-bold text-emerald-950">
                                    {getCategoryLabel(transaction.category)}
                                </span>
                            </div>
                        </div>
                        {/* Status Badge & Time */}
                        <div className="flex flex-col items-end gap-1">
                            <div className="px-1.5 py-0.5 rounded bg-white/60 border border-emerald-200 backdrop-blur-sm">
                                <p className="text-[8px] font-bold text-emerald-700 uppercase tracking-wide">VERIFIED</p>
                            </div>
                            <p className="text-[9px] font-medium text-emerald-800/50">
                                {transaction.created_at ? new Date(transaction.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Body Section (Amount & Description) - CLEAN WHITE */}
                <div className="p-3.5 pt-4 pb-3 relative z-10 bg-white">
                    {/* Premium Texture Overlay (Body Only - Subtle) */}
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-0"
                        style={{
                            backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)',
                            backgroundSize: '12px 12px'
                        }}
                    />

                    <div className="text-center mb-3 relative z-10">
                        <p className="text-[10px] font-medium text-gray-500 mb-0.5">Total Transaksi</p>
                        <p className={`text-lg font-extrabold tracking-tight ${transaction.type === 'expense' ? 'text-gray-900' : 'text-[#00875A]'
                            }`}>
                            Rp {transaction.amount.toLocaleString('id-ID')}
                        </p>
                    </div>

                    {transaction.description && (
                        <div className="relative z-10 bg-gray-50 rounded px-2.5 py-2 border border-gray-100 mb-3">
                            <p className="text-[10px] font-semibold text-gray-500 mb-0.5">Catatan</p>
                            <p className="text-xs text-gray-700 italic relative pl-2 border-l-2 border-emerald-200">
                                "{transaction.description}"
                            </p>
                        </div>
                    )}

                    {/* 3. Footer Action */}
                    <div className="relative z-10">
                        {isSaved ? (
                            <div className="w-full py-2 bg-[#00875A]/10 rounded-lg flex items-center justify-center gap-1.5 text-[#00875A] font-bold text-xs border border-[#00875A]/20">
                                <div className="w-4 h-4 rounded-full bg-[#00875A] flex items-center justify-center">
                                    <CheckCircle2 size={10} className="text-white" strokeWidth={3} />
                                </div>
                                Tersimpan
                            </div>
                        ) : (
                            <button
                                onClick={onSave}
                                className="w-full py-2 bg-[#00875A] text-white font-bold rounded-lg shadow-lg shadow-[#00875A]/20 hover:bg-[#006644] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 text-xs group/btn"
                            >
                                <CheckCircle2 size={14} className="group-hover/btn:scale-110 transition-transform" />
                                Simpan Sekarang
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

export function ChatInterface({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { user } = useAuth();

    // State
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [showPhotoOptions, setShowPhotoOptions] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    // Refs
    // Use a strict Callback Ref for the scroll container to handle mount timing
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const setScrollRef = useCallback((node: HTMLDivElement | null) => {
        scrollRef.current = node;
        if (node) {
            // Instant jump to bottom on mount
            node.scrollTop = node.scrollHeight;
        }
    }, []);

    // Other refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // --- Media Handlers ---

    // Camera & Voice logic remains largely similar but cleaner
    const startCamera = async () => {
        setShowPhotoOptions(false);
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setTimeout(() => {
                if (videoRef.current) videoRef.current.srcObject = stream;
            }, 100);
            streamRef.current = stream;
        } catch (err) {
            console.error("Camera error:", err);
            alert("Gagal mengakses kamera.");
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0);
            const base64 = canvas.toDataURL('image/jpeg', 0.8);
            sendToAI(base64, 'image/jpeg');
            stopCamera();
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setShowPhotoOptions(false); // Close the menu after selection
        const reader = new FileReader();
        reader.onloadend = () => sendToAI(reader.result as string, file.type);
        reader.readAsDataURL(file);
    };

    const isRecordingRef = useRef(false);

    const startRecording = async () => {
        if (isLoading) return; // Prevent recording if loading

        try {
            isRecordingRef.current = true; // Mark intention to record
            setIsRecording(true);

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Should we still record?
            if (!isRecordingRef.current) {
                stream.getTracks().forEach(t => t.stop());
                setIsRecording(false);
                return;
            }

            streamRef.current = stream;
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks: Blob[] = [];

            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                if (blob.size > 0) {
                    const reader = new FileReader();
                    reader.onloadend = () => sendToAI(reader.result as string, 'audio/webm');
                    reader.readAsDataURL(blob);
                }
                stream.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            };

            mediaRecorder.start();
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
        } catch (err) {
            console.error("Mic Error:", err);
            alert("Gagal mengakses mikrofon.");
            setIsRecording(false);
            isRecordingRef.current = false;
        }
    };

    const stopRecording = () => {
        isRecordingRef.current = false; // Signal to stop

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }

        setIsRecording(false);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // --- Chat Logic ---

    // Load History
    useEffect(() => {
        if (!user?.id) return;
        const saved = localStorage.getItem(`chat_history_${user.id}`);
        const defaultMsg: Message = {
            id: 'default',
            role: 'assistant',
            content: 'Halo! Ada pengeluaran atau pemasukan apa hari ini?',
            timestamp: new Date()
        };

        if (saved) {
            try {
                const parsed = JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
                setMessages(parsed.length > 0 ? parsed : [defaultMsg]);
            } catch {
                setMessages([defaultMsg]);
            }
        } else {
            setMessages([defaultMsg]);
        }
    }, [user?.id]);

    // Save History & Scroll
    useEffect(() => {
        if (!user?.id || messages.length === 0) return;

        // Save history (including attachments for MVP persistence)
        // Note: In production, large base64 strings should be uploaded to storage, not kept in localStorage.
        localStorage.setItem(`chat_history_${user.id}`, JSON.stringify(messages));
    }, [messages, user?.id]);

    // Robust Scroll Effect
    useLayoutEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]); // Trigger on every message update

    const sendToAI = async (mediaBase64?: string, mimeType?: string) => {
        if ((!input.trim() && !mediaBase64) || isLoading) return;

        const contentDisplay = mimeType?.startsWith('audio/') ? "Voice Note" :
            mediaBase64 ? "Foto Struk" : input;

        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: contentDisplay,
            timestamp: new Date(),
            mediaType: mimeType?.startsWith('audio/') ? 'voice' : mediaBase64 ? 'image' : undefined,
            attachment: mediaBase64
        };

        setMessages(p => [...p, newMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input || (mediaBase64 ? "Extract data" : ""),
                    image: mediaBase64 ? mediaBase64.split(',')[1] : null,
                    mimeType
                })
            });

            const data = await res.json();

            // Auto-save logic
            let saved = false;
            if (data.transaction && user?.id) {
                const { createClient } = await import('@/lib/supabase/client');
                const supabase = createClient();
                const { error } = await supabase.from('transactions').insert({
                    user_id: user.id,
                    ...data.transaction,
                    source: 'chat'
                });
                if (!error) {
                    saved = true;
                    // Dispatch event to notify Home page to refresh
                    window.dispatchEvent(new Event('transaction-saved'));
                }
            }

            const botReply: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply,
                transaction: data.transaction,
                saved,
                timestamp: new Date()
            };
            setMessages(p => [...p, botReply]);
        } catch (e) {
            setMessages(p => [...p, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "Maaf, ada gangguan. Coba lagi ya.",
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSend = () => sendToAI();

    // --- Render ---

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md h-full flex flex-col bg-[#F4F5F7] font-sans shadow-2xl relative overflow-hidden">

                {/* 1. Header */}
                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-4 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#00875A] flex items-center justify-center shadow-md">
                            <Bot className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="font-bold text-[#172B4D] text-sm leading-tight">Asisten Keuangan</h2>
                            <p className="text-[10px] uppercase tracking-wider text-[#00875A] font-semibold">Online</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-gray-100 text-[#6B778C] hover:bg-gray-200 hover:text-[#172B4D] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 2. Chat Area */}
                <div
                    ref={setScrollRef} // Using Callback Ref
                    className="flex-1 overflow-y-auto px-4 pt-20 pb-4 space-y-6 scroll-smooth"
                    style={{ scrollBehavior: 'auto' }} // CSS override to enforce instant scroll logic if needed
                >
                    {/* Welcome Timestamp */}
                    <div className="flex justify-center my-4">
                        <span className="text-[10px] font-medium text-[#6B778C] bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                            Hari ini, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                        </span>
                    </div>

                    {messages.map((msg, idx) => {
                        const isUser = msg.role === 'user';
                        const showAvatar = !isUser && (idx === 0 || messages[idx - 1].role === 'user');

                        return (
                            <div key={msg.id} className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
                                <div className={cn("flex max-w-[85%] gap-2", isUser ? "flex-row-reverse" : "flex-row")}>

                                    {/* Bot Avatar */}
                                    {!isUser && (
                                        <div className={cn("w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center bg-white mt-1 border border-gray-200 shadow-sm", !showAvatar && "invisible")}>
                                            <Bot size={14} className="text-[#00875A]" />
                                        </div>
                                    )}

                                    <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
                                        {/* Message Bubble */}
                                        <div className={cn(
                                            "relative px-4 py-2.5 shadow-sm text-sm leading-relaxed",
                                            isUser
                                                ? "bg-[#00875A] text-white rounded-2xl rounded-tr-sm shadow-md"
                                                : "bg-white border border-gray-100 text-[#172B4D] rounded-2xl rounded-tl-sm shadow-sm"
                                        )}>
                                            {/* Image Display */}
                                            {msg.mediaType === 'image' && msg.attachment && (
                                                <div className="mb-2 -mx-2 -mt-1">
                                                    <ImageBubble src={msg.attachment} />
                                                </div>
                                            )}

                                            {/* Voice Note Display - WhatsApp Style */}
                                            {msg.mediaType === 'voice' && msg.attachment && (
                                                <VoiceNoteBubble audioSrc={msg.attachment} duration={recordingTime} />
                                            )}

                                            {/* Text Content (hide for media-only messages) */}
                                            {(!msg.mediaType || (msg.mediaType && msg.content !== 'Voice Note' && msg.content !== 'Foto Struk')) && (
                                                <span>{msg.content}</span>
                                            )}

                                            {/* Transaction Preview */}
                                            {msg.transaction && (
                                                <TransactionCard
                                                    transaction={msg.transaction}
                                                    isSaved={msg.saved}
                                                    onSave={async () => {
                                                        // Simplified manual save for UI demo
                                                        // In real app, reuse the save logic
                                                    }}
                                                />
                                            )}
                                        </div>

                                        {/* Timestamp */}
                                        <span className="text-[10px] text-slate-500 mt-1 px-1 opacity-70">
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {isLoading && (
                        <div className="flex justify-start w-full pl-8 animate-in fade-in">
                            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-2 shadow-sm">
                                <TypingIndicator />
                            </div>
                        </div>
                    )}

                    {/* Spacer for bottom input */}
                    <div className="h-4" />
                </div>

                {/* 3. Floating Input Area - WhatsApp Style */}
                <div className="px-2 pt-1.5 pb-2 bg-white border-t border-gray-100 z-20">
                    {/* Recording Indicator Bar */}
                    {isRecording && (
                        <div className="flex items-center gap-3 px-4 py-2 mb-2 bg-[#FF5630]/10 rounded-xl animate-pulse">
                            <div className="w-3 h-3 bg-[#FF5630] rounded-full animate-pulse" />
                            <span className="text-sm font-medium text-[#FF5630]">Merekam... {formatTime(recordingTime)}</span>
                            <div className="flex-1" />
                            <button
                                type="button"
                                onClick={stopRecording}
                                className="text-xs font-medium text-[#6B778C] hover:text-[#FF5630] transition"
                            >
                                Batal
                            </button>
                        </div>
                    )}

                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex items-end gap-2"
                    >
                        {/* Photo Menu Button (Left) */}
                        <button
                            type="button"
                            onClick={() => setShowPhotoOptions(!showPhotoOptions)}
                            className={cn(
                                "p-2.5 rounded-full text-[#6B778C] hover:text-[#00875A] hover:bg-[#F4F5F7] transition-all flex-shrink-0",
                                showPhotoOptions && "text-[#00875A] bg-[#F4F5F7]"
                            )}
                        >
                            <Camera size={22} />
                        </button>

                        {/* Input Field Container */}
                        <div className="flex-1 bg-[#F4F5F7] rounded-full border border-gray-200 focus-within:border-[#00875A] focus-within:bg-white transition-all flex items-center px-4 py-2 relative">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ketik pesan..."
                                className="w-full bg-transparent text-[#172B4D] placeholder:text-[#6B778C] text-sm focus:outline-none"
                                disabled={isRecording}
                            />
                            {showPhotoOptions && (
                                <div className="absolute bottom-[130%] left-0 bg-white rounded-xl shadow-xl border border-gray-100 p-2 flex flex-col gap-2 min-w-[160px] animate-in slide-in-from-bottom-2 zoom-in-95 origin-bottom-left z-30">
                                    <button type="button" onClick={startCamera} className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#172B4D] hover:bg-gray-50 rounded-lg transition text-left group">
                                        <div className="w-8 h-8 rounded-full bg-[#00875A]/20 flex items-center justify-center group-hover:bg-[#00875A]/30 transition">
                                            <Camera size={16} className="text-[#00875A]" />
                                        </div>
                                        Ambil Foto
                                    </button>
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#172B4D] hover:bg-gray-50 rounded-lg transition text-left group">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition">
                                            <ImagePlus size={16} className="text-blue-500" />
                                        </div>
                                        Upload Galeri
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right Side: Mic OR Send Button */}
                        {input.trim() ? (
                            /* Send Button - appears when there's text */
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="p-2.5 rounded-full bg-[#00875A] text-white shadow-md active:scale-95 transition-all flex-shrink-0 hover:bg-[#006644] disabled:opacity-50"
                            >
                                <Send size={20} />
                            </button>
                        ) : (
                            /* Mic Button - tap to toggle recording */
                            <button
                                type="button"
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={isLoading}
                                className={cn(
                                    "p-2.5 rounded-full transition-all flex-shrink-0 active:scale-95",
                                    isRecording
                                        ? "bg-[#FF5630] text-white shadow-md animate-pulse"
                                        : "bg-[#F4F5F7] text-[#6B778C] hover:text-[#FF5630] hover:bg-[#FF5630]/10",
                                    isLoading && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <Mic size={20} />
                            </button>
                        )}
                    </form>
                </div>

                {/* 4. Full Screen Camera Modal (Overlay) */}
                {isCameraOpen && (
                    <div className="absolute inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-300">
                        <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
                        <div className="bg-gradient-to-t from-black via-black/50 to-transparent p-8 flex justify-between items-center pb-12 safe-area-pb">
                            <button onClick={stopCamera} className="p-4 rounded-full bg-slate-800/50 backdrop-blur-md text-white border border-white/10 hover:bg-slate-800 transition">
                                <X size={24} />
                            </button>
                            <button onClick={capturePhoto} className="p-1 rounded-full border-4 border-white/30 hover:border-white/50 transition-all">
                                <div className="w-16 h-16 rounded-full bg-white active:scale-90 transition-transform shadow-lg shadow-white/20" />
                            </button>
                            <div className="w-12" />
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                )}

                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
        </div>
    );
}
