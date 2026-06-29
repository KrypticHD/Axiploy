"use client";

import { useState, useRef } from "react";
import { CheckCircle2, Clock, Upload, AlertCircle, FileText, Camera } from "lucide-react";

interface Document {
  id: string;
  name: string;
  required: boolean;
  received: boolean;
  receivedAt: string | null;
  fileUrl: string | null;
}

interface Props {
  token: string;
  employeeName: string;
  documents: Document[];
  receivedCount: number;
  requiredCount: number;
  initialStatus: string;
}

type DocState = "idle" | "uploading" | "success" | "error";

interface DocStatus {
  state: DocState;
  error?: string;
  receivedAt?: string;
}

export default function OnboardClient({ token, documents, receivedCount, requiredCount, initialStatus }: Props) {
  const [docs, setDocs] = useState<Document[]>(documents);
  const [received, setReceived] = useState(receivedCount);
  const [docStatuses, setDocStatuses] = useState<Record<string, DocStatus>>({});
  const [allComplete, setAllComplete] = useState(initialStatus === "Ready for Review" && receivedCount >= requiredCount);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const progress = requiredCount > 0 ? Math.round((received / requiredCount) * 100) : 0;

  function setDocStatus(id: string, status: DocStatus) {
    setDocStatuses((prev) => ({ ...prev, [id]: status }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, doc: Document) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/heic", "image/webp"];
    if (!allowed.includes(file.type)) {
      setDocStatus(doc.id, { state: "error", error: "Please upload a PDF or image file (JPG, PNG, HEIC)." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setDocStatus(doc.id, { state: "error", error: "File is too large. Maximum size is 10MB." });
      return;
    }

    setDocStatus(doc.id, { state: "uploading" });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentId", doc.id);
    formData.append("documentName", doc.name);

    try {
      const res = await fetch(`/api/onboard/${token}/upload`, { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setDocStatus(doc.id, { state: "error", error: data.error || "Upload failed. Please try again." });
        return;
      }

      const now = new Date().toISOString();
      setDocStatus(doc.id, { state: "success", receivedAt: now });
      setDocs((prev) => prev.map((d) => d.id === doc.id ? { ...d, received: true, receivedAt: now } : d));
      setReceived((n) => n + 1);
      if (data.allComplete) setAllComplete(true);
    } catch {
      setDocStatus(doc.id, { state: "error", error: "Network error. Please check your connection and try again." });
    }

    // Reset input so same file can be re-uploaded if needed
    if (fileInputRefs.current[doc.id]) fileInputRefs.current[doc.id]!.value = "";
  }

  if (allComplete) {
    return (
      <div className="bg-white rounded-2xl border border-green-200 p-8 shadow-sm text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">All documents received!</h2>
        <p className="text-gray-500 text-sm">
          Your onboarding documents have been submitted successfully.
          Your employer will review them shortly and be in touch.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-gray-900 text-sm">
            {received} of {requiredCount} documents received
          </span>
          <span className="text-sm font-bold text-blue-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {received < requiredCount && (
          <p className="text-xs text-gray-400 mt-2">
            {requiredCount - received} document{requiredCount - received !== 1 ? "s" : ""} still needed
          </p>
        )}
      </div>

      {/* Document list */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        {docs.map((doc) => {
          const status = docStatuses[doc.id];
          const isReceived = doc.received || status?.state === "success";
          const isUploading = status?.state === "uploading";
          const isError = status?.state === "error";
          const receivedAt = doc.receivedAt || status?.receivedAt;

          return (
            <div key={doc.id} className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5 ${
                  isReceived ? "bg-green-100" : isError ? "bg-red-50" : "bg-gray-100"
                }`}>
                  {isReceived ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : isUploading ? (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FileText className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium text-sm ${isReceived ? "text-gray-500 line-through" : "text-gray-900"}`}>
                      {doc.name}
                    </span>
                    {doc.required && !isReceived && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">Required</span>
                    )}
                  </div>

                  {isReceived && receivedAt && (
                    <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Received {new Date(receivedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}

                  {isError && (
                    <p className="text-xs text-red-500 mt-1 flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {status.error}
                    </p>
                  )}

                  {isUploading && (
                    <p className="text-xs text-blue-500 mt-0.5">Uploading...</p>
                  )}
                </div>

                {/* Upload button */}
                {!isReceived && !isUploading && (
                  <div className="flex-shrink-0 flex flex-col gap-1.5">
                    <button
                      onClick={() => fileInputRefs.current[doc.id]?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 active:scale-95 transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload
                    </button>
                    <button
                      onClick={() => {
                        const input = fileInputRefs.current[`${doc.id}_camera`];
                        if (input) input.click();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 active:scale-95 transition-all"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Camera
                    </button>
                  </div>
                )}
              </div>

              {/* Hidden file inputs */}
              <input
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                ref={(el) => { fileInputRefs.current[doc.id] = el; }}
                onChange={(e) => handleFileChange(e, doc)}
              />
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                ref={(el) => { fileInputRefs.current[`${doc.id}_camera`] = el; }}
                onChange={(e) => handleFileChange(e, doc)}
              />
            </div>
          );
        })}
      </div>

      {/* Help text */}
      <div className="flex items-start gap-2 text-xs text-gray-400 px-1">
        <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          Upload PDFs or photos of your documents. Each file must be under 10MB.
          Accepted formats: PDF, JPG, PNG, HEIC.
        </span>
      </div>
    </div>
  );
}
