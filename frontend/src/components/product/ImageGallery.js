import { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize } from 'lucide-react';
import { Img, Modal } from '../common/UI';
export default function ImageGallery({ images, name, imageRef }) {
  const [index, setIndex] = useState(0),
    [full, setFull] = useState(false);
  return (
    <div className="gallery">
      <div className="gallery-main">
        <Img src={images[index]} alt={name} ref={imageRef} />
        <button
          className="gallery-full icon-btn"
          aria-label="View fullscreen image"
          onClick={() => setFull(true)}
        >
          <Maximize size={18} />
        </button>
        <div className="gallery-controls">
          <button
            aria-label="Previous image"
            onClick={() => setIndex((index + images.length - 1) % images.length)}
          >
            <ChevronLeft size={17} />
          </button>
          <span>
            {index + 1} / {images.length}
          </span>
          <button aria-label="Next image" onClick={() => setIndex((index + 1) % images.length)}>
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
      <div className="gallery-thumbs">
        {images.map((src, i) => (
          <button
            key={i}
            className={i === index ? 'active' : ''}
            aria-label={'View image ' + (i + 1)}
            onClick={() => setIndex(i)}
          >
            <Img src={src} alt={name + ' view ' + (i + 1)} />
          </button>
        ))}
      </div>
      {full && (
        <Modal title={name} onClose={() => setFull(false)}>
          <Img className="fullscreen-image" src={images[index]} alt={name} />
        </Modal>
      )}
    </div>
  );
}
