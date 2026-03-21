import { useCallback, useState } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, ImageIcon, X, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface ImageDropzoneProps {
  onFileAccepted: (file: File) => void
  disabled?: boolean
}

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/tiff': ['.tif', '.tiff'],
}

const MAX_SIZE_MB = 50
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

export function ImageDropzone({ onFileAccepted, disabled }: ImageDropzoneProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null)
  // Fix 1: track hover state independently from drag state
  const [isHovered, setIsHovered] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        const error = rejectedFiles[0].errors[0]
        toast.error(`File rejected: ${error.message}`)
        return
      }

      const file = acceptedFiles[0]
      if (!file) return

      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)

      // Use FileReader to force the browser to actually open and read
      // the file, which guarantees the File object's metadata (including
      // size) is fully populated. We read just 1 byte — we don't need
      // the content, just the side effect of the browser resolving the file.
      const reader = new FileReader()
      reader.onloadend = () => {
        setFileInfo({
          name: file.name,
          size: file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
            : `${(file.size / 1024).toFixed(1)} KB`,
        })
      }
      // Reading as ArrayBuffer forces full file metadata resolution
      reader.readAsArrayBuffer(file.slice(0, 1))

      onFileAccepted(file)
    },
    [onFileAccepted]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE_BYTES,
    maxFiles: 1,
    disabled,
  })

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setFileInfo(null)
  }

  // The border and background should react to EITHER dragging OR hovering
  const isHighlighted = isDragActive || isHovered

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              {...getRootProps()}
              // Fix 1: attach hover handlers to the dropzone root div
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="relative rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer"
              style={{
                background: isHighlighted
                  ? 'rgba(6, 182, 212, 0.08)'
                  : 'var(--color-bg-card)',
                border: `2px dashed ${isHighlighted ? 'var(--color-teal)' : 'var(--color-border)'}`,
                transition: 'all 0.2s ease',
              }}
            >
              <input {...getInputProps()} />

              <motion.div
                animate={isHighlighted ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: isHighlighted
                    ? 'rgba(6, 182, 212, 0.15)'
                    : 'rgba(255,255,255,0.05)',
                }}
              >
                <Upload
                  size={28}
                  style={{
                    color: isHighlighted ? 'var(--color-teal)' : 'var(--color-muted)',
                  }}
                />
              </motion.div>

              <p
                className="text-base font-semibold mb-1"
                style={{ fontFamily: 'Syne, sans-serif', color: 'hsl(var(--foreground))' }}
              >
                {isDragActive ? 'Release to analyze' : 'Drop satellite image here'}
              </p>
              <p
                className="text-sm"
                style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
              >
                or click to browse — JPG, PNG, TIFF up to {MAX_SIZE_MB}MB
              </p>

              {disabled && (
                <div
                  className="absolute inset-0 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(9, 14, 26, 0.7)' }}
                >
                  <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                    Processing in progress...
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl overflow-hidden relative"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <img
              src={preview}
              alt="Satellite image preview"
              className="w-full h-64 object-cover"
            />
            <div
              className="p-4 flex items-center justify-between"
              style={{ background: 'var(--color-bg-card)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(6, 182, 212, 0.15)' }}
                >
                  <ImageIcon size={14} style={{ color: 'var(--color-teal)' }} />
                </div>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: 'hsl(var(--foreground))',
                      fontFamily: 'IBM Plex Mono, monospace',
                    }}
                  >
                    {fileInfo?.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    {fileInfo?.size ?? 'Reading...'}
                  </p>
                </div>
              </div>
              {!disabled && (
                <button
                  onClick={clearFile}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                  style={{ border: '1px solid var(--color-border)' }}
                >
                  <X size={14} style={{ color: 'var(--color-muted)' }} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 mt-3 px-2">
        <AlertCircle size={12} style={{ color: 'var(--color-muted)' }} />
        <p
          className="text-xs"
          style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
        >
          Supported: EuroSAT-compatible satellite and drone imagery
        </p>
      </div>
    </div>
  )
}