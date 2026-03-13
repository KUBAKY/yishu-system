"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

export type ImageAttachment = {
  name: string;
  type: string;
  dataUrl: string;
  note: string;
  category: string;
};

type ImageAttachmentFieldProps = {
  attachments: ImageAttachment[];
  onChange: (next: ImageAttachment[]) => void;
  label?: string;
  maxFiles?: number;
  defaultCategory?: string;
  allowCamera?: boolean;
  notePlaceholder?: string;
  categoryPlaceholder?: string;
  onError?: (message: string) => void;
};

export function ImageAttachmentField({
  attachments,
  onChange,
  label = "上传图片（最多6张，单张≤5MB）",
  maxFiles = 6,
  defaultCategory = "未分类",
  allowCamera = false,
  notePlaceholder = "标注重点（如方位/掌纹/面部特征）",
  categoryPlaceholder = "图片类别",
  onError,
}: ImageAttachmentFieldProps) {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [localError, setLocalError] = useState("");

  const setError = (message: string) => {
    setLocalError(message);
    if (onError) {
      onError(message);
    }
  };

  async function fileToDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => reject(new Error("图片读取失败"));
      reader.readAsDataURL(file);
    });
  }

  async function handleFilesChange(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    try {
      const remaining = Math.max(0, maxFiles - attachments.length);
      const picked = Array.from(fileList).slice(0, remaining);
      const next: ImageAttachment[] = [];
      for (const file of picked) {
        if (!file.type.startsWith("image/")) {
          throw new Error("仅支持图片文件");
        }
        if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
          throw new Error("暂仅支持 JPG/PNG/WebP/GIF，HEIC请先转换");
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("单张图片需小于5MB");
        }
        const dataUrl = await fileToDataUrl(file);
        if (!dataUrl) {
          throw new Error("图片编码失败");
        }
        next.push({
          name: file.name,
          type: file.type,
          dataUrl,
          note: "",
          category: defaultCategory,
        });
      }
      if (next.length > 0) {
        onChange([...attachments, ...next]);
        setError("");
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "图片上传失败");
    }
  }

  function updateAttachment(index: number, patch: Partial<ImageAttachment>) {
    onChange(attachments.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  function removeAttachment(index: number) {
    onChange(attachments.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="w-full space-y-3 text-left">
      <label className="block text-sm text-xuanpaper/70">{label}</label>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => {
          void handleFilesChange(event.target.files);
          event.currentTarget.value = "";
        }}
        className="w-full bg-white/5 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper"
      />
      {allowCamera ? (
        <>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={(event) => {
              void handleFilesChange(event.target.files);
              event.currentTarget.value = "";
            }}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => cameraInputRef.current?.click()}
          >
            直接拍照上传
          </Button>
        </>
      ) : null}
      {localError ? <p className="text-xs text-red-300">{localError}</p> : null}
      {attachments.length > 0 ? (
        <div className="space-y-3">
          {attachments.map((item, index) => (
            <div key={`${item.name}-${index}`} className="border border-gold-line/20 rounded-lg p-3 bg-black/20 space-y-2">
              <div className="relative w-full h-40 rounded-md border border-gold-line/20 overflow-hidden">
                <div
                  role="img"
                  aria-label={item.name}
                  className="w-full h-full bg-center bg-cover"
                  style={{ backgroundImage: `url("${item.dataUrl}")` }}
                />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  value={item.category}
                  onChange={(event) => updateAttachment(index, { category: event.target.value })}
                  placeholder={categoryPlaceholder}
                  className="w-full bg-white/5 border border-gold-line/30 rounded px-3 py-2 text-xuanpaper focus:border-gold-light outline-none"
                />
                <input
                  value={item.note}
                  onChange={(event) => updateAttachment(index, { note: event.target.value })}
                  placeholder={notePlaceholder}
                  className="w-full bg-white/5 border border-gold-line/30 rounded px-3 py-2 text-xuanpaper focus:border-gold-light outline-none"
                />
              </div>
              <div className="flex justify-between text-xs text-xuanpaper/60">
                <span>{item.name}</span>
                <button type="button" className="text-red-300 hover:text-red-200" onClick={() => removeAttachment(index)}>
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
