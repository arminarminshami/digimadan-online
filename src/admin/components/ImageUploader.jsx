import { useState } from 'react'
import './ImageUploader.css'

export default function ImageUploader({ images, onUpload, onRemove, uploading, multiple = true }) {
  const [dragOver, setDragOver] = useState(false)

  function handleFiles(fileList) {
    if (!fileList || fileList.length === 0) return
    onUpload(fileList)
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
          handleFiles(e.dataTransfer.files)
        }}
      >
        <input
          type="file"
          accept="image/*"
          multiple={multiple}
          id="image-upload-input"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
        />
        <label htmlFor="image-upload-input" className="image-uploader__label">
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
