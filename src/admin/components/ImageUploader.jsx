import { useId, useState } from 'react'
import './ImageUploader.css'

export default function ImageUploader({ images, onUpload, onRemove, uploading, multiple = true }) {
  const [dragOver, setDragOver] = useState(false)
  const inputId = useId()

  function handleFiles(fileList, inputEl) {
    if (!fileList || fileList.length === 0) return
    // فایل‌ها قبل از ریست‌کردن input کپی می‌شوند (FileList زنده است)
    const files = Array.from(fileList)
    // بدون ریست، انتخاب دوباره‌ی همان عکس (مثلاً بعد از خطا) هیچ واکنشی نداشت
    if (inputEl) inputEl.value = ''
    onUpload(files)
  }

  return (
    <div className="image-uploader">
      <div
        className={'image-uploader__drop' + (dragOver ? ' image-uploader__drop--active' : '')}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFiles(e.dataTransfer.files, null)
        }}
      >
        <input
          type="file"
          accept="image/*"
          multiple={multiple}
          id={inputId}
          onChange={(e) => handleFiles(e.target.files, e.target)}
          disabled={uploading}
        />
        <label htmlFor={inputId} className="image-uploader__label">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
            <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
          </svg>
          <span>{uploading ? 'در حال آپلود تصویر...' : 'برای آپلود تصویر کلیک کنید یا بکشید و رها کنید'}</span>
          <span className="image-uploader__hint">فرمت JPG یا PNG</span>
        </label>
      </div>

      {images.length > 0 && (
        <div className="image-uploader__grid">
          {images.map((img, i) => (
            <div className="image-uploader__item" key={img.path || img}>
              <img src={img.url || img} alt={`تصویر ${i + 1}`} />
              <button
                type="button"
                className="image-uploader__remove"
                onClick={() => onRemove(i)}
                aria-label="حذف تصویر"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
