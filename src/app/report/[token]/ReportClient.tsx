"use client";

import { useRef, useState } from "react";
import { CheckCircle2, AlertCircle, Camera, Upload, Send } from "lucide-react";

type FormState = "idle" | "submitting" | "success" | "error";

export default function ReportClient({ token }: { token: string }) {
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState("");
  const [urgent, setUrgent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png", "image/heic", "image/webp"].includes(file.type)) {
      setError("Please choose a photo (JPG, PNG, HEIC).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Photo is too large. Maximum size is 10MB.");
      return;
    }
    setError("");
    setPhoto(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      setError("Please describe what happened.");
      return;
    }

    setState("submitting");
    setError("");

    const formData = new FormData();
    formData.append("description", description.trim());
    if (location.trim()) formData.append("location", location.trim());
    if (name.trim()) formData.append("reportedByName", name.trim());
    if (contact.trim()) formData.append("reportedByContact", contact.trim());
    if (photo) formData.append("photo", photo);

    try {
      const res = await fetch(`/api/report/${token}`, { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setState("error");
        return;
      }

      setUrgent(!!data.urgent);
      setState("success");
    } catch {
      setError("Network error. Please check your connection and try again.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="bg-white rounded-2xl border border-green-200 p-8 shadow-sm text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Thank you — this has been reported</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          {urgent
            ? "This has been logged and the site safety contact has been notified immediately."
            : "This has been logged in the safety register and will be reviewed shortly."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-900 block mb-1.5">What happened?</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="Describe what happened, when, and anything involved (equipment, people, location)…"
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors resize-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-900 block mb-1.5">Location (optional)</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Pit 3, crib room, workshop bay 2"
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-900 block mb-1.5">Photo (optional)</label>
        {photo ? (
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5">
            <span className="text-sm text-gray-600 truncate">{photo.name}</span>
            <button type="button" onClick={() => setPhoto(null)} className="text-xs text-red-500 font-medium">Remove</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-xl hover:bg-gray-200 transition-colors flex-1 justify-center"
            >
              <Upload className="w-3.5 h-3.5" /> Upload
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-xl hover:bg-gray-200 transition-colors flex-1 justify-center"
            >
              <Camera className="w-3.5 h-3.5" /> Camera
            </button>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-400 mb-3">
          Reporting anonymously is fine — leave these blank if you&apos;d prefer not to share.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
          />
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Phone/email (optional)"
            className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {error && (
        <p className="flex items-start gap-1.5 text-red-500 text-xs">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl py-3 transition-colors"
      >
        {state === "submitting" ? "Submitting…" : (
          <>
            <Send className="w-4 h-4" /> Submit report
          </>
        )}
      </button>
    </form>
  );
}
