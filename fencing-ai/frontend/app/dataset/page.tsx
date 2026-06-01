"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, CheckCircle2, Circle, Database } from "lucide-react";
import { getApiUrl } from "@/lib/api-url";

type Video = {
  id: string;
  url: string;
  frames: number;
  labels: number;
  reviewed: boolean;
};

export default function DatasetPage() {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get<Video[]>(`${getApiUrl()}/api/dataset/videos`)
      .then(({ data }) => setVideos(data))
      .catch((e) =>
        setError(e.response?.data?.detail || "Could not load dataset. Is the backend running and the dataset built?")
      );
  }, []);

  const reviewedCount = videos?.filter((v) => v.reviewed).length ?? 0;

  return (
    <main className="min-h-screen px-4 py-10 max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <Database className="w-7 h-7 text-blue-400" />
        <h1 className="text-3xl font-bold">Training Dataset</h1>
      </div>
      <p className="text-gray-400 mb-8 text-sm">
        Review and correct Claude&apos;s auto-generated labels. Corrected labels let the
        trained model surpass its teacher.
        {videos && videos.length > 0 && (
          <span className="ml-1 text-gray-300">
            {reviewedCount}/{videos.length} reviewed.
          </span>
        )}
      </p>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {videos && videos.length === 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 text-center text-gray-400">
          <p className="mb-2">No videos in the dataset yet.</p>
          <p className="text-sm">
            Build one with:{" "}
            <code className="bg-gray-800 px-2 py-1 rounded text-gray-300">
              python -m dataset.build_dataset dataset/urls.txt
            </code>
          </p>
        </div>
      )}

      <div className="space-y-2">
        {videos?.map((v) => (
          <Link
            key={v.id}
            href={`/dataset/${v.id}`}
            className="flex items-center gap-4 bg-gray-900 border border-gray-700 hover:border-gray-500 rounded-xl px-4 py-3 transition-colors"
          >
            {v.reviewed ? (
              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-gray-600 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{v.url}</div>
              <div className="text-xs text-gray-500">
                {v.frames} frames · {v.labels} labels
              </div>
            </div>
            <span className="text-xs text-gray-500 shrink-0">{v.reviewed ? "Reviewed" : "Needs review"}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
