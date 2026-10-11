import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Link } from "react-router-dom";
import { Upload, ArrowUpRight, X } from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader } from "@/components/ui/PageHeader";
import { ReportBody } from "@/components/reports/ReportBody";
import { isDemo } from "@/lib/config";
import { useImageAnalysis } from "@/hooks/useImageAnalysis";
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState(""),
    [fileError, setFileError] = useState("");
  const analysis = useImageAnalysis();
  const choose = (next: File | null) => {
    analysis.reset();
    setFile(next);
    setFileError("");
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] },
    maxSize: MAX_UPLOAD_SIZE,
    multiple: false,
    onDropAccepted: (files) => choose(files[0]),
    onDropRejected: () => {
      choose(null);
      setFileError("Choose one JPEG or PNG image, 5 MiB or smaller.");
    },
  });
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const busy = ["uploading", "queued", "running"].includes(analysis.state);
  const status = {
    idle: "Ready when you are.",
    uploading: "Uploading and validating the image…",
    queued: "Analysis queued. Waiting for the worker…",
    running: "Processing the image and preparing the report…",
    waiting:
      "Processing is taking longer than expected. The backend may still be working.",
    complete:
      analysis.result?.status === "inconclusive"
        ? "Analysis inconclusive."
        : "Analysis saved.",
    error: analysis.error,
  }[analysis.state];
  return (
    <PageTransition>
      <PageHeader
        number="02"
        title="A different perspective."
        description="Start with a satellite image. Explore its land cover, associated risks, and a considered interpretation."
      />
      {isDemo && (
        <div className="notice">
          This workspace is a demonstration. You can preview an image locally;
          analysis requires the connected backend.{" "}
          <Link to="/reports?report=sample-1">View a sample report ↗</Link>
        </div>
      )}
      <div className="upload-grid">
        <section>
          {file ? (
            <>
              <img
                className="image-preview"
                src={preview}
                alt={`Preview of ${file.name}`}
              />
              <div className="file-row">
                <span>
                  {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MiB
                </span>
                <button
                  className="icon-button"
                  aria-label="Remove selected image"
                  onClick={() => choose(null)}
                >
                  <X size={16} />
                </button>
              </div>
            </>
          ) : (
            <div
              {...getRootProps({
                className: `dropzone ${isDragActive ? "dragging" : ""}`,
                role: "button",
                "aria-label": "Choose a JPEG or PNG image",
              })}
            >
              <input
                {...getInputProps({ "aria-label": "Satellite image file" })}
              />
              <div className="drop-icon">
                <Upload size={23} />
              </div>
              <h2>Bring your image into focus.</h2>
              <p>Drop it here, or click to browse.</p>
              <p className="eyebrow">JPEG / PNG · Up to 5 MiB</p>
            </div>
          )}
          {fileError && (
            <p className="notice error" role="alert">
              {fileError}
            </p>
          )}
          <div className="upload-actions">
            <button
              className="button"
              disabled={
                !file || busy || isDemo || analysis.state === "complete"
              }
              onClick={() => file && void analysis.analyze(file)}
            >
              {busy
                ? "Processing…"
                : analysis.state === "waiting"
                  ? "Check status again"
                  : analysis.state === "error"
                    ? "Retry analysis"
                    : "Analyze image"}
              <ArrowUpRight size={16} />
            </button>
            {file && (
              <button className="text-button" onClick={() => choose(null)}>
                Choose another image
              </button>
            )}
          </div>
          {!isDemo && (
            <p
              className={
                analysis.state === "error" ? "notice error" : "record-meta"
              }
              role={analysis.state === "error" ? "alert" : "status"}
            >
              {status}
            </p>
          )}
        </section>
        <section className="panel">
          <p className="eyebrow">From image to interpretation</p>
          <ol className="process-list">
            <li>
              <b>01</b>
              <div>
                Identify land cover
                <p>
                  Three existing models classify the scene. Disagreement remains
                  visible.
                </p>
              </div>
            </li>
            <li>
              <b>02</b>
              <div>
                Read the risk index
                <p>
                  A fixed rule maps the classification to an environmental risk
                  category.
                </p>
              </div>
            </li>
            <li>
              <b>03</b>
              <div>
                Keep the original report
                <p>
                  The result and its narrative are saved together for later
                  review.
                </p>
              </div>
            </li>
          </ol>
          <p className="record-meta" style={{ marginTop: 30 }}>
            The index is an illustrative heuristic, not measured exposure or
            scientific confidence.
          </p>
        </section>
      </div>
      {analysis.result && (
        <section style={{ marginTop: 38 }} className="panel">
          <ReportBody report={analysis.result} />
          <Link
            className="text-button"
            style={{ marginTop: 24 }}
            to={`/reports?report=${analysis.result.id}`}
          >
            Open saved report <ArrowUpRight size={14} />
          </Link>
        </section>
      )}
    </PageTransition>
  );
}
