"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import DivinationAnimation from "./DivinationAnimation";
import { cn } from "@/lib/utils";

interface InterpretationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    loading: boolean;
    interpretation: string;
    question: string;
}

export default function InterpretationModal({
    open,
    onOpenChange,
    loading,
    interpretation,
    question,
}: InterpretationModalProps) {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        if (!interpretation) return;
        try {
            await navigator.clipboard.writeText(interpretation);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[70vh] flex flex-col p-0 gap-0 bg-stone-50/95 backdrop-blur-xl border-stone-200 shadow-2xl overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b border-stone-100 flex-shrink-0">
                    <DialogTitle className="text-center font-serif text-xl text-stone-800">
                        {loading ? "正在解卦" : "卦象解读"}
                    </DialogTitle>
                </DialogHeader>

                <div className={cn("flex-1 p-6 relative min-h-[300px]", loading ? "overflow-hidden flex items-center justify-center" : "overflow-y-auto")}>
                    {loading ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <DivinationAnimation />
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
                            {question && (
                                <div className="text-center mb-6 p-4 bg-stone-100/50 rounded-lg border border-stone-100">
                                    <p className="text-sm text-stone-500 mb-1 font-serif">所问之事</p>
                                    <p className="text-lg font-bold text-stone-800 font-serif">{question}</p>
                                </div>
                            )}

                            <div className="prose prose-stone max-w-none font-serif leading-loose text-stone-700">
                                <ReactMarkdown>{interpretation}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>

                {!loading && (
                    <div className="p-4 border-t border-stone-100 bg-white/50 flex justify-between items-center flex-shrink-0">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="border-stone-200 hover:bg-stone-100 text-stone-600"
                        >
                            关闭
                        </Button>
                        <Button
                            onClick={handleCopy}
                            className={cn(
                                "bg-stone-800 hover:bg-stone-700 text-white transition-all",
                                isCopied && "bg-green-600 hover:bg-green-600"
                            )}
                        >
                            {isCopied ? (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    已复制
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4 mr-2" />
                                    复制解读
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
